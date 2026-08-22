"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BellRing,
  CalendarIcon,
  CheckCircle2,
  Loader2,
  Lock,
  UserCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { ApiError } from "@/lib/api/client";
import { canAccessFeature, canStartTrial } from "@/lib/feature-access";
import {
  APPOINTMENT_STATUS_LABELS,
  taipeiToday,
} from "@/lib/constants/appointment";
import { usePollOnVisible } from "@/lib/hooks/use-poll-on-visible";
import { cn } from "@/lib/utils";
import type {
  AppointmentStatus,
  MedicalFacility,
  QueueGroup,
  QueueBoard,
} from "@/types/clinic";

const STATUS_PILL: Record<AppointmentStatus, string> = {
  confirmed: "bg-primary/10 text-primary",
  checked_in: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  in_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

function formatTime(time: string): string {
  return time.substring(0, 5);
}

// 從 ApiError 取後端繁中 detail，取不到用 fallback
function errorDetail(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const data = err.data as { detail?: unknown } | null;
    if (data && typeof data.detail === "string") return data.detail;
  }
  return fallback;
}

interface QueueTabProps {
  facilityId: string;
  facility: MedicalFacility;
}

export function QueueTab({ facilityId, facility }: QueueTabProps) {
  const accessible = canAccessFeature(facility, "queue_management");

  const [date, setDate] = useState(() => taipeiToday());
  const [board, setBoard] = useState<QueueBoard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 進行中的操作（"check-in:{預約id}" / "call-next:{staff_id|none}"），用來鎖定按鈕
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const fetchBoard = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setIsLoading(true);
      try {
        const data = await adminClinicsApi.queue.list(facilityId, date);
        setBoard(data);
        setError(null); // 看板成功更新後，清掉先前操作殘留的錯誤橫幅
      } catch (err) {
        console.error("Failed to fetch queue board:", err);
        if (!opts?.silent) {
          setError(errorDetail(err, "無法載入叫號台資料，請稍後再試"));
        }
      } finally {
        if (!opts?.silent) setIsLoading(false);
      }
    },
    [facilityId, date],
  );

  // 首次載入 / 換日期重抓
  useEffect(() => {
    if (!accessible) return;
    setError(null);
    void fetchBoard();
  }, [accessible, fetchBoard]);

  // 10 秒輪詢（頁籤可見才打；切回可見立即更新）
  const pollBoard = useCallback(
    () => void fetchBoard({ silent: true }),
    [fetchBoard],
  );
  usePollOnVisible(pollBoard, 10_000, accessible);

  // 櫃檯報到：confirmed → checked_in（成功後立即重抓）
  const handleCheckIn = async (appointmentId: string) => {
    setPendingAction(`check-in:${appointmentId}`);
    setError(null);
    try {
      await adminClinicsApi.queue.checkIn(facilityId, appointmentId);
      await fetchBoard({ silent: true });
    } catch (err) {
      console.error("Failed to check in:", err);
      setError(errorDetail(err, "報到失敗，請稍後再試"));
    } finally {
      setPendingAction(null);
    }
  };

  // 叫下一號（成功後立即重抓）
  const handleCallNext = async (staffId: string | null) => {
    setPendingAction(`call-next:${staffId ?? "none"}`);
    setError(null);
    try {
      await adminClinicsApi.queue.callNext(facilityId, {
        date,
        staff_id: staffId,
      });
      await fetchBoard({ silent: true });
    } catch (err) {
      console.error("Failed to call next:", err);
      setError(errorDetail(err, "叫號失敗，請稍後再試"));
    } finally {
      setPendingAction(null);
    }
  };

  // 完成看診：in_progress → completed。最後一位看診中且無人等待時，
  // 「叫下一號」無人可叫，這是唯一的結束出口（後端會一併收掉民眾的動態島）
  const handleComplete = async (appointmentId: string) => {
    setPendingAction(`complete:${appointmentId}`);
    setError(null);
    try {
      await adminClinicsApi.appointments.update(facilityId, appointmentId, {
        status: "completed",
      });
      await fetchBoard({ silent: true });
    } catch (err) {
      console.error("Failed to complete appointment:", err);
      setError(errorDetail(err, "完成看診失敗，請稍後再試"));
    } finally {
      setPendingAction(null);
    }
  };

  // 方案不足 → 升級提示（照客戶分析 gated 模式）
  if (!accessible) {
    return <UpgradeWall canTrial={canStartTrial(facility)} />;
  }

  return (
    <div className="space-y-4">
      {/* 日期選擇 */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={date === taipeiToday() ? "default" : "outline"}
          size="sm"
          onClick={() => setDate(taipeiToday())}
          className="h-8 text-xs"
        >
          今天
        </Button>
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            if (e.target.value) setDate(e.target.value);
          }}
          className="h-8 w-40 text-xs"
        />
        <p className="ml-auto text-xs text-muted-foreground">
          每 10 秒自動更新
        </p>
      </div>

      {/* 操作錯誤（如無可叫號、重複報到等後端 409 detail） */}
      {error && (
        <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      ) : !board || board.groups.length === 0 ? (
        <AdminEmptyState
          icon={CalendarIcon}
          title="本日無預約"
          description={`${date} 沒有任何預約，無需叫號`}
        />
      ) : (
        <div className="space-y-5">
          {board.groups.map((group) => (
            <QueueGroupCard
              key={group.staff_id ?? "none"}
              group={group}
              pendingAction={pendingAction}
              onCheckIn={handleCheckIn}
              onCallNext={handleCallNext}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 單一診次隊列卡：目前叫號大字 + 等待人數 + 叫下一號 + 報到名單表 */
function QueueGroupCard({
  group,
  pendingAction,
  onCheckIn,
  onCallNext,
  onComplete,
}: {
  group: QueueGroup;
  pendingAction: string | null;
  onCheckIn: (appointmentId: string) => void;
  onCallNext: (staffId: string | null) => void;
  onComplete: (appointmentId: string) => void;
}) {
  const callNextKey = `call-next:${group.staff_id ?? "none"}`;
  const isCalling = pendingAction === callNextKey;
  const isBusy = pendingAction !== null;
  const inProgress = group.appointments.find((a) => a.status === "in_progress");

  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5">
      {/* 隊列標頭 */}
      <div className="flex flex-col gap-4 border-b border-border/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <h3 className="truncate text-base font-semibold text-foreground">
            {group.staff_name ?? "不指定醫師"}
          </h3>
          {group.session_label && (
            <p className="text-xs text-muted-foreground">{group.session_label}</p>
          )}
        </div>

        <div className="flex items-center gap-5">
          {/* 目前叫號 */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">目前叫號</p>
            <p className="text-4xl font-bold text-primary tabular-nums">
              {group.current_number ?? "—"}
            </p>
            {inProgress && (
              <p className="max-w-28 truncate text-xs text-muted-foreground">
                {inProgress.patient_name}
              </p>
            )}
          </div>

          {/* 等待人數 */}
          <div className="text-center">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              等待人數
            </p>
            <p className="text-4xl font-bold text-foreground tabular-nums">
              {group.waiting_count}
            </p>
          </div>

          {/* 叫下一號 */}
          <Button
            size="lg"
            onClick={() => onCallNext(group.staff_id)}
            disabled={isBusy || group.waiting_count === 0}
            className="gap-1.5"
          >
            {isCalling ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <BellRing className="size-4" />
            )}
            叫下一號
          </Button>
        </div>
      </div>

      {/* 報到名單 */}
      <Table>
        <TableHeader className="bg-muted/40 [&_th]:font-medium [&_th]:text-muted-foreground">
          <TableRow>
            <TableHead className="w-16 text-center">號碼</TableHead>
            <TableHead>病患</TableHead>
            <TableHead className="w-20">時段</TableHead>
            <TableHead>服務項目</TableHead>
            <TableHead className="w-24">狀態</TableHead>
            <TableHead className="w-28 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {group.appointments.map((apt) => {
            const isCheckingIn = pendingAction === `check-in:${apt.id}`;
            const isCompleting = pendingAction === `complete:${apt.id}`;
            return (
              <TableRow
                key={apt.id}
                className={cn(
                  "transition hover:bg-muted/30",
                  apt.status === "in_progress" && "bg-primary/5",
                )}
              >
                <TableCell className="text-center text-base font-bold text-foreground tabular-nums">
                  {apt.queue_number ?? "—"}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {apt.patient_name}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {formatTime(apt.appointment_time)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {apt.service_name ?? "未指定"}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
                      STATUS_PILL[apt.status],
                    )}
                  >
                    {APPOINTMENT_STATUS_LABELS[apt.status]}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {apt.status === "confirmed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCheckIn(apt.id)}
                      disabled={isBusy}
                      className="h-8 gap-1 text-xs"
                    >
                      {isCheckingIn ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="size-3.5" />
                      )}
                      報到
                    </Button>
                  )}
                  {apt.status === "in_progress" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onComplete(apt.id)}
                      disabled={isBusy}
                      className="h-8 gap-1 text-xs"
                    >
                      {isCompleting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-3.5" />
                      )}
                      完成看診
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/** 方案不足升級牆（照客戶分析頁既有 gated 模式） */
function UpgradeWall({ canTrial }: { canTrial: boolean }) {
  return (
    <Card className="flex flex-col items-center gap-4 p-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Lock className="size-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          叫號台為「標準方案」功能
        </h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          升級至標準方案即可使用櫃檯報到與現場叫號，民眾還能在手機即時查看
          「目前叫號 / 還差幾位」，減少現場等待焦慮。
        </p>
      </div>
      {canTrial ? (
        <p className="text-sm text-primary">
          你的院所還沒用過試用 —— 可從上方橫幅「一鍵試用 90 天」立即解鎖全部功能。
        </p>
      ) : (
        <Button asChild>
          <Link href="/pricing">查看方案</Link>
        </Button>
      )}
    </Card>
  );
}

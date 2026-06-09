"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Hash,
  MapPin,
  Stethoscope,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRequireMember } from "@/lib/auth/use-require-member";
import {
  memberAppointmentApi,
  type MemberAppointment,
} from "@/lib/api/member-appointment";
import type { AppointmentStatus } from "@/types/clinic";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  confirmed: "已預約",
  completed: "已完成",
  cancelled: "已取消",
  no_show: "未到診",
};

const STATUS_BADGE_VARIANT: Record<
  AppointmentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "outline",
};

// 狀態 hero 的漸層底色
const STATUS_HERO: Record<AppointmentStatus, string> = {
  confirmed: "from-primary to-blue-700",
  completed: "from-emerald-500 to-teal-600",
  cancelled: "from-slate-500 to-slate-700",
  no_show: "from-amber-500 to-orange-600",
};

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function formatFullDate(d: string) {
  const dt = new Date(d + "T00:00:00");
  return `${dt.getFullYear()} 年 ${dt.getMonth() + 1} 月 ${dt.getDate()} 日（週${WEEKDAYS[dt.getDay()]}）`;
}

function formatTime(t: string) {
  return t.substring(0, 5);
}

export default function MemberAppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { ready } = useRequireMember(`/member/appointments/${id}`);
  const [appt, setAppt] = useState<MemberAppointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchAppt = useCallback(async () => {
    setIsLoading(true);
    try {
      // 帶最大回溯天數（365），避免超過預設 90 天的舊預約查不到詳情
      const list = await memberAppointmentApi.list(undefined, 365);
      const found = list.find((a) => a.id === id) ?? null;
      setAppt(found);
      setNotFound(found === null);
    } catch (err) {
      console.error("Failed to load appointment:", err);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!ready) return;
    fetchAppt();
  }, [ready, fetchAppt]);

  const handleCancel = async () => {
    if (!appt) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      await memberAppointmentApi.cancel(appt.id);
      setAppt({ ...appt, status: "cancelled" });
      setCancelOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "取消失敗，請稍後再試";
      setCancelError(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 pb-12">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/member"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 size-4" />
            返回
          </Link>
          <h1 className="text-lg font-bold text-foreground">預約詳情</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        ) : notFound || !appt ? (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <XCircle className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">找不到這筆預約</p>
            <Button asChild size="sm">
              <Link href="/member">返回我的預約</Link>
            </Button>
          </Card>
        ) : (
          <>
            {/* 狀態 hero */}
            <div
              className={cn(
                "relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white",
                STATUS_HERO[appt.status],
              )}
            >
              <div className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <Badge
                  variant={STATUS_BADGE_VARIANT[appt.status]}
                  className="bg-white/20 text-white"
                >
                  {STATUS_LABEL[appt.status]}
                </Badge>
                <h2 className="mt-3 flex items-center gap-2 text-2xl font-bold">
                  <MapPin className="size-5 shrink-0" />
                  <span className="truncate">{appt.facility_name}</span>
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-4" />
                    {formatFullDate(appt.appointment_date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    {formatTime(appt.appointment_time)}
                  </span>
                </div>
              </div>
            </div>

            {/* 詳細資訊 */}
            <Card className="divide-y divide-border/60 p-0">
              <InfoRow
                icon={<Hash className="size-4" />}
                label="預約編號"
                value={appt.booking_number}
              />
              <InfoRow
                icon={<MapPin className="size-4" />}
                label="診所"
                value={appt.facility_name}
              />
              <InfoRow
                icon={<CalendarDays className="size-4" />}
                label="預約日期"
                value={formatFullDate(appt.appointment_date)}
              />
              <InfoRow
                icon={<Clock className="size-4" />}
                label="預約時間"
                value={formatTime(appt.appointment_time)}
              />
              <InfoRow
                icon={<Stethoscope className="size-4" />}
                label="醫師"
                value={appt.staff_name ?? "未指定"}
              />
              <InfoRow
                icon={<CheckCircle2 className="size-4" />}
                label="狀態"
                value={STATUS_LABEL[appt.status]}
              />
            </Card>

            {/* 取消預約（僅 confirmed） */}
            {appt.status === "confirmed" && (
              <Card className="space-y-3 p-5">
                <p className="text-sm text-muted-foreground">
                  如需更改時間，請先取消此預約再重新預約。
                </p>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setCancelError(null);
                    setCancelOpen(true);
                  }}
                >
                  <XCircle className="mr-1.5 size-4" />
                  取消預約
                </Button>
              </Card>
            )}
          </>
        )}
      </div>

      {/* 取消確認 */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認取消預約</AlertDialogTitle>
            <AlertDialogDescription>
              取消後此時段將釋出，若仍需就診請重新預約。確定要取消嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          {cancelError && (
            <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
              {cancelError}
            </div>
          )}
          <AlertDialogFooter className="gap-2 sm:gap-3">
            <AlertDialogCancel disabled={isCancelling}>
              先不要
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={isCancelling}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isCancelling ? "取消中..." : "確認取消"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="w-20 shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-right text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

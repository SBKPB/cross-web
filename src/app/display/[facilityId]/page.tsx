"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BellRing, Clock, Loader2, Lock, Users } from "lucide-react";

import { api } from "@/lib/api/client";
import { usePollOnVisible } from "@/lib/hooks/use-poll-on-visible";
import { cn } from "@/lib/utils";
import type { DisplayBoard, DisplayGroup } from "@/types/clinic";

export default function DisplayBoardPage() {
  const params = useParams();
  const facilityId = String(params.facilityId);

  const [board, setBoard] = useState<DisplayBoard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchBoard = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setIsLoading(true);
      try {
        const data = await api.get<DisplayBoard>(
          `/api/v1/booking/clinics/${facilityId}/queue-board`,
        );
        setBoard(data);
        setError(false);
      } catch (err) {
        console.error("Failed to fetch display board:", err);
        if (!opts?.silent) setError(true);
      } finally {
        if (!opts?.silent) setIsLoading(false);
      }
    },
    [facilityId],
  );

  useEffect(() => {
    void fetchBoard();
  }, [fetchBoard]);

  // 10 秒輪詢（候診看板不需即時，輪詢足矣；頁籤可見才打）
  const pollBoard = useCallback(() => void fetchBoard({ silent: true }), [fetchBoard]);
  usePollOnVisible(pollBoard, 10_000, true);

  if (isLoading) {
    return (
      <CenterScreen>
        <Loader2 className="size-12 animate-spin text-primary" />
      </CenterScreen>
    );
  }

  if (error || !board) {
    return (
      <CenterScreen>
        <p className="text-2xl font-semibold text-muted-foreground">
          看板暫時無法載入，將自動重試…
        </p>
      </CenterScreen>
    );
  }

  if (!board.enabled) {
    return (
      <CenterScreen>
        <Lock className="size-12 text-muted-foreground" />
        <p className="text-2xl font-semibold text-foreground">
          此院所尚未開通候診看板
        </p>
        <p className="text-base text-muted-foreground">
          候診室大螢幕為「專業方案」功能，升級後即可啟用。
        </p>
      </CenterScreen>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-6 py-5 sm:px-10">
      {/* 標頭 */}
      <header className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BellRing className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {board.facility_name ?? "候診叫號"}
            </h1>
            <p className="text-sm text-muted-foreground">候診叫號看板</p>
          </div>
        </div>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 animate-pulse rounded-full bg-green-500" />
          每 10 秒自動更新
        </span>
      </header>

      {board.groups.length === 0 ? (
        <CenterScreen className="flex-1">
          <p className="text-2xl font-semibold text-muted-foreground">
            目前無候診者
          </p>
        </CenterScreen>
      ) : (
        <div className="mt-6 grid flex-1 auto-rows-min gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {board.groups.map((group, i) => (
            <GroupCard key={group.staff_name ?? `g${i}`} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

/** 單一診次隊列大卡：目前叫號超大字 + 候診清單（號碼 + 遮罩姓名） */
function GroupCard({ group }: { group: DisplayGroup }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <h2 className="truncate text-xl font-bold text-foreground">
          {group.staff_name ?? "不指定醫師"}
        </h2>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-4" />
            候診 {group.waiting_count}
          </span>
          {group.estimated_wait_minutes != null && group.waiting_count > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="size-4" />約 {group.estimated_wait_minutes} 分
            </span>
          )}
        </div>
      </div>

      {/* 目前叫號超大字 */}
      <div className="flex flex-col items-center justify-center gap-1 py-6">
        <p className="text-sm text-muted-foreground">目前叫號</p>
        <p className="text-7xl font-black leading-none text-primary tabular-nums">
          {group.current_number ?? "—"}
        </p>
      </div>

      {/* 候診清單 */}
      <div className="border-t border-border/60">
        {group.appointments.length === 0 ? (
          <p className="px-6 py-4 text-center text-sm text-muted-foreground">
            目前無候診者
          </p>
        ) : (
          <ul className="divide-y divide-border/40">
            {group.appointments.map((apt) => {
              const calling = apt.status === "in_progress";
              return (
                <li
                  key={`${apt.queue_number}-${apt.masked_name}`}
                  className={cn(
                    "flex items-center justify-between px-6 py-3",
                    calling && "bg-primary/5",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "w-12 text-2xl font-bold tabular-nums",
                        calling ? "text-primary" : "text-foreground",
                      )}
                    >
                      {apt.queue_number ?? "—"}
                    </span>
                    <span className="text-lg text-foreground">
                      {apt.masked_name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-sm font-medium",
                      calling
                        ? "bg-primary text-primary-foreground"
                        : "bg-teal-100 text-teal-700",
                    )}
                  >
                    {calling ? "看診中" : "候診中"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function CenterScreen({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-3 text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

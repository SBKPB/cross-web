"use client";

import { CalendarDays } from "lucide-react";

import { SectionCard } from "@/components/clinic-detail/section-card";
import { cn } from "@/lib/utils";
import type {
  ScheduleEntry,
  ScheduleSession,
  WeeklySchedule,
} from "@/types/schedule";

const SESSIONS: { key: ScheduleSession; label: string; hint: string }[] = [
  { key: "morning", label: "早診", hint: "上午" },
  { key: "afternoon", label: "午診", hint: "下午" },
  { key: "evening", label: "晚診", hint: "晚上" },
];

const DAY_LABELS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function md(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

interface ScheduleTimetableProps {
  schedule: WeeklySchedule;
  className?: string;
}

export function ScheduleTimetable({ schedule, className }: ScheduleTimetableProps) {
  const weekStart = parseLocalDate(schedule.week_start);
  const weekEnd = parseLocalDate(schedule.week_end);
  const todayKey = ymd(new Date());

  const dayDates = DAY_LABELS.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const cellMap = new Map<string, ScheduleEntry[]>();
  for (const e of schedule.entries) {
    const key = `${e.session}-${e.weekday}`;
    const list = cellMap.get(key) ?? [];
    if (!list.some((x) => x.doctor_id === e.doctor_id)) list.push(e);
    cellMap.set(key, list);
  }

  const rangeLabel = `${md(weekStart)} – ${md(weekEnd)}`;
  const GRID_COLS = "grid grid-cols-[58px_repeat(7,minmax(74px,1fr))] gap-1.5";

  return (
    <SectionCard
      icon={CalendarDays}
      title="門診時刻表"
      action={
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground tabular-nums">
          {schedule.week_offset === 0 && "本週 "}
          {rangeLabel}
        </span>
      }
      className={className}
    >
      {schedule.entries.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 py-10 text-center">
          <span className="mb-1 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground/50">
            <CalendarDays className="size-6" />
          </span>
          <p className="text-sm font-medium text-foreground">本週尚未提供門診排班</p>
          <p className="text-xs text-muted-foreground">可點「立即預約」查詢可預約時段</p>
        </div>
      ) : (
        <div className="min-w-0 overflow-x-auto pb-1">
          <div className="min-w-[560px]">
            {/* 表頭 */}
            <div className={GRID_COLS}>
              <div className="sticky left-0 z-10 bg-card" />
              {dayDates.map((d, i) => {
                const isToday = ymd(d) === todayKey;
                return (
                  <div
                    key={i}
                    className={cn(
                      "rounded-2xl px-1 py-2 text-center transition-colors",
                      isToday
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                        : "bg-muted/70",
                    )}
                  >
                    <div className="text-xs font-semibold">{DAY_LABELS[i]}</div>
                    <div
                      className={cn(
                        "mt-0.5 text-[10px] tabular-nums",
                        isToday ? "text-primary-foreground/85" : "text-muted-foreground",
                      )}
                    >
                      {md(d)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 診次列 */}
            {SESSIONS.map((s) => (
              <div key={s.key} className={cn(GRID_COLS, "mt-1.5")}>
                <div className="sticky left-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-secondary px-1 py-2 text-center">
                  <span className="text-xs font-semibold text-foreground">{s.label}</span>
                  <span className="text-[10px] text-muted-foreground">{s.hint}</span>
                </div>

                {dayDates.map((d, i) => {
                  const isToday = ymd(d) === todayKey;
                  const doctors = cellMap.get(`${s.key}-${i}`) ?? [];
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex min-h-[3.25rem] flex-wrap content-center items-center justify-center gap-1 rounded-2xl p-1.5",
                        isToday ? "bg-accent/70 ring-1 ring-inset ring-primary/15" : "bg-muted/40",
                      )}
                    >
                      {doctors.length > 0 ? (
                        doctors.map((doc) => (
                          <span
                            key={doc.doctor_id}
                            title={
                              doc.department
                                ? `${doc.doctor_name}・${doc.department}`
                                : doc.doctor_name
                            }
                            className="max-w-full truncate rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm ring-1 ring-foreground/5"
                          >
                            {doc.doctor_name}
                          </span>
                        ))
                      ) : (
                        <span className="self-center text-xs text-muted-foreground/40">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

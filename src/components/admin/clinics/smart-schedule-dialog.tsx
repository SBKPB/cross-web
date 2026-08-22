"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDate,
  getDaysInMonth,
  getDay,
  isAfter,
  parseISO,
  setDate,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import {
  CalendarRange,
  CheckCircle2,
  Copy,
  Loader2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { STAFF_ROLES } from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type {
  ApiScheduleBatchItem,
  ApiScheduleBatchResult,
  ApiStaff,
} from "@/types/clinic";
import type { ScheduleSession } from "@/types/schedule";

// 診次預設時間（與排班月曆 / 公開門診時刻表一致）
const SESSIONS: Record<
  ScheduleSession,
  { label: string; start: string; end: string }
> = {
  morning: { label: "早診", start: "09:00", end: "12:00" },
  afternoon: { label: "午診", start: "13:00", end: "17:00" },
  evening: { label: "晚診", start: "17:00", end: "21:00" },
};
const SESSION_ORDER: ScheduleSession[] = ["morning", "afternoon", "evening"];

// 星期：以 JS getDay()（0=日…6=六）為 key，顯示順序週一→週日
const WEEKDAYS: { day: number; label: string }[] = [
  { day: 1, label: "一" },
  { day: 2, label: "二" },
  { day: 3, label: "三" },
  { day: 4, label: "四" },
  { day: 5, label: "五" },
  { day: 6, label: "六" },
  { day: 0, label: "日" },
];

const MAX_ITEMS = 2000;

interface SmartScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  /** 可排班的專業人員（醫師 / 美容師 / 治療師） */
  staff: ApiStaff[];
  /** 目前月曆檢視的月份（樣板預設區間 & 複製目標） */
  viewMonth: Date;
  onApplied: () => void;
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition",
        active
          ? "bg-primary text-primary-foreground ring-primary"
          : "bg-background text-muted-foreground ring-border hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

export function SmartScheduleDialog({
  open,
  onOpenChange,
  facilityId,
  staff,
  viewMonth,
  onApplied,
}: SmartScheduleDialogProps) {
  const [tab, setTab] = useState<"template" | "copy">("template");
  const [skipLeaves, setSkipLeaves] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiScheduleBatchResult | null>(null);

  // 週期樣板
  const [staffIds, setStaffIds] = useState<Set<string>>(new Set());
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [sessions, setSessions] = useState<Set<ScheduleSession>>(
    new Set<ScheduleSession>(["morning", "afternoon"]),
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 複製
  const [copySource, setCopySource] = useState<"lastWeek" | "lastMonth">(
    "lastMonth",
  );
  const [copyCount, setCopyCount] = useState<number | null>(null);

  // 只在「關閉→開啟」當下重設預設值。
  // （staff / viewMonth 可能因父層重繪而換 reference，不能拿來當重設觸發，
  //  否則套用成功後父層 refresh 會把結果畫面洗掉。）
  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      setTab("template");
      setSkipLeaves(true);
      setError(null);
      setResult(null);
      setStaffIds(new Set(staff.map((s) => s.id)));
      setWeekdays(new Set([1, 2, 3, 4, 5]));
      setSessions(new Set<ScheduleSession>(["morning", "afternoon"]));
      setStartDate(format(startOfMonth(viewMonth), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(viewMonth), "yyyy-MM-dd"));
      setCopySource("lastMonth");
    }
    prevOpen.current = open;
  }, [open, staff, viewMonth]);

  // 複製：來源區間 + 日期對映規則
  const copyRanges = useCallback(() => {
    if (copySource === "lastMonth") {
      const srcMonth = subMonths(viewMonth, 1);
      const targetDays = getDaysInMonth(viewMonth);
      return {
        start: format(startOfMonth(srcMonth), "yyyy-MM-dd"),
        end: format(endOfMonth(srcMonth), "yyyy-MM-dd"),
        // 同「幾號」對映到檢視月份；該月沒有的日期（如 31 號）跳過
        mapDate: (d: Date): Date | null => {
          const day = getDate(d);
          if (day > targetDays) return null;
          return setDate(startOfMonth(viewMonth), day);
        },
      };
    }
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    return {
      start: format(lastWeekStart, "yyyy-MM-dd"),
      end: format(addDays(lastWeekStart, 6), "yyyy-MM-dd"),
      mapDate: (d: Date): Date | null => addDays(d, 7), // 上週 → 本週同一天
    };
  }, [copySource, viewMonth]);

  // 複製來源筆數預覽
  useEffect(() => {
    if (!open || tab !== "copy") return;
    let cancelled = false;
    setCopyCount(null);
    const { start, end } = copyRanges();
    adminClinicsApi.schedules
      .listAll(facilityId, { start_date: start, end_date: end })
      .then((rows) => {
        if (!cancelled) setCopyCount(rows.length);
      })
      .catch(() => {
        if (!cancelled) setCopyCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tab, copyRanges, facilityId]);

  // 週期樣板：展開成 items
  const templateItems = useMemo<ApiScheduleBatchItem[]>(() => {
    if (!startDate || !endDate) return [];
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (isAfter(start, end)) return [];
    if (staffIds.size === 0 || weekdays.size === 0 || sessions.size === 0)
      return [];

    const days = eachDayOfInterval({ start, end }).filter((d) =>
      weekdays.has(getDay(d)),
    );
    const items: ApiScheduleBatchItem[] = [];
    for (const day of days) {
      const dateStr = format(day, "yyyy-MM-dd");
      for (const sid of staffIds) {
        for (const key of SESSION_ORDER) {
          if (!sessions.has(key)) continue;
          items.push({
            staff_id: sid,
            date: dateStr,
            start_time: SESSIONS[key].start,
            end_time: SESSIONS[key].end,
            session_type: key,
          });
        }
      }
    }
    return items;
  }, [startDate, endDate, staffIds, weekdays, sessions]);

  const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const apply = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      let items: ApiScheduleBatchItem[];
      if (tab === "template") {
        items = templateItems;
        if (items.length === 0) {
          setError("請至少選擇一位人員、一個星期與一個診次");
          return;
        }
      } else {
        const { start, end, mapDate } = copyRanges();
        const src = await adminClinicsApi.schedules.listAll(facilityId, {
          start_date: start,
          end_date: end,
        });
        items = src
          .map((s): ApiScheduleBatchItem | null => {
            const target = mapDate(parseISO(s.date));
            if (!target) return null;
            return {
              staff_id: s.staff_id,
              date: format(target, "yyyy-MM-dd"),
              start_time: s.start_time.slice(0, 5),
              end_time: s.end_time.slice(0, 5),
              session_type: s.session_type,
            };
          })
          .filter((x): x is ApiScheduleBatchItem => x !== null);
        if (items.length === 0) {
          setError("來源區間沒有可複製的排班");
          return;
        }
      }

      if (items.length > MAX_ITEMS) {
        setError(`一次最多排 ${MAX_ITEMS} 筆，請縮小範圍（目前 ${items.length} 筆）`);
        return;
      }

      const res = await adminClinicsApi.schedules.batchCreate(facilityId, {
        items,
        skip_leaves: skipLeaves,
      });
      setResult(res);
      onApplied();
    } catch (err) {
      console.error("Smart schedule failed:", err);
      setError("排班失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  const noStaff = staff.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            智慧排班
          </DialogTitle>
          <DialogDescription>
            用週期樣板或複製既有班表批次排班，系統會自動略過重複與休假日。
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <ResultPanel
            result={result}
            onClose={() => onOpenChange(false)}
            onAgain={() => setResult(null)}
          />
        ) : noStaff ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            尚無專業人員（醫師 / 美容師 / 治療師），請先到「人員」分頁新增。
          </p>
        ) : (
          <div className="space-y-5">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="template" className="gap-1.5">
                  <CalendarRange className="size-4" />
                  週期樣板
                </TabsTrigger>
                <TabsTrigger value="copy" className="gap-1.5">
                  <Copy className="size-4" />
                  複製班表
                </TabsTrigger>
              </TabsList>

              {/* ===== 週期樣板 ===== */}
              <TabsContent value="template" className="space-y-4 pt-2">
                <Field label="人員">
                  <div className="flex flex-wrap gap-2">
                    {staff.map((s) => (
                      <Pill
                        key={s.id}
                        active={staffIds.has(s.id)}
                        onClick={() => setStaffIds((p) => toggle(p, s.id))}
                      >
                        {s.name}
                        <span className="ml-1 opacity-60">
                          {STAFF_ROLES[s.role]}
                        </span>
                      </Pill>
                    ))}
                  </div>
                </Field>

                <Field label="星期">
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((w) => (
                      <Pill
                        key={w.day}
                        active={weekdays.has(w.day)}
                        onClick={() => setWeekdays((p) => toggle(p, w.day))}
                      >
                        {w.label}
                      </Pill>
                    ))}
                  </div>
                </Field>

                <Field label="診次">
                  <div className="flex flex-wrap gap-2">
                    {SESSION_ORDER.map((key) => (
                      <Pill
                        key={key}
                        active={sessions.has(key)}
                        onClick={() => setSessions((p) => toggle(p, key))}
                      >
                        {SESSIONS[key].label}
                        <span className="ml-1 opacity-60 tabular-nums">
                          {SESSIONS[key].start}–{SESSIONS[key].end}
                        </span>
                      </Pill>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="開始日期">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Field>
                  <Field label="結束日期">
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Field>
                </div>

                <p className="text-sm text-muted-foreground">
                  預計建立{" "}
                  <span className="font-semibold text-foreground">
                    {templateItems.length}
                  </span>{" "}
                  筆班（實際會自動略過重複與休假）
                </p>
              </TabsContent>

              {/* ===== 複製 ===== */}
              <TabsContent value="copy" className="space-y-4 pt-2">
                <Field label="複製來源">
                  <div className="flex gap-2">
                    <Pill
                      active={copySource === "lastMonth"}
                      onClick={() => setCopySource("lastMonth")}
                    >
                      上個月 → 本月
                    </Pill>
                    <Pill
                      active={copySource === "lastWeek"}
                      onClick={() => setCopySource("lastWeek")}
                    >
                      上週 → 本週
                    </Pill>
                  </div>
                </Field>
                <p className="text-sm text-muted-foreground">
                  {copySource === "lastMonth"
                    ? `把 ${format(subMonths(viewMonth, 1), "yyyy 年 M 月")} 的班依「幾號」複製到 ${format(viewMonth, "yyyy 年 M 月")}`
                    : "把上週的班依星期複製到本週"}
                  。
                  {copyCount !== null && (
                    <>
                      {" "}
                      來源有{" "}
                      <span className="font-semibold text-foreground">
                        {copyCount}
                      </span>{" "}
                      筆班。
                    </>
                  )}
                </p>
              </TabsContent>
            </Tabs>

            {/* 共用：略過休假 */}
            <label className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-3">
              <Checkbox
                checked={skipLeaves}
                onCheckedChange={(v) => setSkipLeaves(v === true)}
              />
              <span className="text-sm text-foreground">
                略過人員休假日（建議開啟）
              </span>
            </label>

            {error && (
              <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button
                onClick={apply}
                disabled={
                  isSubmitting ||
                  (tab === "template" && templateItems.length === 0) ||
                  (tab === "copy" && copyCount === 0)
                }
              >
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isSubmitting ? "排班中…" : "開始排班"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ResultPanel({
  result,
  onClose,
  onAgain,
}: {
  result: ApiScheduleBatchResult;
  onClose: () => void;
  onAgain: () => void;
}) {
  const skipped =
    result.skipped_existing + result.skipped_leave + result.skipped_invalid;
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle2 className="size-6" />
        </span>
        <p className="text-lg font-semibold text-foreground">
          已建立 {result.created_count} 筆排班
        </p>
        {skipped > 0 && (
          <p className="text-sm text-muted-foreground">
            略過 {skipped} 筆
          </p>
        )}
      </div>

      <ul className="space-y-1.5 rounded-xl bg-muted/40 p-3 text-sm">
        <ResultRow label="新建立" value={result.created_count} tone="ok" />
        <ResultRow label="已存在（重複）" value={result.skipped_existing} />
        <ResultRow label="人員休假" value={result.skipped_leave} />
        <ResultRow label="時間不合法" value={result.skipped_invalid} />
      </ul>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onAgain}>
          再排一批
        </Button>
        <Button onClick={onClose}>完成</Button>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok";
}) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          tone === "ok" ? "text-green-600" : "text-foreground",
        )}
      >
        {value}
      </span>
    </li>
  );
}

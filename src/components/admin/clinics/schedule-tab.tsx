"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { zhTW } from "date-fns/locale";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  parseISO,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Sparkles,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { SmartScheduleDialog } from "@/components/admin/clinics/smart-schedule-dialog";
import { STAFF_ROLES } from "@/lib/constants/clinic-constants";
import type { ApiSchedule, ApiStaff, ApiStaffLeave } from "@/types/clinic";
import type { ScheduleSession } from "@/types/schedule";

interface ScheduleTabProps {
  facilityId: string;
}

interface StaffLeaveMap {
  [staffId: string]: ApiStaffLeave[];
}

// 診次預設時間（與公開門診時刻表一致）
const SESSION_PRESETS: Record<
  ScheduleSession,
  { label: string; short: string; start: string; end: string }
> = {
  morning: { label: "早診", short: "早", start: "09:00", end: "12:00" },
  afternoon: { label: "午診", short: "午", start: "13:00", end: "17:00" },
  evening: { label: "晚診", short: "晚", start: "17:00", end: "21:00" },
};

const SESSION_ORDER: ScheduleSession[] = ["morning", "afternoon", "evening"];

const hhmm = (t: string) => t.slice(0, 5);

// 取後端 ApiError 的 detail 訊息（防呆錯誤如重複排班/休假衝突）
const apiErrorDetail = (err: unknown): string | null => {
  if (err && typeof err === "object" && "data" in err) {
    const data = (err as { data?: { detail?: unknown } }).data;
    if (typeof data?.detail === "string") return data.detail;
  }
  return null;
};

export function ScheduleTab({ facilityId }: ScheduleTabProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [staff, setStaff] = useState<ApiStaff[]>([]);
  const [leavesMap, setLeavesMap] = useState<StaffLeaveMap>({});
  const [schedules, setSchedules] = useState<ApiSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [smartOpen, setSmartOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 休假表單
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [noteInput, setNoteInput] = useState("");

  // 排班表單
  const [shiftStaffId, setShiftStaffId] = useState<string>("");
  const [shiftSession, setShiftSession] = useState<ScheduleSession>("morning");
  const [shiftStart, setShiftStart] = useState(SESSION_PRESETS.morning.start);
  const [shiftEnd, setShiftEnd] = useState(SESSION_PRESETS.morning.end);

  // 送出失敗的錯誤訊息（顯示後端 detail，不再靜默吞掉）
  const [shiftError, setShiftError] = useState("");
  const [leaveError, setLeaveError] = useState("");

  // 只載入專業人員（可提供服務的人員）。useMemo 穩定 reference，
  // 避免每次重繪都換陣列、害智慧排班 dialog 反覆重設。
  const professionalStaff = useMemo(
    () =>
      staff.filter((s) =>
        ["doctor", "beautician", "therapist"].includes(s.role),
      ),
    [staff],
  );

  // silent=true：背景刷新，不切到整頁 spinner（避免把開著的 dialog 卸載掉）
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const range = {
        start_date: format(start, "yyyy-MM-dd"),
        end_date: format(end, "yyyy-MM-dd"),
      };

      const [staffData, allLeaves, allSchedules] = await Promise.all([
        adminClinicsApi.staff.list(facilityId),
        adminClinicsApi.staffLeaves.listAll(facilityId, range),
        adminClinicsApi.schedules.listAll(facilityId, range),
      ]);
      setStaff(staffData);
      setSchedules(allSchedules);

      const newLeavesMap: StaffLeaveMap = {};
      for (const leave of allLeaves) {
        if (!newLeavesMap[leave.staff_id]) newLeavesMap[leave.staff_id] = [];
        newLeavesMap[leave.staff_id].push(leave);
      }
      setLeavesMap(newLeavesMap);
    } catch (err) {
      console.error("Failed to fetch schedule data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getLeavesForDate = (
    date: Date
  ): { staff: ApiStaff; leave: ApiStaffLeave }[] => {
    const result: { staff: ApiStaff; leave: ApiStaffLeave }[] = [];
    professionalStaff.forEach((s) => {
      const staffLeaves = leavesMap[s.id] || [];
      const leave = staffLeaves.find((l) => isSameDay(parseISO(l.date), date));
      if (leave) result.push({ staff: s, leave });
    });
    return result;
  };

  const getSchedulesForDate = (date: Date): ApiSchedule[] =>
    schedules
      .filter((s) => isSameDay(parseISO(s.date), date))
      .sort(
        (a, b) =>
          SESSION_ORDER.indexOf(a.session_type) -
          SESSION_ORDER.indexOf(b.session_type)
      );

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedStaffId("");
    setNoteInput("");
    setShiftStaffId("");
    setShiftSession("morning");
    setShiftStart(SESSION_PRESETS.morning.start);
    setShiftEnd(SESSION_PRESETS.morning.end);
    setShiftError("");
    setLeaveError("");
    setDialogOpen(true);
  };

  const handleSessionChange = (value: string) => {
    const s = value as ScheduleSession;
    setShiftSession(s);
    setShiftStart(SESSION_PRESETS[s].start);
    setShiftEnd(SESSION_PRESETS[s].end);
    setShiftError("");
  };

  const handleAddLeave = async () => {
    if (!selectedStaffId || !selectedDate) return;
    setIsSaving(true);
    setLeaveError("");
    try {
      await adminClinicsApi.staffLeaves.create(facilityId, selectedStaffId, {
        date: format(selectedDate, "yyyy-MM-dd"),
        note: noteInput || undefined,
      });
      await fetchData();
      setSelectedStaffId("");
      setNoteInput("");
    } catch (err) {
      console.error("Failed to add leave:", err);
      setLeaveError(apiErrorDetail(err) ?? "設定休假失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveLeave = async (staffId: string, leaveId: string) => {
    setIsSaving(true);
    try {
      await adminClinicsApi.staffLeaves.delete(facilityId, staffId, leaveId);
      await fetchData();
    } catch (err) {
      console.error("Failed to remove leave:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddShift = async () => {
    if (!shiftStaffId || !selectedDate) return;
    if (shiftEnd <= shiftStart) return;
    setIsSaving(true);
    setShiftError("");
    try {
      await adminClinicsApi.schedules.create(facilityId, shiftStaffId, {
        date: format(selectedDate, "yyyy-MM-dd"),
        start_time: shiftStart,
        end_time: shiftEnd,
        session_type: shiftSession,
      });
      await fetchData();
      setShiftStaffId("");
    } catch (err) {
      console.error("Failed to add schedule:", err);
      setShiftError(apiErrorDetail(err) ?? "新增排班失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveShift = async (staffId: string, scheduleId: string) => {
    setIsSaving(true);
    try {
      await adminClinicsApi.schedules.delete(facilityId, staffId, scheduleId);
      await fetchData();
    } catch (err) {
      console.error("Failed to remove schedule:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // 產生日曆資料
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const selectedDateLeaves = selectedDate ? getLeavesForDate(selectedDate) : [];
  const selectedDateShifts = selectedDate
    ? getSchedulesForDate(selectedDate)
    : [];
  const availableStaffForLeave = professionalStaff.filter(
    (s) => !selectedDateLeaves.some((l) => l.staff.id === s.id)
  );

  // 排班防呆（與後端規則一致，先在 UI 擋）：同人同日同診次重複、當日休假、起訖時間
  const shiftDuplicate =
    !!shiftStaffId &&
    selectedDateShifts.some(
      (s) => s.staff_id === shiftStaffId && s.session_type === shiftSession
    );
  const shiftStaffOnLeave =
    !!shiftStaffId &&
    selectedDateLeaves.some(({ staff: s }) => s.id === shiftStaffId);
  const shiftBlockReason = shiftStaffOnLeave
    ? "該人員當日已設休假，無法排班"
    : shiftDuplicate
      ? `該人員當日已排${SESSION_PRESETS[shiftSession].label}`
      : shiftEnd <= shiftStart
        ? "結束時間必須晚於開始時間"
        : "";

  // 休假前提示：該人員當日已有排班（不擋，僅提醒）
  const leaveStaffShiftCount = selectedDateShifts.filter(
    (s) => s.staff_id === selectedStaffId
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">排班/休假總覽</h2>
        <Button onClick={() => setSmartOpen(true)} className="gap-2">
          <Sparkles className="size-4" />
          智慧排班
        </Button>
      </div>

      <Card className="p-6">
        {/* 月份導覽 */}
        <div className="mb-4 flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <h3 className="text-base font-medium text-foreground">
            {format(currentMonth, "yyyy 年 M 月", { locale: zhTW })}
          </h3>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>

        {/* 日曆 */}
        <div className="grid grid-cols-7 gap-1">
          {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {calendarDays.map((date) => {
            const dayShifts = getSchedulesForDate(date);
            const dayLeaves = getLeavesForDate(date);
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isToday = isSameDay(date, new Date());
            const items = [
              ...dayShifts.map((s) => ({ kind: "shift" as const, data: s })),
              ...dayLeaves.map((l) => ({ kind: "leave" as const, data: l })),
            ];

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "min-h-[88px] cursor-pointer rounded-xl p-1.5 ring-1 ring-foreground/5 transition hover:bg-muted/40 hover:ring-primary/20",
                  !isCurrentMonth && "bg-muted/20 opacity-50",
                  isToday && "ring-2 ring-primary",
                )}
                onClick={() => handleDayClick(date)}
              >
                <div
                  className={cn(
                    "mb-1 text-right text-sm text-foreground",
                    isToday && "font-bold text-primary",
                  )}
                >
                  {format(date, "d")}
                </div>
                <div className="space-y-0.5">
                  {items.slice(0, 3).map((item) =>
                    item.kind === "shift" ? (
                      <div
                        key={`s-${item.data.id}`}
                        className="truncate rounded bg-emerald-100 px-1 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        title={`${item.data.staff_name}・${SESSION_PRESETS[item.data.session_type].label} ${hhmm(item.data.start_time)}–${hhmm(item.data.end_time)}`}
                      >
                        {SESSION_PRESETS[item.data.session_type].short}{" "}
                        {item.data.staff_name}
                      </div>
                    ) : (
                      <div
                        key={`l-${item.data.leave.id}`}
                        className="truncate rounded bg-destructive/10 px-1 py-0.5 text-xs text-destructive"
                        title={`${item.data.staff.name} 休假${item.data.leave.note ? ` - ${item.data.leave.note}` : ""}`}
                      >
                        休 {item.data.staff.name}
                      </div>
                    ),
                  )}
                  {items.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{items.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 圖例 */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border/60 pt-4">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded bg-emerald-100 dark:bg-emerald-900/30" />
            <span className="text-sm text-muted-foreground">門診排班</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded bg-destructive/10" />
            <span className="text-sm text-muted-foreground">休假</span>
          </div>
          <div className="text-sm text-muted-foreground">
            點擊日期可管理排班與休假
          </div>
        </div>
      </Card>

      {/* 日期詳情 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDate
                ? format(selectedDate, "yyyy/MM/dd (EEEE)", { locale: zhTW })
                : ""}
            </DialogTitle>
            <DialogDescription>管理此日期的門診排班與人員休假</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* ===== 門診排班 ===== */}
            <div className="space-y-3">
              <Label className="text-emerald-700">門診排班</Label>

              {selectedDateShifts.length > 0 && (
                <div className="space-y-2">
                  {selectedDateShifts.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl p-3 ring-1 ring-foreground/5"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-foreground">
                          {s.staff_name}
                        </span>
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {SESSION_PRESETS[s.session_type].label}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground tabular-nums">
                          {hhmm(s.start_time)}–{hhmm(s.end_time)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveShift(s.staff_id, s.id)}
                        disabled={isSaving}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {professionalStaff.length > 0 ? (
                <div className="grid gap-3 rounded-xl bg-muted/40 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor="shift-staff" className="text-xs">
                        人員
                      </Label>
                      <Select
                        value={shiftStaffId}
                        onValueChange={(v) => {
                          setShiftStaffId(v);
                          setShiftError("");
                        }}
                      >
                        <SelectTrigger id="shift-staff">
                          <SelectValue placeholder="選擇人員" />
                        </SelectTrigger>
                        <SelectContent>
                          {professionalStaff.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} ({STAFF_ROLES[s.role]})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="shift-session" className="text-xs">
                        診次
                      </Label>
                      <Select
                        value={shiftSession}
                        onValueChange={handleSessionChange}
                      >
                        <SelectTrigger id="shift-session">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SESSION_ORDER.map((key) => (
                            <SelectItem key={key} value={key}>
                              {SESSION_PRESETS[key].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="shift-start" className="text-xs">
                        開始
                      </Label>
                      <Input
                        id="shift-start"
                        type="time"
                        value={shiftStart}
                        onChange={(e) => setShiftStart(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="shift-end" className="text-xs">
                        結束
                      </Label>
                      <Input
                        id="shift-end"
                        type="time"
                        value={shiftEnd}
                        onChange={(e) => setShiftEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  {(shiftBlockReason || shiftError) && (
                    <p className="text-xs text-destructive">
                      {shiftBlockReason || shiftError}
                    </p>
                  )}
                  <Button
                    onClick={handleAddShift}
                    disabled={!shiftStaffId || !!shiftBlockReason || isSaving}
                  >
                    {isSaving ? "處理中..." : "新增排班"}
                  </Button>
                </div>
              ) : (
                <p className="py-2 text-center text-sm text-muted-foreground">
                  尚無專業人員（醫師/美容師/治療師）
                </p>
              )}
            </div>

            {/* ===== 休假 ===== */}
            <div className="space-y-3 border-t border-border/60 pt-4">
              <Label className="text-destructive">休假</Label>

              {selectedDateLeaves.length > 0 && (
                <div className="space-y-2">
                  {selectedDateLeaves.map(({ staff: s, leave }) => (
                    <div
                      key={leave.id}
                      className="flex items-center justify-between rounded-xl p-3 ring-1 ring-foreground/5"
                    >
                      <div>
                        <span className="font-medium text-foreground">
                          {s.name}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {STAFF_ROLES[s.role]}
                        </span>
                        {leave.note && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({leave.note})
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveLeave(s.id, leave.id)}
                        disabled={isSaving}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {availableStaffForLeave.length > 0 && (
                <div className="grid gap-3 rounded-xl bg-muted/40 p-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="staff-select" className="text-xs">
                      選擇人員
                    </Label>
                    <Select
                      value={selectedStaffId}
                      onValueChange={(v) => {
                        setSelectedStaffId(v);
                        setLeaveError("");
                      }}
                    >
                      <SelectTrigger id="staff-select">
                        <SelectValue placeholder="選擇人員" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStaffForLeave.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({STAFF_ROLES[s.role]})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="leave-note" className="text-xs">
                      備註（選填）
                    </Label>
                    <Input
                      id="leave-note"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="例：特休、病假"
                    />
                  </div>
                  {selectedStaffId && leaveStaffShiftCount > 0 && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      該人員當日已有 {leaveStaffShiftCount}{" "}
                      筆排班，設定休假前請先確認是否需調整
                    </p>
                  )}
                  {leaveError && (
                    <p className="text-xs text-destructive">{leaveError}</p>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleAddLeave}
                    disabled={!selectedStaffId || isSaving}
                  >
                    {isSaving ? "處理中..." : "設定休假"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SmartScheduleDialog
        open={smartOpen}
        onOpenChange={setSmartOpen}
        facilityId={facilityId}
        staff={professionalStaff}
        viewMonth={currentMonth}
        onApplied={() => fetchData(true)}
      />
    </div>
  );
}

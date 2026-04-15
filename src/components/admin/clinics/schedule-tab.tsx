"use client";

import { useState, useEffect, useCallback } from "react";
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
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
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
import { STAFF_ROLES } from "@/lib/constants/clinic-constants";
import type { ApiStaff, ApiStaffLeave } from "@/types/clinic";

interface ScheduleTabProps {
  facilityId: string;
}

interface StaffLeaveMap {
  [staffId: string]: ApiStaffLeave[];
}

export function ScheduleTab({ facilityId }: ScheduleTabProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [staff, setStaff] = useState<ApiStaff[]>([]);
  const [leavesMap, setLeavesMap] = useState<StaffLeaveMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [noteInput, setNoteInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 只載入專業人員（可提供服務的人員）
  const professionalStaff = staff.filter((s) =>
    ["doctor", "beautician", "therapist"].includes(s.role)
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const staffData = await adminClinicsApi.staff.list(facilityId);
      setStaff(staffData);

      // 取得所有專業人員的休假
      const professionals = staffData.filter((s) =>
        ["doctor", "beautician", "therapist"].includes(s.role)
      );

      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const leavesPromises = professionals.map((s) =>
        adminClinicsApi.staffLeaves
          .list(facilityId, s.id, {
            start_date: format(start, "yyyy-MM-dd"),
            end_date: format(end, "yyyy-MM-dd"),
          })
          .then((leaves) => ({ staffId: s.id, leaves }))
      );

      const leavesResults = await Promise.all(leavesPromises);
      const newLeavesMap: StaffLeaveMap = {};
      leavesResults.forEach(({ staffId, leaves }) => {
        newLeavesMap[staffId] = leaves;
      });
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

  const getLeavesForDate = (date: Date): { staff: ApiStaff; leave: ApiStaffLeave }[] => {
    const result: { staff: ApiStaff; leave: ApiStaffLeave }[] = [];
    professionalStaff.forEach((s) => {
      const staffLeaves = leavesMap[s.id] || [];
      const leave = staffLeaves.find((l) => isSameDay(parseISO(l.date), date));
      if (leave) {
        result.push({ staff: s, leave });
      }
    });
    return result;
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedStaffId("");
    setNoteInput("");
    setDialogOpen(true);
  };

  const handleAddLeave = async () => {
    if (!selectedStaffId || !selectedDate) return;
    setIsSaving(true);
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

  // 產生日曆資料
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // 目前選取日期的休假資料
  const selectedDateLeaves = selectedDate ? getLeavesForDate(selectedDate) : [];
  const availableStaffForLeave = professionalStaff.filter(
    (s) => !selectedDateLeaves.some((l) => l.staff.id === s.id)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          排班/休假總覽
        </h2>
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
          {/* 星期標題 */}
          {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* 日期格子 */}
          {calendarDays.map((date) => {
            const dayLeaves = getLeavesForDate(date);
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isToday = isSameDay(date, new Date());

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "min-h-[80px] cursor-pointer rounded-xl p-1.5 ring-1 ring-foreground/5 transition hover:bg-muted/40 hover:ring-primary/20",
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
                  {dayLeaves.slice(0, 3).map(({ staff: s, leave }) => (
                    <div
                      key={leave.id}
                      className="truncate rounded bg-destructive/10 px-1 py-0.5 text-xs text-destructive"
                      title={`${s.name}${leave.note ? ` - ${leave.note}` : ""}`}
                    >
                      {s.name}
                    </div>
                  ))}
                  {dayLeaves.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayLeaves.length - 3} 人
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 圖例 */}
        <div className="mt-4 flex items-center gap-4 border-t border-border/60 pt-4">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded bg-destructive/10" />
            <span className="text-sm text-muted-foreground">休假</span>
          </div>
          <div className="text-sm text-muted-foreground">
            點擊日期可新增或移除休假
          </div>
        </div>
      </Card>

      {/* 日期詳情 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDate
                ? format(selectedDate, "yyyy/MM/dd (EEEE)", { locale: zhTW })
                : ""}
            </DialogTitle>
            <DialogDescription>管理此日期的人員休假</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 已休假人員 */}
            {selectedDateLeaves.length > 0 && (
              <div className="space-y-2">
                <Label>已設定休假</Label>
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
              </div>
            )}

            {/* 新增休假 */}
            {availableStaffForLeave.length > 0 && (
              <div className="space-y-3 border-t border-border/60 pt-4">
                <Label>新增休假</Label>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="staff-select">選擇人員</Label>
                    <Select
                      value={selectedStaffId}
                      onValueChange={setSelectedStaffId}
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
                  <div className="grid gap-2">
                    <Label htmlFor="leave-note">備註（選填）</Label>
                    <Input
                      id="leave-note"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="例：特休、病假"
                    />
                  </div>
                  <Button
                    onClick={handleAddLeave}
                    disabled={!selectedStaffId || isSaving}
                  >
                    {isSaving ? "處理中..." : "設定休假"}
                  </Button>
                </div>
              </div>
            )}

            {availableStaffForLeave.length === 0 &&
              selectedDateLeaves.length === 0 && (
                <p className="text-muted-foreground py-4 text-center">
                  尚無專業人員（醫師/美容師/治療師）
                </p>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

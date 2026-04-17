"use client";

import { useState, useEffect, useCallback } from "react";
import { zhTW } from "date-fns/locale";
import {
  format,
  startOfMonth,
  endOfMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { CalendarOff, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import {
  lumaCardInner,
  lumaDialogFooter,
  lumaIconBadge,
} from "@/lib/styles/luma";
import { cn } from "@/lib/utils";
import type { ApiStaff, ApiStaffLeave } from "@/types/clinic";

interface StaffLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  staff: ApiStaff | null;
}

export function StaffLeaveDialog({
  open,
  onOpenChange,
  facilityId,
  staff,
}: StaffLeaveDialogProps) {
  const [leaves, setLeaves] = useState<ApiStaffLeave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [noteInput, setNoteInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchLeaves = useCallback(async () => {
    if (!staff) return;
    setIsLoading(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const data = await adminClinicsApi.staffLeaves.list(
        facilityId,
        staff.id,
        {
          start_date: format(start, "yyyy-MM-dd"),
          end_date: format(end, "yyyy-MM-dd"),
        },
      );
      setLeaves(data);
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, staff, currentMonth]);

  useEffect(() => {
    if (open && staff) {
      fetchLeaves();
      setSelectedDate(undefined);
      setNoteInput("");
    }
  }, [open, staff, fetchLeaves]);

  const getLeaveForDate = (date: Date): ApiStaffLeave | undefined => {
    return leaves.find((leave) => isSameDay(parseISO(leave.date), date));
  };

  const handleDayClick = (day: Date | undefined) => {
    if (!day) return;
    setSelectedDate(day);
    const leave = getLeaveForDate(day);
    setNoteInput(leave?.note || "");
  };

  const handleAddLeave = async () => {
    if (!staff || !selectedDate) return;
    setIsSaving(true);
    try {
      await adminClinicsApi.staffLeaves.create(facilityId, staff.id, {
        date: format(selectedDate, "yyyy-MM-dd"),
        note: noteInput || undefined,
      });
      await fetchLeaves();
      // 保留選取日期讓使用者看到剛建立的休假
    } catch (err) {
      console.error("Failed to add leave:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveLeave = async () => {
    if (!staff || !selectedDate) return;
    const leave = getLeaveForDate(selectedDate);
    if (!leave) return;

    setIsSaving(true);
    try {
      await adminClinicsApi.staffLeaves.delete(facilityId, staff.id, leave.id);
      await fetchLeaves();
      setNoteInput("");
    } catch (err) {
      console.error("Failed to remove leave:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedLeave = selectedDate ? getLeaveForDate(selectedDate) : null;
  const leaveDates = leaves.map((leave) => parseISO(leave.date));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={lumaIconBadge}>
              <CalendarOff className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle>管理休假</DialogTitle>
              <DialogDescription>
                {staff?.name
                  ? `設定「${staff.name}」的休假日，本月共 ${leaves.length} 天`
                  : "點擊日期設定休假"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className={cn(lumaCardInner, "flex justify-center p-2")}>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDayClick}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={zhTW}
                weekStartsOn={0}
                modifiers={{
                  leave: leaveDates,
                }}
                modifiersClassNames={{
                  leave:
                    "[&>button]:bg-destructive/10 [&>button]:text-destructive [&>button]:font-semibold [&>button]:ring-1 [&>button]:ring-destructive/20",
                }}
                className="w-full"
              />
            </div>

            {/* 圖例 */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded bg-destructive/10 ring-1 ring-destructive/20" />
                <span>休假日</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded bg-primary" />
                <span>已選取</span>
              </div>
            </div>

            {/* 選取日期面板 */}
            {selectedDate && (
              <div className={lumaCardInner}>
                <div className="mb-3 flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {format(selectedDate, "yyyy/MM/dd", { locale: zhTW })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(selectedDate, "EEEE", { locale: zhTW })}
                  </p>
                </div>

                {selectedLeave ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
                      <p className="font-medium">已設定為休假日</p>
                      {selectedLeave.note && (
                        <p className="mt-1 text-xs opacity-80">
                          備註：{selectedLeave.note}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveLeave}
                      disabled={isSaving}
                      className="w-full"
                    >
                      <Trash2 className="mr-1.5 size-4" />
                      {isSaving ? "處理中..." : "移除休假"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-2">
                      <Label htmlFor="leave-note" className="text-xs">
                        備註（選填）
                      </Label>
                      <Input
                        id="leave-note"
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="例：特休、病假、進修"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isSaving) {
                            e.preventDefault();
                            handleAddLeave();
                          }
                        }}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleAddLeave}
                      disabled={isSaving}
                      className="w-full"
                    >
                      <CalendarOff className="mr-1.5 size-4" />
                      {isSaving ? "處理中..." : "設定休假"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!selectedDate && (
              <p className="text-center text-xs text-muted-foreground">
                點擊日曆中的日期以設定或移除休假
              </p>
            )}
          </div>
        )}

        <DialogFooter className={lumaDialogFooter}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            完成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

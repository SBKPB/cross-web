"use client";

import { useState, useEffect, useCallback } from "react";
import { zhTW } from "date-fns/locale";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";
import { DayPicker } from "react-day-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
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
        }
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
      setSelectedDate(undefined);
      setNoteInput("");
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
      setSelectedDate(undefined);
      setNoteInput("");
    } catch (err) {
      console.error("Failed to remove leave:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedLeave = selectedDate ? getLeaveForDate(selectedDate) : null;

  // 取得所有休假日期作為修飾符
  const leaveDates = leaves.map((leave) => parseISO(leave.date));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>管理休假</DialogTitle>
          <DialogDescription>
            點擊日期設定「{staff?.name}」的休假日
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            <DayPicker
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
                leave: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
              }}
              classNames={{
                root: "w-full",
                months: "w-full",
                month: "w-full space-y-4",
                month_caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "flex items-center gap-1",
                button_previous: "absolute left-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center",
                button_next: "absolute right-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center",
                month_grid: "w-full border-collapse",
                weekdays: "flex",
                weekday: "text-muted-foreground w-9 font-normal text-xs",
                week: "flex w-full mt-2",
                day: "size-9 text-center text-sm p-0 relative",
                day_button: "size-9 rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                today: "bg-accent text-accent-foreground font-semibold",
                outside: "text-muted-foreground opacity-50",
                disabled: "text-muted-foreground opacity-50",
              }}
            />

            {selectedDate && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium">
                  {format(selectedDate, "yyyy/MM/dd (EEEE)", { locale: zhTW })}
                </p>

                {selectedLeave ? (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">
                      已設定休假{selectedLeave.note && `：${selectedLeave.note}`}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveLeave}
                      disabled={isSaving}
                    >
                      {isSaving ? "處理中..." : "移除休假"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
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
                      size="sm"
                      onClick={handleAddLeave}
                      disabled={isSaving}
                    >
                      {isSaving ? "處理中..." : "設定休假"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

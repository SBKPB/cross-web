"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  PencilIcon,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { lumaCardHover, lumaDialogFooter } from "@/lib/styles/luma";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import type { ApiAppointment, AppointmentStatus } from "@/types/clinic";

interface AppointmentsTabProps {
  facilityId: string;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: "已預約",
  completed: "已完成",
  cancelled: "已取消",
  no_show: "未到診",
};

const STATUS_COLORS: Record<AppointmentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  confirmed: "default",
  completed: "outline",
  cancelled: "destructive",
  no_show: "secondary",
};

function formatDateStr(dateStr: string): string {
  return dateStr.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_, _y, m, d) => `${parseInt(m)}/${parseInt(d)}`);
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function getWeekday(dateStr: string): string {
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return weekdays[new Date(dateStr + "T00:00:00").getDay()];
}

function formatDateLabel(dateStr: string): string {
  const today = getToday();
  const tomorrow = addDays(today, 1);
  const prefix =
    dateStr === today ? "今天" : dateStr === tomorrow ? "明天" : `週${getWeekday(dateStr)}`;
  return `${prefix} ${formatDateStr(dateStr)}`;
}

export function AppointmentsTab({ facilityId }: AppointmentsTabProps) {
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 日期範圍：預設今天起一個月
  const [startDate, setStartDate] = useState(() => getToday());
  const [endDate, setEndDate] = useState(() => addMonths(getToday(), 1));
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilter, setShowFilter] = useState(false);

  // 詳情 Dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ApiAppointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  // 選中的日期（用於左側日期列表篩選）
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: { start_date?: string; end_date?: string; status?: string } = {};
      params.start_date = startDate;
      params.end_date = endDate;
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await adminClinicsApi.appointments.list(facilityId, params);
      setAppointments(data);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, startDate, endDate, statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // 按日期分組
  const groupedByDate = useMemo(() => {
    const groups: Record<string, ApiAppointment[]> = {};
    for (const apt of appointments) {
      const date = apt.appointment_date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(apt);
    }
    // 按日期排序
    const sortedDates = Object.keys(groups).sort();
    return sortedDates.map((date) => ({
      date,
      label: formatDateLabel(date),
      appointments: groups[date].sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)),
    }));
  }, [appointments]);

  // 篩選後的分組（選擇特定日期時）
  const displayGroups = useMemo(() => {
    if (!selectedDay) return groupedByDate;
    return groupedByDate.filter((g) => g.date === selectedDay);
  }, [groupedByDate, selectedDay]);

  // 統計
  const totalCount = appointments.length;
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
    for (const apt of appointments) {
      counts[apt.status] = (counts[apt.status] || 0) + 1;
    }
    return counts;
  }, [appointments]);

  // 快速日期範圍
  const handleQuickRange = (label: string) => {
    const today = getToday();
    setSelectedDay(null);
    switch (label) {
      case "today":
        setStartDate(today);
        setEndDate(today);
        break;
      case "week":
        setStartDate(today);
        setEndDate(addDays(today, 6));
        break;
      case "month":
        setStartDate(today);
        setEndDate(addMonths(today, 1));
        break;
    }
  };

  const handleViewDetail = (appointment: ApiAppointment) => {
    setSelectedAppointment(appointment);
    setIsEditing(false);
    setDetailOpen(true);
  };

  const handleStartEdit = () => {
    if (selectedAppointment) {
      setEditDate(selectedAppointment.appointment_date);
      setEditTime(selectedAppointment.appointment_time.substring(0, 5));
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedAppointment) return;
    setIsSubmitting(true);
    try {
      await adminClinicsApi.appointments.update(facilityId, selectedAppointment.id, {
        appointment_date: editDate,
        appointment_time: editTime,
      });
      setIsEditing(false);
      setDetailOpen(false);
      await fetchAppointments();
    } catch (err) {
      console.error("Failed to update appointment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (appointmentId: string, status: AppointmentStatus) => {
    setIsSubmitting(true);
    try {
      await adminClinicsApi.appointments.update(facilityId, appointmentId, { status });
      setDetailOpen(false);
      await fetchAppointments();
    } catch (err) {
      console.error("Failed to update appointment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const formatDate = (date: string) => {
    const d = new Date(date + "T00:00:00");
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} (${weekdays[d.getDay()]})`;
  };

  return (
    <div>
      {/* 篩選區 */}
      <div className="mb-4 space-y-3">
        {/* 快速範圍 + 狀態篩選 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
            {[
              { key: "today", label: "今天" },
              { key: "week", label: "本週" },
              { key: "month", label: "近一個月" },
            ].map(({ key, label }) => {
              const isActive =
                (key === "today" && startDate === getToday() && endDate === getToday()) ||
                (key === "week" && startDate === getToday() && endDate === addDays(getToday(), 6)) ||
                (key === "month" && startDate === getToday() && endDate === addMonths(getToday(), 1));
              return (
                <Button
                  key={key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickRange(key)}
                  className="h-8 text-xs"
                >
                  {label}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
            className={cn("h-8 gap-1 text-xs", showFilter && "border-primary text-primary")}
          >
            <Filter className="size-3.5" />
            自訂範圍
          </Button>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue placeholder="狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="confirmed">已預約</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
              <SelectItem value="no_show">未到診</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto text-sm text-muted-foreground">
            共 {totalCount} 筆
            {statusCounts.confirmed > 0 && (
              <span className="ml-2 text-xs">
                待處理{" "}
                <span className="font-medium text-primary">
                  {statusCounts.confirmed}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* 自訂日期範圍 */}
        {showFilter && (
          <div className="flex items-end gap-3 rounded-2xl bg-muted/40 p-3 ring-1 ring-foreground/5">
            <div className="grid gap-1.5">
              <Label className="text-xs">起始日期</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedDay(null);
                }}
                className="h-8 w-40 text-xs"
              />
            </div>
            <span className="text-muted-foreground pb-1.5">至</span>
            <div className="grid gap-1.5">
              <Label className="text-xs">結束日期</Label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedDay(null);
                }}
                className="h-8 w-40 text-xs"
              />
            </div>
          </div>
        )}

        {/* 日期快速跳轉列 */}
        {groupedByDate.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                selectedDay === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              全部 ({totalCount})
            </button>
            {groupedByDate.map((group) => (
              <button
                key={group.date}
                type="button"
                onClick={() =>
                  setSelectedDay(group.date === selectedDay ? null : group.date)
                }
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  selectedDay === group.date
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                {formatDateStr(group.date)} ({group.appointments.length})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 載入中 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : displayGroups.length === 0 ? (
        <AdminEmptyState
          icon={CalendarIcon}
          title="期間無預約"
          description={`${formatDateStr(startDate)} ~ ${formatDateStr(endDate)} 期間沒有任何預約`}
        />
      ) : (
        <div className="space-y-6">
          {displayGroups.map((group) => (
            <div key={group.date}>
              {/* 日期標題 */}
              <div className="mb-2 flex items-center gap-2">
                <div className="text-sm font-semibold">{group.label}</div>
                <Badge variant="outline" className="text-xs">
                  {group.appointments.length} 筆
                </Badge>
                {group.date === getToday() && (
                  <Badge className="text-xs">今天</Badge>
                )}
              </div>

              {/* 預約列表 */}
              <div className="space-y-2">
                {group.appointments.map((apt) => (
                  <Card
                    key={apt.id}
                    className={cn("cursor-pointer p-4", lumaCardHover)}
                    onClick={() => handleViewDetail(apt)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 text-center text-primary">
                        <div className="text-lg font-bold">
                          {formatTime(apt.appointment_time)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {apt.patient_name}
                          </span>
                          <Badge variant={STATUS_COLORS[apt.status]}>
                            {STATUS_LABELS[apt.status]}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {apt.service_name || "未指定服務"}
                          {apt.staff_name && ` · ${apt.staff_name}`}
                        </div>
                      </div>
                      <div className="shrink-0 text-sm text-muted-foreground">
                        {apt.patient_phone}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 詳情 Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => {
        setDetailOpen(open);
        if (!open) setIsEditing(false);
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "編輯預約時段" : "預約詳情"}</DialogTitle>
            <DialogDescription>
              {selectedAppointment && !isEditing && formatDate(selectedAppointment.appointment_date)}
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              {isEditing ? (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-date">預約日期</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-time">預約時間</Label>
                    <Input
                      id="edit-time"
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">患者姓名</div>
                    <div className="font-medium text-foreground">
                      {selectedAppointment.patient_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">聯絡電話</div>
                    <div className="font-medium text-foreground">
                      {selectedAppointment.patient_phone}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">預約日期</div>
                    <div className="font-medium text-foreground">
                      {formatDate(selectedAppointment.appointment_date)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">預約時間</div>
                    <div className="font-medium text-foreground">
                      {formatTime(selectedAppointment.appointment_time)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">狀態</div>
                    <Badge variant={STATUS_COLORS[selectedAppointment.status]}>
                      {STATUS_LABELS[selectedAppointment.status]}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">服務項目</div>
                    <div className="font-medium text-foreground">
                      {selectedAppointment.service_name || "未指定"}
                    </div>
                  </div>
                  {selectedAppointment.staff_name && (
                    <div className="col-span-2">
                      <div className="text-sm text-muted-foreground">指定人員</div>
                      <div className="font-medium text-foreground">
                        {selectedAppointment.staff_name}
                      </div>
                    </div>
                  )}
                  {selectedAppointment.notes && (
                    <div className="col-span-2">
                      <div className="text-sm text-muted-foreground">備註</div>
                      <div className="text-sm text-foreground">
                        {selectedAppointment.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className={cn("flex-col sm:flex-row", lumaDialogFooter)}>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>
                  取消
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSubmitting}>
                  {isSubmitting ? "儲存中..." : "儲存"}
                </Button>
              </>
            ) : selectedAppointment?.status === "confirmed" ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleStartEdit}
                  disabled={isSubmitting}
                  className="gap-1"
                >
                  <PencilIcon className="size-4" />
                  改期
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedAppointment.id, "cancelled")}
                  disabled={isSubmitting}
                  className="gap-1"
                >
                  <XIcon className="size-4" />
                  取消
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedAppointment.id, "no_show")}
                  disabled={isSubmitting}
                  className="gap-1"
                >
                  <ClockIcon className="size-4" />
                  未到
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(selectedAppointment.id, "completed")}
                  disabled={isSubmitting}
                  className="gap-1"
                >
                  <CheckIcon className="size-4" />
                  完成
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                關閉
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

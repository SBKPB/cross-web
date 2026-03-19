"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarIcon, CheckIcon, XIcon, ClockIcon, PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function AppointmentsTab({ facilityId }: AppointmentsTabProps) {
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ApiAppointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: { date?: string; status?: string } = {};
      if (selectedDate) params.date = selectedDate;
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await adminClinicsApi.appointments.list(facilityId, params);
      setAppointments(data);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, selectedDate, statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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
    const d = new Date(date);
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    return `${d.getMonth() + 1}/${d.getDate()} (${weekdays[d.getDay()]})`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* 篩選區 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-muted-foreground size-4" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 w-40"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-32">
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
        <div className="text-muted-foreground ml-auto text-sm">
          共 {appointments.length} 筆預約
        </div>
      </div>

      {/* 預約列表 */}
      {appointments.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <CalendarIcon className="text-muted-foreground mb-2 size-10" />
          <p className="text-muted-foreground">
            {selectedDate ? `${formatDate(selectedDate)} 無預約` : "尚無預約資料"}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {appointments.map((apt) => (
            <Card
              key={apt.id}
              className="cursor-pointer p-4 transition-shadow hover:shadow-md"
              onClick={() => handleViewDetail(apt)}
            >
              <div className="flex items-center gap-4">
                <div className="text-primary shrink-0 text-center">
                  <div className="text-lg font-bold">{formatTime(apt.appointment_time)}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{apt.patient_name}</span>
                    <Badge variant={STATUS_COLORS[apt.status]} className="text-xs">
                      {STATUS_LABELS[apt.status]}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-1 text-sm">
                    {apt.service_name || "未指定服務"}
                    {apt.staff_name && ` · ${apt.staff_name}`}
                  </div>
                </div>
                <div className="text-muted-foreground shrink-0 text-sm">
                  {apt.patient_phone}
                </div>
              </div>
            </Card>
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
                    <div className="text-muted-foreground text-sm">患者姓名</div>
                    <div className="font-medium">{selectedAppointment.patient_name}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">聯絡電話</div>
                    <div className="font-medium">{selectedAppointment.patient_phone}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">預約時間</div>
                    <div className="font-medium">
                      {formatTime(selectedAppointment.appointment_time)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">狀態</div>
                    <Badge variant={STATUS_COLORS[selectedAppointment.status]}>
                      {STATUS_LABELS[selectedAppointment.status]}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <div className="text-muted-foreground text-sm">服務項目</div>
                    <div className="font-medium">
                      {selectedAppointment.service_name || "未指定"}
                    </div>
                  </div>
                  {selectedAppointment.staff_name && (
                    <div className="col-span-2">
                      <div className="text-muted-foreground text-sm">指定人員</div>
                      <div className="font-medium">{selectedAppointment.staff_name}</div>
                    </div>
                  )}
                  {selectedAppointment.notes && (
                    <div className="col-span-2">
                      <div className="text-muted-foreground text-sm">備註</div>
                      <div className="text-sm">{selectedAppointment.notes}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
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

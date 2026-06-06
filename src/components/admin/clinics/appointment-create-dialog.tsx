"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { lumaDialogFooter } from "@/lib/styles/luma";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import type { ApiService, ApiStaff } from "@/types/clinic";

interface AppointmentCreateDialogProps {
  facilityId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

// 可被預約的人員角色（對齊後端 PROFESSIONAL_ROLES）
const BOOKABLE_ROLES = new Set(["doctor", "beautician", "therapist"]);

interface FormState {
  patient_name: string;
  patient_national_id: string;
  patient_phone: string;
  patient_gender: string; // "_none" | "M" | "F"
  staff_id: string;
  service_id: string; // "_none" | id
  appointment_date: string;
  appointment_time: string;
  booking_method: "phone" | "walk_in";
  notes: string;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function initialForm(): FormState {
  return {
    patient_name: "",
    patient_national_id: "",
    patient_phone: "",
    patient_gender: "_none",
    staff_id: "",
    service_id: "_none",
    appointment_date: getToday(),
    appointment_time: "",
    booking_method: "phone",
    notes: "",
  };
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "data" in err) {
    const data = (err as { data?: unknown }).data;
    if (data && typeof data === "object" && "detail" in data) {
      const detail = (data as { detail: unknown }).detail;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail) && detail[0] && typeof detail[0] === "object") {
        const msg = (detail[0] as { msg?: unknown }).msg;
        if (typeof msg === "string") return msg.replace(/^Value error,\s*/, "");
      }
    }
  }
  return fallback;
}

export function AppointmentCreateDialog({
  facilityId,
  open,
  onOpenChange,
  onCreated,
}: AppointmentCreateDialogProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [staffList, setStaffList] = useState<ApiStaff[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((f) => ({ ...f, [key]: value })),
    [],
  );

  // 開啟時載入人員與服務、並重置表單
  useEffect(() => {
    if (!open) return;
    setForm(initialForm());
    setError(null);
    void (async () => {
      try {
        const [staff, svc] = await Promise.all([
          adminClinicsApi.staff.list(facilityId),
          adminClinicsApi.services.list(facilityId),
        ]);
        setStaffList(staff.filter((s) => s.is_active && BOOKABLE_ROLES.has(s.role)));
        setServices(svc.filter((s) => s.is_active));
      } catch {
        // 人員/服務載入失敗不阻斷表單，送出時後端仍會驗證
        setStaffList([]);
        setServices([]);
      }
    })();
  }, [open, facilityId]);

  const canSubmit =
    form.patient_name.trim() !== "" &&
    form.patient_national_id.trim() !== "" &&
    form.staff_id !== "" &&
    form.appointment_date !== "" &&
    form.appointment_time !== "";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await adminClinicsApi.appointments.create(facilityId, {
        patient_name: form.patient_name.trim(),
        patient_national_id: form.patient_national_id.trim().toUpperCase(),
        patient_phone: form.patient_phone.trim() || undefined,
        patient_gender:
          form.patient_gender === "_none"
            ? undefined
            : (form.patient_gender as "M" | "F"),
        service_id: form.service_id === "_none" ? undefined : form.service_id,
        staff_id: form.staff_id,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        booking_method: form.booking_method,
        notes: form.notes.trim() || undefined,
      });
      onCreated();
      onOpenChange(false);
    } catch (err) {
      setError(extractErrorMessage(err, "建立預約失敗，請確認時段是否可預約"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>新增預約</DialogTitle>
          <DialogDescription>
            為現場 / 電話客人代訂。以身分證字號為識別碼，日後該客人註冊會員後可串回此筆紀錄。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="apt-name" className="text-sm font-medium">
                患者姓名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="apt-name"
                value={form.patient_name}
                onChange={(e) => set("patient_name", e.target.value)}
                placeholder="王小明"
                maxLength={50}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="apt-id" className="text-sm font-medium">
                身分證字號 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="apt-id"
                value={form.patient_national_id}
                onChange={(e) =>
                  set("patient_national_id", e.target.value.toUpperCase())
                }
                placeholder="A123456789"
                maxLength={10}
                className="tabular-nums"
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="apt-phone" className="text-sm font-medium">
                聯絡電話
              </Label>
              <Input
                id="apt-phone"
                value={form.patient_phone}
                onChange={(e) => set("patient_phone", e.target.value)}
                placeholder="0912-345-678"
                maxLength={15}
                className="tabular-nums"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">性別</Label>
              <Select
                value={form.patient_gender}
                onValueChange={(v) => set("patient_gender", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">未填</SelectItem>
                  <SelectItem value="M">男</SelectItem>
                  <SelectItem value="F">女</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">
                指定人員 <span className="text-destructive">*</span>
              </Label>
              <Select value={form.staff_id} onValueChange={(v) => set("staff_id", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="選擇人員" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      無可預約人員
                    </SelectItem>
                  ) : (
                    staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">服務項目</Label>
              <Select
                value={form.service_id}
                onValueChange={(v) => set("service_id", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="不指定" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">不指定</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.service_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="apt-date" className="text-sm font-medium">
                預約日期 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="apt-date"
                type="date"
                min={getToday()}
                value={form.appointment_date}
                onChange={(e) => set("appointment_date", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="apt-time" className="text-sm font-medium">
                預約時間 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="apt-time"
                type="time"
                value={form.appointment_time}
                onChange={(e) => set("appointment_time", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">預約方式</Label>
              <Select
                value={form.booking_method}
                onValueChange={(v) => set("booking_method", v as "phone" | "walk_in")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">電話</SelectItem>
                  <SelectItem value="walk_in">現場</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="apt-notes" className="text-sm font-medium">
              備註
            </Label>
            <Input
              id="apt-notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="選填"
            />
          </div>

          {error && (
            <p className="flex items-start gap-1.5 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive ring-1 ring-destructive/20">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <DialogFooter className={cn(lumaDialogFooter)}>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            建立預約
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

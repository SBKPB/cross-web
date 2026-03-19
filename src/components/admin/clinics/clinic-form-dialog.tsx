"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  MedicalFacility,
  MedicalFacilityCreate,
  MedicalFacilityUpdate,
  ApiMedicalDepartment,
  PaymentType,
  BreakTime,
} from "@/types/clinic";
import {
  API_DEPARTMENT_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
} from "@/lib/constants/clinic-constants";

interface ClinicFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinic?: MedicalFacility | null;
  onSubmit: (data: MedicalFacilityCreate | MedicalFacilityUpdate) => Promise<void>;
  isLoading?: boolean;
}

interface BusinessHourEntry {
  open: string;
  close: string;
  is_closed: boolean;
  breaks: BreakTime[];
}

type BusinessHours = Record<string, BusinessHourEntry>;

interface FormData {
  name: string;
  phone: string;
  address: string;
  medical_department: ApiMedicalDepartment;
  payment_type: PaymentType;
  is_active: boolean;
  business_hours: BusinessHours;
  slot_duration: number;
}

const SLOT_DURATION_OPTIONS = [
  { value: 3, label: "3 分鐘" },
  { value: 5, label: "5 分鐘" },
  { value: 15, label: "15 分鐘" },
  { value: 30, label: "30 分鐘" },
  { value: 60, label: "60 分鐘" },
] as const;

const WEEKDAYS = [
  { key: "monday", label: "週一" },
  { key: "tuesday", label: "週二" },
  { key: "wednesday", label: "週三" },
  { key: "thursday", label: "週四" },
  { key: "friday", label: "週五" },
  { key: "saturday", label: "週六" },
  { key: "sunday", label: "週日" },
] as const;

const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { open: "09:00", close: "18:00", is_closed: false, breaks: [] },
  tuesday: { open: "09:00", close: "18:00", is_closed: false, breaks: [] },
  wednesday: { open: "09:00", close: "18:00", is_closed: false, breaks: [] },
  thursday: { open: "09:00", close: "18:00", is_closed: false, breaks: [] },
  friday: { open: "09:00", close: "18:00", is_closed: false, breaks: [] },
  saturday: { open: "09:00", close: "12:00", is_closed: false, breaks: [] },
  sunday: { open: "09:00", close: "12:00", is_closed: true, breaks: [] },
};

function parseBusinessHours(
  hours: Record<string, { open: string; close: string; breaks?: BreakTime[] }> | null | undefined
): BusinessHours {
  if (!hours) return { ...DEFAULT_BUSINESS_HOURS };

  const result: BusinessHours = {};
  for (const day of WEEKDAYS) {
    const dayHours = hours[day.key];
    if (dayHours) {
      result[day.key] = {
        open: dayHours.open || "09:00",
        close: dayHours.close || "18:00",
        is_closed: false,
        breaks: dayHours.breaks ?? [],
      };
    } else {
      result[day.key] = { ...DEFAULT_BUSINESS_HOURS[day.key], breaks: [] };
    }
  }
  return result;
}

function getInitialFormData(clinic: MedicalFacility | null | undefined): FormData {
  if (clinic) {
    return {
      name: clinic.name,
      phone: clinic.phone || "",
      address: clinic.address || "",
      medical_department: clinic.medical_department,
      payment_type: clinic.payment_type,
      is_active: clinic.is_active,
      business_hours: parseBusinessHours(clinic.business_hours),
      slot_duration: clinic.slot_duration ?? 30,
    };
  }
  return {
    name: "",
    phone: "",
    address: "",
    medical_department: "general_practice",
    payment_type: "nhi",
    is_active: true,
    business_hours: { ...DEFAULT_BUSINESS_HOURS },
    slot_duration: 30,
  };
}

function ClinicFormContent({
  clinic,
  onOpenChange,
  onSubmit,
  isLoading,
}: Omit<ClinicFormDialogProps, "open">) {
  const isEditing = !!clinic;
  const [formData, setFormData] = useState<FormData>(() =>
    getInitialFormData(clinic)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 轉換營業時間格式（移除 is_closed 的日子）
    const business_hours: Record<string, { open: string; close: string; breaks?: BreakTime[] }> = {};
    for (const [day, hours] of Object.entries(formData.business_hours)) {
      if (!hours.is_closed) {
        business_hours[day] = {
          open: hours.open,
          close: hours.close,
          ...(hours.breaks.length > 0 ? { breaks: hours.breaks } : {}),
        };
      }
    }

    const data: MedicalFacilityCreate | MedicalFacilityUpdate = {
      name: formData.name,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      medical_department: formData.medical_department,
      payment_type: formData.payment_type,
      business_hours: Object.keys(business_hours).length > 0 ? business_hours : undefined,
      slot_duration: formData.slot_duration,
    };

    if (isEditing) {
      (data as MedicalFacilityUpdate).is_active = formData.is_active;
    }

    await onSubmit(data);
  };

  const updateBusinessHour = (
    day: string,
    field: keyof BusinessHourEntry,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          [field]: value,
        },
      },
    }));
  };

  const addBreak = (day: string) => {
    setFormData((prev) => {
      const dayHours = prev.business_hours[day];
      if (dayHours.breaks.length >= 2) return prev;
      return {
        ...prev,
        business_hours: {
          ...prev.business_hours,
          [day]: {
            ...dayHours,
            breaks: [...dayHours.breaks, { start: "12:00", end: "13:00" }],
          },
        },
      };
    });
  };

  const removeBreak = (day: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          breaks: prev.business_hours[day].breaks.filter((_, i) => i !== index),
        },
      },
    }));
  };

  const updateBreak = (day: string, index: number, field: "start" | "end", value: string) => {
    setFormData((prev) => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          breaks: prev.business_hours[day].breaks.map((b, i) =>
            i === index ? { ...b, [field]: value } : b
          ),
        },
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEditing ? "編輯院所" : "新增院所"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "修改院所資訊" : "填寫院所基本資料"}
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="basic" className="mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">基本資料</TabsTrigger>
          <TabsTrigger value="hours">營業時間</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                院所名稱 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="請輸入院所名稱"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="medical_department">科別</Label>
                <Select
                  value={formData.medical_department}
                  onValueChange={(value: ApiMedicalDepartment) =>
                    setFormData((prev) => ({
                      ...prev,
                      medical_department: value,
                    }))
                  }
                >
                  <SelectTrigger id="medical_department" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {API_DEPARTMENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment_type">付費類型</Label>
                <Select
                  value={formData.payment_type}
                  onValueChange={(value: PaymentType) =>
                    setFormData((prev) => ({ ...prev, payment_type: value }))
                  }
                >
                  <SelectTrigger id="payment_type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">電話</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="例：02-12345678"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">地址</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="請輸入地址"
              />
            </div>

            {isEditing && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: checked === true,
                    }))
                  }
                />
                <Label htmlFor="is_active" className="font-normal">
                  啟用院所
                </Label>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="hours" className="mt-4">
          <div className="mb-4">
            <Label htmlFor="slot_duration">預約時段間隔</Label>
            <Select
              value={String(formData.slot_duration)}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, slot_duration: Number(value) }))
              }
            >
              <SelectTrigger id="slot_duration" className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SLOT_DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground mt-1 text-xs">
              設定預約系統中每個可選時段的間隔時間
            </p>
          </div>
          <div className="space-y-2">
            {WEEKDAYS.map((day) => {
              const hours = formData.business_hours[day.key];
              return (
                <div key={day.key} className="rounded-lg border p-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 shrink-0 font-medium text-sm">{day.label}</span>
                    <Checkbox
                      id={`${day.key}-closed`}
                      checked={!hours.is_closed}
                      onCheckedChange={(checked) =>
                        updateBusinessHour(day.key, "is_closed", !checked)
                      }
                    />
                    <Label htmlFor={`${day.key}-closed`} className="shrink-0 text-sm">
                      營業
                    </Label>
                    <div className="ml-auto">
                      {!hours.is_closed ? (
                        <div className="flex items-center">
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) =>
                              updateBusinessHour(day.key, "open", e.target.value)
                            }
                            className="border-input h-8 w-32 rounded border bg-transparent px-2 text-sm"
                          />
                          <span className="text-muted-foreground mx-2 text-sm">~</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) =>
                              updateBusinessHour(day.key, "close", e.target.value)
                            }
                            className="border-input h-8 w-32 rounded border bg-transparent px-2 text-sm"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">休息</span>
                      )}
                    </div>
                  </div>
                  {/* 休息時段 */}
                  {!hours.is_closed && (
                    <div className="mt-1.5 ml-10 space-y-1">
                      {hours.breaks.map((b, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="text-muted-foreground shrink-0 text-xs">休息</span>
                          <input
                            type="time"
                            value={b.start}
                            onChange={(e) => updateBreak(day.key, idx, "start", e.target.value)}
                            className="border-input h-7 w-28 rounded border bg-transparent px-1.5 text-xs"
                          />
                          <span className="text-muted-foreground text-xs">~</span>
                          <input
                            type="time"
                            value={b.end}
                            onChange={(e) => updateBreak(day.key, idx, "end", e.target.value)}
                            className="border-input h-7 w-28 rounded border bg-transparent px-1.5 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeBreak(day.key, idx)}
                            className="text-muted-foreground hover:text-destructive ml-1 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {hours.breaks.length < 2 && (
                        <button
                          type="button"
                          onClick={() => addBreak(day.key)}
                          className="text-muted-foreground hover:text-foreground text-xs"
                        >
                          + 新增休息時段
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          取消
        </Button>
        <Button type="submit" disabled={isLoading || !formData.name.trim()}>
          {isLoading ? "處理中..." : isEditing ? "儲存" : "新增"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ClinicFormDialog({
  open,
  onOpenChange,
  clinic,
  onSubmit,
  isLoading = false,
}: ClinicFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {open && (
          <ClinicFormContent
            key={clinic?.id || "new"}
            clinic={clinic}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { CalendarIcon } from "lucide-react";
import { zhTW } from "react-day-picker/locale";

import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useBooking, useBookingDispatch } from "@/components/booking/booking-context";
import { GENDER_OPTIONS } from "@/lib/constants/booking-constants";
import { cn } from "@/lib/utils";

function parseLocalDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function formatISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatChineseDate(date: Date): string {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

interface BookingFormProps {
  primaryColor?: string;
}

export function BookingForm({ primaryColor = "#3b82f6" }: BookingFormProps) {
  const { formData } = useBooking();
  const dispatch = useBookingDispatch();

  const updateFormData = (data: Partial<typeof formData>) => {
    dispatch({ type: "SET_FORM_DATA", payload: data });
  };

  // 生日範圍：1900 ~ 今天
  const birthDateValue = parseLocalDate(formData.birthDate);
  const today = new Date();
  const minBirthDate = new Date(1900, 0, 1);

  return (
    <div className="space-y-6 px-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        預約人資料
      </h2>

      <div className="rounded-4xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            姓名 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="請輸入您的姓名"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            className="h-11"
          />
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label>
            性別 <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.gender || ""}
            onValueChange={(value) =>
              updateFormData({ gender: value as typeof formData.gender })
            }
            className="flex gap-6"
          >
            {GENDER_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <RadioGroupItem
                  value={option.value}
                  id={`gender-${option.value}`}
                  style={{
                    backgroundColor:
                      formData.gender === option.value
                        ? primaryColor
                        : undefined,
                  }}
                />
                <Label
                  htmlFor={`gender-${option.value}`}
                  className="cursor-pointer font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Birth Date */}
        <div className="space-y-2">
          <Label htmlFor="birthDate">
            生日 <span className="text-destructive">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                id="birthDate"
                type="button"
                className={cn(
                  "flex h-11 w-full items-center justify-between gap-2 rounded-3xl border border-transparent bg-input/50 px-4 text-left text-base transition-all outline-none",
                  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
                  !birthDateValue && "text-muted-foreground",
                )}
              >
                <span>
                  {birthDateValue ? formatChineseDate(birthDateValue) : "請選擇生日"}
                </span>
                <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-2"
              align="start"
              style={{ "--primary": primaryColor } as React.CSSProperties}
            >
              <Calendar
                mode="single"
                selected={birthDateValue}
                onSelect={(date) => {
                  if (!date) return;
                  updateFormData({ birthDate: formatISODate(date) });
                }}
                captionLayout="dropdown"
                fromDate={minBirthDate}
                toDate={today}
                defaultMonth={birthDateValue || new Date(1990, 0)}
                locale={zhTW}
                showOutsideDays={false}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            手機號碼 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="0912-345-678"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            className="h-11"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">備註（選填）</Label>
          <Textarea
            id="notes"
            placeholder="如有特殊需求請在此說明"
            value={formData.notes}
            onChange={(e) => updateFormData({ notes: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      {/* Privacy Policy */}
      <div className="flex items-start gap-2 px-1">
        <Checkbox
          id="privacy"
          checked={formData.privacyAccepted}
          onCheckedChange={(checked) =>
            updateFormData({ privacyAccepted: checked === true })
          }
          style={{
            backgroundColor: formData.privacyAccepted ? primaryColor : undefined,
            borderColor: formData.privacyAccepted ? primaryColor : undefined,
          }}
        />
        <Label
          htmlFor="privacy"
          className="cursor-pointer text-sm font-normal leading-relaxed text-muted-foreground"
        >
          我已閱讀並同意{" "}
          <a
            href="/privacy"
            target="_blank"
            className="underline underline-offset-2"
            style={{ color: primaryColor }}
          >
            隱私權政策
          </a>{" "}
          及{" "}
          <a
            href="/terms"
            target="_blank"
            className="underline underline-offset-2"
            style={{ color: primaryColor }}
          >
            服務條款
          </a>
        </Label>
      </div>
    </div>
  );
}

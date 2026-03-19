"use client";

import { useBooking, useBookingDispatch } from "@/lib/booking/booking-context";
import { GENDER_OPTIONS } from "@/lib/constants/booking-constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface BookingFormProps {
  primaryColor?: string;
}

export function BookingForm({ primaryColor = "#3b82f6" }: BookingFormProps) {
  const { formData } = useBooking();
  const dispatch = useBookingDispatch();

  const updateFormData = (data: Partial<typeof formData>) => {
    dispatch({ type: "SET_FORM_DATA", payload: data });
  };

  return (
    <div className="space-y-5 px-4">
      <h2 className="text-sm font-medium text-slate-500">預約人資料</h2>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          姓名 <span className="text-red-500">*</span>
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
          性別 <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={formData.gender || ""}
          onValueChange={(value) =>
            updateFormData({ gender: value as typeof formData.gender })
          }
          className="flex gap-4"
        >
          {GENDER_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem
                value={option.value}
                id={`gender-${option.value}`}
                className={cn(
                  formData.gender === option.value && "border-current text-current"
                )}
                style={{
                  borderColor: formData.gender === option.value ? primaryColor : undefined,
                  color: formData.gender === option.value ? primaryColor : undefined,
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

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">
          手機號碼 <span className="text-red-500">*</span>
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

      {/* Privacy Policy */}
      <div className="flex items-start gap-2">
        <Checkbox
          id="privacy"
          checked={formData.privacyAccepted}
          onCheckedChange={(checked) =>
            updateFormData({ privacyAccepted: checked === true })
          }
          className={cn(
            formData.privacyAccepted && "border-current bg-current"
          )}
          style={{
            borderColor: formData.privacyAccepted ? primaryColor : undefined,
            backgroundColor: formData.privacyAccepted ? primaryColor : undefined,
          }}
        />
        <Label
          htmlFor="privacy"
          className="cursor-pointer text-sm font-normal leading-relaxed text-slate-600"
        >
          我已閱讀並同意{" "}
          <a
            href="/privacy"
            target="_blank"
            className="underline"
            style={{ color: primaryColor }}
          >
            隱私權政策
          </a>{" "}
          及{" "}
          <a
            href="/terms"
            target="_blank"
            className="underline"
            style={{ color: primaryColor }}
          >
            服務條款
          </a>
        </Label>
      </div>
    </div>
  );
}

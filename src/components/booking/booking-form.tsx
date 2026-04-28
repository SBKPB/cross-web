"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBooking, useBookingDispatch } from "@/components/booking/booking-context";

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
    <div className="space-y-6 px-4">
      <div className="rounded-4xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
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

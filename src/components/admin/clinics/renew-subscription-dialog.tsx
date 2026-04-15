"use client";

import { useEffect, useState } from "react";
import { CalendarPlus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { lumaDialogFooter, lumaIconBadge } from "@/lib/admin/luma-styles";
import { cn } from "@/lib/utils";
import type { MedicalFacility } from "@/types/clinic";

interface RenewSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facility: MedicalFacility | null;
  onRenewed: (updated: MedicalFacility) => void;
}

type Preset = "1m" | "3m" | "6m" | "1y" | "custom";

const PRESETS: { value: Preset; label: string; months: number }[] = [
  { value: "1m", label: "1 個月", months: 1 },
  { value: "3m", label: "3 個月", months: 3 },
  { value: "6m", label: "半年", months: 6 },
  { value: "1y", label: "1 年", months: 12 },
];

function formatDateInput(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * 計算續約後的新到期日：
 * - 若仍在有效期內：從原 expires_at 加上 N 個月（保留剩餘天數）
 * - 若已過期或無到期日：從今天加上 N 個月
 */
function calcNewExpiry(currentExpiry: string | null, months: number): Date {
  const now = new Date();
  let base: Date;
  if (currentExpiry) {
    const parsed = new Date(currentExpiry);
    base = parsed > now ? parsed : now;
  } else {
    base = now;
  }
  return addMonths(base, months);
}

export function RenewSubscriptionDialog({
  open,
  onOpenChange,
  facility,
  onRenewed,
}: RenewSubscriptionDialogProps) {
  const [preset, setPreset] = useState<Preset>("1m");
  const [customExpiry, setCustomExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 重設表單狀態（每次重開）
  useEffect(() => {
    if (open && facility) {
      setPreset("1m");
      const initial = calcNewExpiry(facility.subscription_expires_at, 1);
      setCustomExpiry(formatDateInput(initial));
      setNotes("");
      setError(null);
    }
  }, [open, facility]);

  if (!facility) return null;

  const previewExpiry =
    preset === "custom"
      ? customExpiry
      : formatDateInput(
          calcNewExpiry(
            facility.subscription_expires_at,
            PRESETS.find((p) => p.value === preset)?.months ?? 1,
          ),
        );

  const handleSelectPreset = (value: Preset) => {
    setPreset(value);
    if (value !== "custom") {
      const months = PRESETS.find((p) => p.value === value)?.months ?? 1;
      const newDate = calcNewExpiry(facility.subscription_expires_at, months);
      setCustomExpiry(formatDateInput(newDate));
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const [y, m, d] = previewExpiry.split("-").map(Number);
      const expiryIso = new Date(y, m - 1, d, 23, 59, 59).toISOString();

      // 拼接備註：保留原有 notes，append 這次續約紀錄
      const today = formatDateInput(new Date());
      const renewalLog = `[${today}] 續約至 ${previewExpiry}${notes ? `：${notes}` : ""}`;
      const mergedNotes = facility.subscription_notes
        ? `${facility.subscription_notes}\n${renewalLog}`
        : renewalLog;

      const updated = await adminClinicsApi.updateSubscription(facility.id, {
        subscription_status: "active",
        subscription_expires_at: expiryIso,
        subscription_notes: mergedNotes,
        // 起始日如果沒設，補上今天
        ...(facility.subscription_started_at
          ? {}
          : { subscription_started_at: new Date().toISOString() }),
      });
      onRenewed(updated);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError("續約失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={lumaIconBadge}>
              <CalendarPlus className="size-5" />
            </div>
            <div>
              <DialogTitle>續約訂閱</DialogTitle>
              <DialogDescription>
                {facility.name}
                {facility.subscription_expires_at && (
                  <>
                    {" · "}目前到期日{" "}
                    {formatDateInput(new Date(facility.subscription_expires_at))}
                  </>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>續約期間</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {PRESETS.map((p) => (
                <Button
                  key={p.value}
                  type="button"
                  variant={preset === p.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelectPreset(p.value)}
                >
                  {p.label}
                </Button>
              ))}
              <Button
                type="button"
                variant={preset === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelectPreset("custom")}
              >
                自訂
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new-expiry">
              續約後到期日
              {preset !== "custom" && (
                <span className="ml-2 text-xs text-muted-foreground">
                  （依所選期間自動計算，可手動調整）
                </span>
              )}
            </Label>
            <Input
              id="new-expiry"
              type="date"
              value={customExpiry}
              onChange={(e) => {
                setCustomExpiry(e.target.value);
                setPreset("custom");
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="renewal-note">付款記錄 / 備註</Label>
            <Textarea
              id="renewal-note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例：bank transfer NT$1500，2026/04/15 入帳"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              續約紀錄會自動附加到原備註後面，含日期與新到期日
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className={cn(lumaDialogFooter)}>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || !previewExpiry}>
            {isSaving ? "處理中..." : `續約至 ${previewExpiry}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

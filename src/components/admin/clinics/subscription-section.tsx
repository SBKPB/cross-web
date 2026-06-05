"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarPlus,
  Clock3,
  CreditCard,
  Loader2,
  Pencil,
} from "lucide-react";
import { RenewSubscriptionDialog } from "@/components/admin/clinics/renew-subscription-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import { isSystemAdmin } from "@/lib/auth/roles";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { lumaDialogFooter, lumaIconBadge } from "@/lib/styles/luma";
import { cn } from "@/lib/utils";
import type {
  MedicalFacility,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/types/clinic";

interface SubscriptionSectionProps {
  facility: MedicalFacility;
  onUpdated: (facility: MedicalFacility) => void;
}

const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  free: "免費",
  standard: "標準",
  pro: "專業",
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: "試用中",
  active: "使用中",
  suspended: "已暫停",
  cancelled: "已取消",
};

// 狀態 pill 柔色
const STATUS_PILL: Record<SubscriptionStatus, string> = {
  trial: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700",
  suspended: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
}

function getDaysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const expiry = new Date(iso).getTime();
  const now = Date.now();
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
}

export function SubscriptionSection({
  facility,
  onUpdated,
}: SubscriptionSectionProps) {
  const { user } = useAuth();
  const canEdit = isSystemAdmin(user);
  const [editOpen, setEditOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);

  const daysUntil = getDaysUntil(facility.subscription_expires_at);
  const isExpiringSoon =
    facility.subscription_status === "active" &&
    daysUntil !== null &&
    daysUntil >= 0 &&
    daysUntil <= 7;
  const isExpired =
    facility.subscription_status === "active" &&
    daysUntil !== null &&
    daysUntil < 0;

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={lumaIconBadge}>
              <CreditCard className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                訂閱資訊
              </h3>
              <p className="text-sm text-muted-foreground">
                {canEdit
                  ? "由系統管理員手動維護"
                  : "如需異動請聯絡系統管理員"}
              </p>
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setRenewOpen(true)}
              >
                <CalendarPlus className="mr-1.5 size-4" />
                續約
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="mr-1.5 size-4" />
                編輯
              </Button>
            </div>
          )}
        </div>

        {/* 警示 banner */}
        {isExpired && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-destructive/10 p-3.5 text-sm font-medium text-destructive ring-1 ring-destructive/15">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              訂閱已於{" "}
              <span className="tabular-nums">
                {formatDate(facility.subscription_expires_at)}
              </span>{" "}
              到期，請盡快續訂
            </span>
          </div>
        )}
        {isExpiringSoon && !isExpired && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-100 p-3.5 text-sm font-medium text-amber-700 ring-1 ring-amber-200">
            <Clock3 className="size-4 shrink-0" />
            <span>
              訂閱將於 <span className="tabular-nums">{daysUntil}</span>{" "}
              天後（
              <span className="tabular-nums">
                {formatDate(facility.subscription_expires_at)}
              </span>
              ）到期
            </span>
          </div>
        )}

        {/* 資訊網格 */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
            <div className="text-xs font-medium text-muted-foreground">
              方案
            </div>
            <div className="mt-1.5">
              <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {PLAN_LABEL[facility.subscription_plan]}
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
            <div className="text-xs font-medium text-muted-foreground">
              狀態
            </div>
            <div className="mt-1.5">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                  STATUS_PILL[facility.subscription_status],
                )}
              >
                {STATUS_LABEL[facility.subscription_status]}
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
            <div className="text-xs font-medium text-muted-foreground">
              起始日
            </div>
            <div className="mt-1.5 font-medium text-foreground tabular-nums">
              {formatDate(facility.subscription_started_at)}
            </div>
          </div>
          <div className="rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
            <div className="text-xs font-medium text-muted-foreground">
              到期日
            </div>
            <div className="mt-1.5 font-medium text-foreground tabular-nums">
              {formatDate(facility.subscription_expires_at)}
            </div>
          </div>
          <div className="rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5 sm:col-span-2">
            <div className="text-xs font-medium text-muted-foreground">
              付款記錄 / 備註
            </div>
            <div className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">
              {facility.subscription_notes || "—"}
            </div>
          </div>
        </div>
      </Card>

      {canEdit && (
        <>
          <SubscriptionEditDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            facility={facility}
            onUpdated={onUpdated}
          />
          <RenewSubscriptionDialog
            open={renewOpen}
            onOpenChange={setRenewOpen}
            facility={facility}
            onRenewed={onUpdated}
          />
        </>
      )}
    </>
  );
}

interface SubscriptionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facility: MedicalFacility;
  onUpdated: (facility: MedicalFacility) => void;
}

// 把 ISO datetime 轉成 <input type="date"> 用的 YYYY-MM-DD
function isoToDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// YYYY-MM-DD → 當地時區當天 00:00:00 的 ISO string（後端會接受）
function dateInputToIso(value: string, endOfDay = false): string | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d, endOfDay ? 23 : 0, endOfDay ? 59 : 0, 0);
  return dt.toISOString();
}

function SubscriptionEditDialog({
  open,
  onOpenChange,
  facility,
  onUpdated,
}: SubscriptionEditDialogProps) {
  const [plan, setPlan] = useState<SubscriptionPlan>(facility.subscription_plan);
  const [statusValue, setStatusValue] = useState<SubscriptionStatus>(
    facility.subscription_status,
  );
  const [startedAt, setStartedAt] = useState(
    isoToDateInput(facility.subscription_started_at),
  );
  const [expiresAt, setExpiresAt] = useState(
    isoToDateInput(facility.subscription_expires_at),
  );
  const [notes, setNotes] = useState(facility.subscription_notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await adminClinicsApi.updateSubscription(facility.id, {
        subscription_plan: plan,
        subscription_status: statusValue,
        subscription_started_at: dateInputToIso(startedAt),
        subscription_expires_at: dateInputToIso(expiresAt, true),
        subscription_notes: notes || null,
      });
      onUpdated(updated);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError("儲存失敗，請稍後再試");
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
              <CreditCard className="size-5" />
            </div>
            <div>
              <DialogTitle>編輯訂閱資訊</DialogTitle>
              <DialogDescription>
                「{facility.name}」— 此操作只有系統管理員可進行
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-3 rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="plan" className="text-sm font-medium">
                  方案
                </Label>
                <Select
                  value={plan}
                  onValueChange={(v) => setPlan(v as SubscriptionPlan)}
                >
                  <SelectTrigger id="plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">免費</SelectItem>
                    <SelectItem value="standard">標準</SelectItem>
                    <SelectItem value="pro">專業</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  狀態
                </Label>
                <Select
                  value={statusValue}
                  onValueChange={(v) => setStatusValue(v as SubscriptionStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">試用中</SelectItem>
                    <SelectItem value="active">使用中</SelectItem>
                    <SelectItem value="suspended">已暫停</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="started_at" className="text-sm font-medium">
                  起始日
                </Label>
                <Input
                  id="started_at"
                  type="date"
                  className="tabular-nums"
                  value={startedAt}
                  onChange={(e) => setStartedAt(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expires_at" className="text-sm font-medium">
                  到期日
                </Label>
                <Input
                  id="expires_at"
                  type="date"
                  className="tabular-nums"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              付款記錄 / 備註
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例：4 月份月費 NT$1500，2026/04/15 銀行轉帳收款"
              rows={4}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className={cn(lumaDialogFooter)}>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {isSaving ? "儲存中..." : "儲存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

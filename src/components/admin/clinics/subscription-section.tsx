"use client";

import { useState } from "react";
import { CalendarPlus, CreditCard, Pencil } from "lucide-react";
import { RenewSubscriptionDialog } from "@/components/admin/clinics/renew-subscription-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { lumaDialogFooter, lumaIconBadge } from "@/lib/admin/luma-styles";
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
  trial: "試用",
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: "試用中",
  active: "使用中",
  suspended: "已暫停",
  cancelled: "已取消",
};

const STATUS_VARIANT: Record<
  SubscriptionStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  trial: "outline",
  active: "secondary",
  suspended: "destructive",
  cancelled: "destructive",
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
          <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
            訂閱已於 {formatDate(facility.subscription_expires_at)} 到期，請盡快續訂
          </div>
        )}
        {isExpiringSoon && !isExpired && (
          <div className="mt-4 rounded-xl bg-muted p-3 text-sm text-foreground ring-1 ring-border">
            訂閱將於 {daysUntil} 天後（{formatDate(facility.subscription_expires_at)}）到期
          </div>
        )}

        {/* 資訊網格 */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">方案</div>
            <div className="mt-1 font-medium text-foreground">
              {PLAN_LABEL[facility.subscription_plan]}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">狀態</div>
            <div className="mt-1">
              <Badge variant={STATUS_VARIANT[facility.subscription_status]}>
                {STATUS_LABEL[facility.subscription_status]}
              </Badge>
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">起始日</div>
            <div className="mt-1 font-medium text-foreground">
              {formatDate(facility.subscription_started_at)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">到期日</div>
            <div className="mt-1 font-medium text-foreground">
              {formatDate(facility.subscription_expires_at)}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm text-muted-foreground">付款記錄 / 備註</div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-foreground">
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
          <DialogTitle>編輯訂閱資訊</DialogTitle>
          <DialogDescription>
            「{facility.name}」— 此操作只有系統管理員可進行
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="plan">方案</Label>
              <Select
                value={plan}
                onValueChange={(v) => setPlan(v as SubscriptionPlan)}
              >
                <SelectTrigger id="plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">試用</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">狀態</Label>
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
              <Label htmlFor="started_at">起始日</Label>
              <Input
                id="started_at"
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expires_at">到期日</Label>
              <Input
                id="expires_at"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">付款記錄 / 備註</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例：4 月份月費 NT$1500，2026/04/15 銀行轉帳收款"
              rows={4}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
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
            {isSaving ? "儲存中..." : "儲存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { AlertCircleIcon, KeyRoundIcon, Loader2 } from "lucide-react";
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
import { lumaDialogFooter } from "@/lib/styles/luma";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  current: string;
  next: string;
  confirm: string;
}

const EMPTY: FormState = { current: "", next: "", confirm: "" };

function ChangePasswordContent({
  onOpenChange,
}: Pick<ChangePasswordDialogProps, "onOpenChange">) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.next.length < 6) {
      setError("新密碼至少需 6 碼");
      return;
    }
    if (form.next !== form.confirm) {
      setError("兩次新密碼不一致");
      return;
    }
    if (form.next === form.current) {
      setError("新密碼不可與目前密碼相同");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword(form.current, form.next);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as { detail?: string } | null;
        setError(data?.detail ?? "更改失敗，請稍後再試");
      } else {
        setError("更改失敗，請稍後再試");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader className="flex-row items-start gap-3 space-y-0">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <KeyRoundIcon className="size-5" />
        </span>
        <div className="flex flex-col gap-1.5">
          <DialogTitle>修改密碼</DialogTitle>
          <DialogDescription>需要先輸入目前密碼以驗證身份。</DialogDescription>
        </div>
      </DialogHeader>

      <div className="mt-4 grid gap-4">
        <div className="rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
          <p className="text-sm font-medium text-foreground">身份驗證</p>
          <div className="mt-3 grid gap-2">
            <Label htmlFor="current-password" className="text-sm font-medium">
              目前密碼 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={form.current}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, current: e.target.value }))
              }
              required
            />
          </div>
        </div>

        <div className="rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
          <p className="text-sm font-medium text-foreground">設定新密碼</p>
          <div className="mt-3 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password" className="text-sm font-medium">
                新密碼 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={form.next}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, next: e.target.value }))
                }
                placeholder="至少 6 碼"
                required
                minLength={6}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">
                再次輸入新密碼 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, confirm: e.target.value }))
                }
                required
                minLength={6}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/15">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <DialogFooter className={cn("mt-6", lumaDialogFooter)}>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={submitting}
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={
            submitting ||
            !form.current ||
            !form.next ||
            !form.confirm
          }
        >
          {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {submitting ? "儲存中..." : "儲存新密碼"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <ChangePasswordContent onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

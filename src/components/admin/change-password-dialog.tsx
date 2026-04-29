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
      <DialogHeader>
        <DialogTitle>修改密碼</DialogTitle>
        <DialogDescription>
          需要先輸入目前密碼以驗證身份。
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="current-password">
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

        <div className="grid gap-2">
          <Label htmlFor="new-password">
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
          <Label htmlFor="confirm-password">
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

        {error && <p className="text-sm text-destructive">{error}</p>}
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

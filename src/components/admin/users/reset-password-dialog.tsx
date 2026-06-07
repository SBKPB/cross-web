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
import { adminUsersApi } from "@/lib/api/admin/users";
import { ApiError } from "@/lib/api/client";
import type { AdminUser } from "@/types/user";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 要重設密碼的對象 */
  user: AdminUser | null;
}

function ResetPasswordContent({
  user,
  onOpenChange,
}: {
  user: AdminUser;
  onOpenChange: (open: boolean) => void;
}) {
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (next.length < 6) {
      setError("新密碼至少需 6 碼");
      return;
    }
    if (next !== confirm) {
      setError("兩次新密碼不一致");
      return;
    }

    setSubmitting(true);
    try {
      await adminUsersApi.resetPassword(user.id, next);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as { detail?: string } | null;
        setError(data?.detail ?? "重設失敗，請稍後再試");
      } else {
        setError("重設失敗，請稍後再試");
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
          <DialogTitle>重設密碼</DialogTitle>
          <DialogDescription className="truncate">
            為「{user.email}」設定新密碼，不需對方目前密碼。
          </DialogDescription>
        </div>
      </DialogHeader>

      {done ? (
        <div className="mt-4 rounded-2xl bg-primary/5 p-4 text-sm text-foreground ring-1 ring-primary/15">
          已重設「{user.email}」的密碼，請將新密碼安全地交給該使用者。
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          <div className="rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/5">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="reset-new" className="text-sm font-medium">
                  新密碼 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reset-new"
                  type="password"
                  autoComplete="new-password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="至少 6 碼"
                  required
                  minLength={6}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reset-confirm" className="text-sm font-medium">
                  再次輸入新密碼 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reset-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
      )}

      <DialogFooter className={cn("mt-6", lumaDialogFooter)}>
        {done ? (
          <Button type="button" onClick={() => onOpenChange(false)}>
            完成
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={submitting || !next || !confirm}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {submitting ? "重設中..." : "重設密碼"}
            </Button>
          </>
        )}
      </DialogFooter>
    </form>
  );
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
}: ResetPasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && user && (
          <ResetPasswordContent
            key={user.id}
            user={user}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

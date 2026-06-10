"use client";

import { useEffect, useState } from "react";
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
import { ApiError } from "@/lib/api/client";
import { memberApi } from "@/lib/api/member";
import type { User } from "@/types/auth";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 目前登入會員（帶入既有顯示名稱 / 手機，email 唯讀顯示） */
  user: User | null;
  /** 儲存成功的回呼（父層用來刷新 auth user，避免畫面不同步） */
  onSaved: () => void | Promise<void>;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  user,
  onSaved,
}: EditProfileDialogProps) {
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 每次開啟時帶入目前資料
  useEffect(() => {
    if (!open) return;
    setDisplayName(user?.display_name ?? "");
    setPhone(user?.phone_number ?? "");
    setError(null);
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 與後端同寬鬆度：trim 後只驗長度，空字串＝清空；手機不強驗格式
    const trimmedName = displayName.trim();
    const trimmedPhone = phone.trim();
    if (trimmedName.length > 100) {
      setError("顯示名稱長度不可超過 100 字");
      return;
    }
    if (trimmedPhone.length > 20) {
      setError("手機號碼長度不可超過 20 字");
      return;
    }

    setIsSubmitting(true);
    try {
      // 兩欄位皆送出（部分更新語意：帶 null＝清空）
      await memberApi.updateProfile({
        display_name: trimmedName || null,
        phone: trimmedPhone || null,
      });
      await onSaved();
      onOpenChange(false);
    } catch (err) {
      // 優先讀後端回傳的繁中錯誤訊息（ApiError.data.detail）
      let msg = "儲存失敗，請稍後再試";
      if (err instanceof ApiError) {
        const data = err.data as { detail?: unknown; message?: unknown } | null;
        const detail = data?.detail ?? data?.message;
        if (typeof detail === "string") msg = detail;
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // 儲存中不允許關閉（Esc / 點遮罩），避免錯誤訊息無處顯示
        if (isSubmitting && !next) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>編輯個人資料</DialogTitle>
          <DialogDescription>
            更新顯示名稱與手機號碼，Email 為登入身分無法修改
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ep-email">Email</Label>
            <Input
              id="ep-email"
              value={user?.email ?? ""}
              disabled
              readOnly
              autoComplete="email"
            />
            <p className="text-xs text-muted-foreground">
              Email 為第三方登入身分識別，無法編輯
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-display-name">顯示名稱</Label>
            <Input
              id="ep-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例：王小明"
              maxLength={100}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-phone">手機號碼</Label>
            <Input
              id="ep-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="例：0912345678"
              maxLength={20}
              autoComplete="tel"
            />
            <p className="text-xs text-muted-foreground">留空即清除手機號碼</p>
          </div>

          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

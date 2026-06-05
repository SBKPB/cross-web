"use client";

import { Link2Off, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { lumaDialogFooter } from "@/lib/styles/luma";
import type { AdminUser } from "@/types/user";

interface UserLineUnbindDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function UserLineUnbindDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isLoading = false,
}: UserLineUnbindDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <Link2Off className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle>解除 LINE 綁定</DialogTitle>
              <DialogDescription>此操作無法復原</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive ring-1 ring-destructive/20">
          {user && (
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/15 text-sm font-semibold uppercase text-destructive">
                {user.email.charAt(0)}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {user.email}
              </span>
            </div>
          )}
          <p className="leading-relaxed">
            將清除此使用者的所有 LINE 綁定，包含舊的「靠手機匹配 patient」資料。執行後該使用者需到 LINE OA 重新「綁定」才能再收到通知。
          </p>
        </div>

        <DialogFooter className={lumaDialogFooter}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onConfirm()}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isLoading ? "解除中..." : "確認解除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

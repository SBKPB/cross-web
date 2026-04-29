"use client";

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
          <DialogTitle>解除 LINE 綁定</DialogTitle>
          <DialogDescription>
            將清除「{user?.email}」的所有 LINE 綁定，包含舊的「靠手機匹配
            patient」資料。執行後該使用者需到 LINE OA 重新「綁定」才能再收
            到通知。
          </DialogDescription>
        </DialogHeader>

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
            {isLoading ? "解除中..." : "確認解除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

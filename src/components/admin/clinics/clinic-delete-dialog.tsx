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
import { lumaDialogFooter } from "@/lib/admin/luma-styles";
import type { MedicalFacility } from "@/types/clinic";

interface ClinicDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinic: MedicalFacility | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function ClinicDeleteDialog({
  open,
  onOpenChange,
  clinic,
  onConfirm,
  isLoading = false,
}: ClinicDeleteDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>確認刪除</DialogTitle>
          <DialogDescription>
            確定要刪除「{clinic?.name}」嗎？此操作無法復原。
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
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "刪除中..." : "確認刪除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { AlertTriangleIcon, Building2Icon, Loader2 } from "lucide-react";
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
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader className="flex-row items-start gap-3 space-y-0">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangleIcon className="size-5" />
          </span>
          <div className="flex flex-col gap-1.5">
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>此操作無法復原，請謹慎確認。</DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-muted/30 p-3 ring-1 ring-foreground/5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Building2Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">
                {clinic?.name}
              </p>
              <p className="text-xs text-muted-foreground">即將被刪除的院所</p>
            </div>
          </div>

          <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/15">
            刪除後將一併移除此院所的相關資料，且無法復原。
          </div>
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
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isLoading ? "刪除中..." : "確認刪除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

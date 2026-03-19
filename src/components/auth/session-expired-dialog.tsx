"use client";

import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SessionExpiredDialogProps {
  open: boolean;
  onConfirm: () => void;
}

export function SessionExpiredDialog({ open, onConfirm }: SessionExpiredDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-center">登入已過期</DialogTitle>
          <DialogDescription className="text-center">
            您的登入憑證已過期，請重新登入以繼續使用系統。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onConfirm} className="w-full sm:w-auto">
            前往登入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

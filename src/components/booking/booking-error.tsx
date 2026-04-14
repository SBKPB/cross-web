"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BookingError() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-4xl bg-card p-10 text-center shadow-md ring-1 ring-foreground/5">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">
          伺服器異常
        </h1>
        <p className="mb-6 text-muted-foreground">
          無法載入預約資料，請稍後再試
        </p>
        <Button onClick={handleRetry} className="w-full" size="lg">
          重新整理
        </Button>
      </div>
    </div>
  );
}

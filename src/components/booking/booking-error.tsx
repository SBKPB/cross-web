"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BookingError() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-gray-900">
          伺服器異常
        </h1>
        <p className="mb-6 text-gray-600">
          無法載入預約資料，請稍後再試
        </p>
        <Button onClick={handleRetry} className="w-full">
          重新整理
        </Button>
      </div>
    </div>
  );
}

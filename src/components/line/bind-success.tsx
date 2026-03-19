"use client";

import { CheckCircle, Bell } from "lucide-react";

interface BindSuccessProps {
  patientName?: string;
}

export function BindSuccess({ patientName }: BindSuccessProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      {/* 成功圖示 */}
      <div className="flex size-16 items-center justify-center rounded-full bg-green-50">
        <CheckCircle className="size-8 text-green-600" />
      </div>

      {/* 歡迎訊息 */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-800">綁定成功</h2>
        {patientName && (
          <p className="text-base text-slate-600">
            {patientName}，您好！
          </p>
        )}
      </div>

      {/* 推播說明 */}
      <div className="w-full rounded-xl bg-green-50 px-5 py-4">
        <div className="flex items-start gap-3 text-left">
          <Bell className="mt-0.5 size-5 shrink-0 text-green-600" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-800">
              預約提醒已開啟
            </p>
            <p className="text-xs text-green-600">
              就診前一天將透過 LINE 自動傳送提醒通知，您也可以在聊天中輸入「查詢預約」查看預約資訊。
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-400">您可以關閉此頁面</p>
    </div>
  );
}

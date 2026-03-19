"use client";

import { Bell, Link2, UserPlus } from "lucide-react";
import { LineFriendButton } from "./line-friend-button";
import {
  BINDING_STEPS,
  LINE_FRIEND_URL,
  LINE_OA_ID,
} from "@/lib/constants/line-constants";

const STEP_ICONS = [UserPlus, Link2, Bell] as const;

export function LineGuideSection() {
  // 環境變數未設定時不渲染
  if (!LINE_FRIEND_URL && !LINE_OA_ID) return null;

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-center text-base font-semibold text-slate-800">
          接收預約提醒
        </h3>
        <p className="mt-1 text-center text-sm text-slate-500">
          加入 LINE 好友，就診前自動收到提醒通知
        </p>

        {/* 三步驟說明 */}
        <div className="mt-5 flex items-start justify-between gap-2">
          {BINDING_STEPS.map((step, index) => {
            const Icon = STEP_ICONS[index];
            return (
              <div key={step.step} className="flex flex-1 flex-col items-center text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <Icon className="size-5" />
                </div>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* 加好友按鈕 */}
        <div className="mt-5">
          <LineFriendButton />
        </div>
      </div>
    </div>
  );
}

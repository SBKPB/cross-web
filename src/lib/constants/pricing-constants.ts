import type { SubscriptionPlan } from "#lib/types/clinic.ts";

// 公開方案頁與 SEO 共用月費；功能說明須對齊現行方案權限。
export const PRICING_PLANS = [
  {
    id: "free",
    monthlyPrice: 0,
    description: "先建立院所資訊，整理日常管理。",
    features: ["院所基本資料與服務展示", "現場與電話代訂", "客戶與人員管理"],
  },
  {
    id: "standard",
    monthlyPrice: 3000,
    description: "開放線上預約，集中安排院所日常。",
    features: [
      "包含免費版功能",
      "線上預約與服務時長設定",
      "人員排班與預約狀態管理",
      "預約提醒",
      "叫號與報到管理",
    ],
  },
  {
    id: "pro",
    monthlyPrice: 8000,
    description: "掌握客戶與營運資訊，支援進階管理。",
    features: [
      "包含標準版功能",
      "客戶分析",
      "未到風險提示",
      "進階叫號與公開看板",
      "院所精選展示",
    ],
  },
] as const satisfies readonly {
  id: SubscriptionPlan;
  monthlyPrice: number;
  description: string;
  features: readonly string[];
}[];

// 試用天數（全站文案統一引用，避免散落各頁不一致；後台 subscription-banner 使用）
export const TRIAL_DAYS = 90;

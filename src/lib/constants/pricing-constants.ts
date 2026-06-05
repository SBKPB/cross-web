// 訂閱方案（公開定價頁用）— 三方案 free / standard / pro
//
// 價格（月費，使用者確認）：standard NT$3,000、pro NT$8,000。
// 試用期 90 天為商業承諾，後端「一鍵試用」會自動把到期日設為開通日 +90 天。
// 功能對照（featureIds）對齊後端 app/core/plan_features.py 與 src/lib/feature-access.ts，
// 改一處記得三處同步。

import type { Feature } from "@/lib/feature-access";
import type { SubscriptionPlan } from "@/types/clinic";

// 試用天數（全站文案統一引用，避免散落各頁不一致）
export const TRIAL_DAYS = 90;

export interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  /** 價格主數字，免費方案用「免費」 */
  priceLabel: string;
  /** 價格單位，如「/ 月」；免費方案可省略 */
  pricePeriod?: string;
  description: string;
  /** 功能條列；可用「包含『X』所有功能」表示繼承 */
  features: string[];
  /** 對應後端付費功能 ID（與 feature-access 一致），免費方案為空 */
  featureIds: Feature[];
  cta: { label: string; href: string };
  highlighted?: boolean;
  badge?: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "免費",
    priceLabel: "免費",
    description: "建立院所資訊頁，讓民眾找得到你。",
    features: [
      "診所資訊頁面",
      "團隊介紹",
      "顯示療程價格",
      "顯示位置與地圖",
      "顯示聯絡資訊",
    ],
    featureIds: [],
    cta: { label: "免費建立", href: "/join" },
  },
  {
    id: "standard",
    name: "標準",
    priceLabel: "NT$3,000",
    pricePeriod: "/ 月",
    description: "開通線上預約，讓顧客 24 小時自助預約。",
    features: [
      "包含「免費」所有功能",
      "24 小時線上預約",
      "LINE / App 預約提醒",
      "排程與班表管理",
    ],
    featureIds: ["online_booking", "reminders"],
    cta: { label: "申請加入", href: "/join" },
    highlighted: true,
    badge: "最受歡迎",
  },
  {
    id: "pro",
    name: "專業",
    priceLabel: "NT$8,000",
    pricePeriod: "/ 月",
    description: "進一步用數據優化營運、降低爽約。",
    features: [
      "包含「標準」所有功能",
      "客戶分析報表",
      "No-show 爽約風險評分",
      "優先客服支援",
    ],
    featureIds: ["online_booking", "reminders", "analytics", "no_show_risk"],
    cta: { label: "申請加入", href: "/join" },
  },
];

// 訂閱方案（公開定價頁用）
//
// ⚠️ 價格依使用者提供：basic 3000 / standard 5000 / premium 8000（月費 NT$）。
// ⚠️ 試用期 90 天為商業承諾：後端 subscription_expires_at 為手動欄位，上架時
//    營運須將到期日設為「開通日 +90 天」，到期提醒（7/3/1 天）才會正確。
// 各方案「功能差異」為依產品實際功能排的合理草案，請依真正的商業方案調整。
// 對齊後端 SubscriptionPlan = trial | basic | standard | premium。

// 試用天數（全站文案統一引用，避免散落各頁不一致）
export const TRIAL_DAYS = 90;

import type { SubscriptionPlan } from "@/types/clinic";

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
  cta: { label: string; href: string };
  highlighted?: boolean;
  badge?: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "trial",
    name: "試用",
    priceLabel: "免費",
    pricePeriod: "前 90 天",
    description: "先完整體驗 90 天，喜歡再續用。",
    features: [
      "90 天免費全功能試用",
      "核心預約功能全開放",
      "專人協助上架設定",
    ],
    cta: { label: "免費開始", href: "/join" },
    badge: "免費 90 天",
  },
  {
    id: "basic",
    name: "基本",
    priceLabel: "NT$3,000",
    pricePeriod: "/ 月",
    description: "適合單一據點的小型診所或工作室。",
    features: [
      "24 小時線上預約",
      "排程與班表管理",
      "人員與服務管理",
      "LINE 預約提醒",
      "民眾端曝光",
    ],
    cta: { label: "申請加入", href: "/join" },
  },
  {
    id: "standard",
    name: "標準",
    priceLabel: "NT$5,000",
    pricePeriod: "/ 月",
    description: "適合成長中、需要數據與優化的診所。",
    features: [
      "包含「基本」所有功能",
      "爽約風險分析",
      "營運數據報表",
      "進階排程設定",
    ],
    cta: { label: "申請加入", href: "/join" },
    highlighted: true,
    badge: "最受歡迎",
  },
  {
    id: "premium",
    name: "進階",
    priceLabel: "NT$8,000",
    pricePeriod: "/ 月",
    description: "適合多據點或高量體的院所。",
    features: [
      "包含「標準」所有功能",
      "多分店集中管理",
      "優先客服支援",
      "客製化需求協助",
    ],
    cta: { label: "申請加入", href: "/join" },
  },
];

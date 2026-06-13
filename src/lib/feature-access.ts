// 前端付費功能 gating（鏡像後端 app/core/plan_features.py 的 has_feature 邏輯）
//
// ⚠️ 此表必須與後端 app/core/plan_features.py 的 PLAN_FEATURES 保持一致，改一邊
//    記得改另一邊。後端是唯一安全邊界（所有付費端點各自 gating，繞過 UI 直打 API
//    仍會 403）；這裡僅為 UX——決定 UI 是否顯示鎖頭 / 升級提示。
// ⚠️ 只用於 gate「付費動作 / 後台功能」；公開的療程價格、院所資訊絕不可用此判斷隱藏。

import type { SubscriptionPlan, SubscriptionStatus } from "@/types/clinic";

export type Feature =
  | "online_booking"
  | "reminders"
  | "queue_management"
  | "analytics"
  | "no_show_risk";

// 須與 backend app/core/plan_features.py 一致
const PLAN_FEATURES: Record<SubscriptionPlan, Feature[]> = {
  free: [],
  standard: ["online_booking", "reminders", "queue_management"],
  pro: [
    "online_booking",
    "reminders",
    "queue_management",
    "analytics",
    "no_show_risk",
  ],
};

export const FEATURE_LABELS: Record<Feature, string> = {
  online_booking: "線上預約",
  reminders: "預約提醒",
  queue_management: "叫號/報到",
  analytics: "客戶分析",
  no_show_risk: "No-show 風險",
};

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: "免費",
  standard: "標準",
  pro: "專業",
};

// 每個付費功能解鎖所需的最低方案（升級提示用）
export const FEATURE_MIN_PLAN: Record<Feature, SubscriptionPlan> = {
  online_booking: "standard",
  reminders: "standard",
  queue_management: "standard",
  analytics: "pro",
  no_show_risk: "pro",
};

// 接受 MedicalFacility 與 FacilitySummary 的共同子集
export interface SubscriptionShape {
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
}

export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false; // 無到期日 = 不過期
  return new Date(expiresAt).getTime() < Date.now();
}

/** 是否正在有效試用期內（status=trial 且未過期） */
export function isTrialActive(sub: SubscriptionShape | null | undefined): boolean {
  if (!sub) return false;
  return sub.subscription_status === "trial" && !isExpired(sub.subscription_expires_at);
}

/** 鏡像後端 has_feature_for：試用未過期=全功能；active 依方案；其餘全鎖 */
export function canAccessFeature(
  sub: SubscriptionShape | null | undefined,
  feature: Feature,
): boolean {
  if (!sub) return false;
  if (isExpired(sub.subscription_expires_at)) return false;
  if (sub.subscription_status === "trial") return true;
  if (sub.subscription_status === "active") {
    return PLAN_FEATURES[sub.subscription_plan].includes(feature);
  }
  return false;
}

/** 當下實際可用的功能集合（trial 視為 pro 全功能） */
export function accessibleFeatures(
  sub: SubscriptionShape | null | undefined,
): Feature[] {
  if (!sub || isExpired(sub.subscription_expires_at)) return [];
  if (sub.subscription_status === "trial") return PLAN_FEATURES.pro;
  if (sub.subscription_status === "active") return PLAN_FEATURES[sub.subscription_plan];
  return [];
}

/** 到期剩餘天數（負數=已過期，null=無到期日） */
export function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
}

/** 是否為「可一鍵試用」的免費院所：plan=free 且未用過試用 */
export function canStartTrial(
  sub: { subscription_plan: SubscriptionPlan; trial_used_at: string | null } | null | undefined,
): boolean {
  if (!sub) return false;
  return sub.subscription_plan === "free" && sub.trial_used_at === null;
}

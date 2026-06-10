import type { PaymentType } from "@/types/clinic";

/**
 * 服務價格 badge 統一規則（web / Android / iOS 三端一致）：
 * - price > 0 → 顯示「NT$ {price}」
 * - price = 0 且院所收健保（payment_type 為 nhi 或 both；缺值視為 nhi，沿用既有慣例）→ 顯示「健保給付」
 * - price = 0 且院所純自費（payment_type = self_pay）→ 不顯示任何價格 badge
 */
export type ServicePriceBadge =
  | { kind: "price"; label: string }
  | { kind: "nhi"; label: string };

export function getServicePriceBadge(
  price: number,
  paymentType: PaymentType | undefined,
): ServicePriceBadge | null {
  if (price > 0) {
    return { kind: "price", label: `NT$ ${price.toLocaleString()}` };
  }
  // 純自費院所的 0 元服務不可標健保，也不顯示「免費」以免誤導
  if ((paymentType ?? "nhi") === "self_pay") {
    return null;
  }
  return { kind: "nhi", label: "健保給付" };
}

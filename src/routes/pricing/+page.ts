import { STATIC_PAGE_CACHE } from "#lib/cache-control.ts";
import type { SeoProps } from "#lib/components/Seo.svelte";
import type { PageLoad } from "./$types";
import { PRICING_PLANS } from "#lib/constants/pricing-constants.ts";
import { PLAN_LABELS } from "#lib/feature-access.ts";

// 舊版為 SSG：CDN 長期快取（setHeaders 只在 server 端生效，瀏覽器端換頁時是 no-op）
export const load: PageLoad = ({ setHeaders }) => {
  setHeaders({ "cache-control": STATIC_PAGE_CACHE });
  return {
    seo: {
      title: "院所預約方案與費用",
      description: `Cross 院所預約方案：${PRICING_PLANS.map((plan) => `${PLAN_LABELS[plan.id]}版${plan.monthlyPrice === 0 ? "" : ` NT$${plan.monthlyPrice.toLocaleString("zh-TW")}／月`}`).join("、")}。依院所需求選擇基本管理、線上預約或進階營運功能。`,
      canonical: "/pricing",
    } satisfies SeoProps,
  };
};

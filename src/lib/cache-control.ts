// 頁面回應的 Cache-Control（Vercel CDN 依 s-maxage 快取 function 回應，每次部署會清除）。

/** 舊版 SSG 靜態頁（/terms、/privacy、/refund、/pricing）：CDN 快取一年，與登入狀態無關 */
export const STATIC_PAGE_CACHE = "public, s-maxage=31536000, stale-while-revalidate";

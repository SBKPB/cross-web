// 頁面回應的 Cache-Control（Vercel CDN 依 s-maxage 快取 function 回應，每次部署會清除）。

/** 舊版 SSG 靜態頁（/terms、/privacy、/refund、/pricing）：CDN 快取一年，與登入狀態無關 */
export const STATIC_PAGE_CACHE = "public, s-maxage=31536000, stale-while-revalidate";

/** 診所詳情頁：CDN 快取 5 分鐘（後台改資料最慢 5 分鐘生效）；登入相關畫面都在瀏覽器端，回應與使用者無關 */
export const CLINIC_PAGE_CACHE = "public, s-maxage=300, stale-while-revalidate";

/** 診所專屬分享圖 og.png：CDN 快取一天 */
export const CLINIC_OG_CACHE = "public, s-maxage=86400, stale-while-revalidate";

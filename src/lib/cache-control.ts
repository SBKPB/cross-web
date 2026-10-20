// 頁面回應的 Cache-Control（Vercel CDN 依 s-maxage 快取 function 回應，每次部署會清除）。

/** 舊版 SSG 靜態頁（/terms、/privacy、/refund、/pricing）：CDN 快取一年，與登入狀態無關 */
export const STATIC_PAGE_CACHE = "public, s-maxage=31536000, stale-while-revalidate";

/** 診所詳情頁：CDN 快取 5 分鐘（後台改資料最慢 5 分鐘生效）；登入相關畫面都在瀏覽器端，回應與使用者無關 */
export const CLINIC_PAGE_CACHE = "public, s-maxage=300, stale-while-revalidate";

/** 診所專屬分享圖 og.png：完整的卡片 CDN 快取一天 */
export const CLINIC_OG_CACHE = "public, s-maxage=86400, stale-while-revalidate";

/**
 * 診所分享圖退化時（字型、後端、logo 暫時失敗，或退回品牌卡）：照舊版 opengraph-image 的標頭不進 CDN 快取，
 * 下一次請求重新產生，避免一次暫時失敗把錯的卡釘在 CDN 上一天、被 LINE / FB 爬蟲抓走
 */
export const CLINIC_OG_DEGRADED_CACHE = "public, max-age=0, must-revalidate";

/**
 * 在地落地頁（/area、/specialty 及其子頁）與 sitemap.xml：CDN 快取一小時（舊版 revalidate = 3600 的 ISR）。
 * 舊版 ISR 連 notFound() 的 404 也快取一小時（3100 基準與正式站皆是），所以 404 也帶這個標頭
 */
export const LANDING_PAGE_CACHE = "public, s-maxage=3600, stale-while-revalidate";

/**
 * 依網址參數渲染的動態頁（/search、預約流程 /booking/[id] 與其 success）：舊版讀 searchParams 或依路由參數抓資料而為動態渲染，
 * Next 一律回這個標頭（不進 CDN、瀏覽器不快取）
 */
export const DYNAMIC_PAGE_CACHE = "private, no-cache, no-store, max-age=0, must-revalidate";

// 頁面回應的 Cache-Control（Vercel CDN 依 s-maxage 快取 function 回應，每次部署會清除）。
//
// 進 CDN 快取的值一律以 `public, max-age=0, must-revalidate` 開頭：Vercel 送給瀏覽器前會剝掉 s-maxage 與
// stale-while-revalidate，瀏覽器收到的就是 `public, max-age=0, must-revalidate`，與舊版正式站（Next on Vercel）相同；
// 只寫 `public, s-maxage=…` 時瀏覽器只剩 `public`，會自行以啟發式快取。

/**
 * 舊版 SSG／預先渲染的頁面：CDN 快取一年（部署時清除），與登入狀態無關（登入相關畫面都在瀏覽器端）。
 * 使用：/、/terms、/privacy、/refund、/pricing、/auth、/auth/complete-profile、/member、/member/favorites、
 * /member/patients、/join、/join/apply、/join/verify
 */
export const STATIC_PAGE_CACHE = "public, max-age=0, must-revalidate, s-maxage=31536000, stale-while-revalidate";

/**
 * 診所詳情頁 /clinic/[id]：CDN 快取 5 分鐘（後台改資料最慢 5 分鐘生效）；登入相關畫面都在瀏覽器端，回應與使用者無關。
 * 只用在所有子請求都成功時；任一子請求失敗而降級渲染時改用 {@link CLINIC_PAGE_DEGRADED_CACHE}
 */
export const CLINIC_PAGE_CACHE = "public, max-age=0, must-revalidate, s-maxage=300, stale-while-revalidate";

/**
 * 診所詳情頁降級渲染（服務、排班、公告、醫師任一子請求失敗以空值顯示，或服務分類字彙退回內建 fallback）：
 * 不進 CDN 也不讓瀏覽器快取，避免一次暫時失敗把缺內容的頁面釘在 CDN 上 5 分鐘
 */
export const CLINIC_PAGE_DEGRADED_CACHE = "private, no-store";

/** 診所專屬分享圖 /clinic/[id]/og.png：完整的卡片 CDN 快取一天 */
export const CLINIC_OG_CACHE = "public, max-age=0, must-revalidate, s-maxage=86400, stale-while-revalidate";

/**
 * 診所分享圖退化時（字型、後端、logo 暫時失敗，或退回品牌卡）：照舊版 opengraph-image 的標頭不進 CDN 快取，
 * 下一次請求重新產生，避免一次暫時失敗把錯的卡釘在 CDN 上一天、被 LINE / FB 爬蟲抓走
 */
export const CLINIC_OG_DEGRADED_CACHE = "public, max-age=0, must-revalidate";

/**
 * 在地落地頁（/area、/area/[city]、/specialty、/specialty/[code]）與 /sitemap.xml：CDN 快取一小時（舊版 revalidate = 3600 的 ISR）。
 * 舊版 ISR 連 notFound() 的 404 也快取一小時（3100 基準與正式站皆是），所以 404 也帶這個標頭
 */
export const LANDING_PAGE_CACHE = "public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate";

/**
 * 依網址參數渲染的動態頁：舊版讀 searchParams 或依路由參數抓資料而為動態渲染，Next 一律回這個標頭（不進 CDN、瀏覽器不快取）。
 * 使用：/search、/booking/[id]、/booking/[id]/success、/c/[code]、/member/appointments/[id]
 */
export const DYNAMIC_PAGE_CACHE = "private, no-cache, no-store, max-age=0, must-revalidate";

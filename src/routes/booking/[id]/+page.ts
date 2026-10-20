import { DYNAMIC_PAGE_CACHE } from "../../../lib/cache-control.ts";
import type { PageLoad } from "./$types";

// 移植自舊版 app/booking/[clinic-id]/page.tsx（server component）+ loading.tsx。
// 伺服器端渲染外框與 loading.tsx 骨架、<head> 為 root layout 的全站預設（舊版沒有頁面專屬 metadata，分享卡片即全站卡片）；
// 院所設定、服務、人員在瀏覽器端抓（見 +page.svelte）：不在 load 等待後端，換頁時骨架立即出現（舊版 loading.tsx 的串流）。
// 未登入也能選服務與時段，送出時才導向登入（舊版行為，無頁面守衛）。
// HTTP 狀態一律 200：舊版 loading.tsx 先串流骨架，之後的 redirect()（未開通線上預約）與 notFound() 都已無法改狀態碼，
// 3100 基準與正式站對未開通院所皆回 200 + 串流的 NEXT_REDIRECT（瀏覽器端以 replace 導回院所頁），故這裡不在伺服器端回 307 / 404。
// 舊版依網址參數動態渲染：回應不進 CDN 快取（setHeaders 只在 server 端生效，瀏覽器端換頁時是 no-op）。
export const load: PageLoad = ({ params, setHeaders }) => {
	setHeaders({ "cache-control": DYNAMIC_PAGE_CACHE });
	return { clinicId: params.id };
};

import { DYNAMIC_PAGE_CACHE } from "../../../../lib/cache-control.ts";
import type { PageLoad } from "./$types";

// 預約成功頁（舊版為 client component，仍在伺服器端渲染）：伺服器 HTML 為全站預設 <head> + 外框，
// 依網址的 ?id= 先顯示轉圈或「無法載入預約資訊」；預約資料在瀏覽器端載入（見 +page.svelte）。
// 舊版讀 searchParams 而為動態渲染：回應不進 CDN 快取（setHeaders 只在 server 端生效）。
export const load: PageLoad = ({ params, setHeaders }) => {
	setHeaders({ "cache-control": DYNAMIC_PAGE_CACHE });
	return { clinicId: params.id };
};

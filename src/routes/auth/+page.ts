import { STATIC_PAGE_CACHE } from "../../lib/cache-control.ts";
import type { PageLoad } from "./$types";

// 移植自舊版 app/auth/page.tsx（client component，Next 預先渲染 Suspense 的轉圈、CDN 快取一年）。
// 伺服器端只輸出轉圈與全站預設 <head>（不讀 ?next=、不讀 localStorage）；登入狀態與 next 在瀏覽器端判斷。
export const load: PageLoad = ({ setHeaders }) => {
	setHeaders({ "cache-control": STATIC_PAGE_CACHE });
};

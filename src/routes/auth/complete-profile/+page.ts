import { STATIC_PAGE_CACHE } from "../../../lib/cache-control.ts";
import type { PageLoad } from "./$types";

// 移植自舊版 app/auth/complete-profile（client component，Next 預先渲染民眾端外框與 Suspense 轉圈、CDN 快取一年）。
// 伺服器端只輸出外框與轉圈；登入守門、查詢看診對象都在瀏覽器端。
export const load: PageLoad = ({ setHeaders }) => {
	setHeaders({ "cache-control": STATIC_PAGE_CACHE });
};

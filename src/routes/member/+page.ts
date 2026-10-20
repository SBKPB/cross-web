import { STATIC_PAGE_CACHE } from "../../lib/cache-control.ts";
import type { PageLoad } from "./$types";

// 舊版為 client component，Next 預先渲染「載入中」外框（CDN 快取一年）；守門與資料都在瀏覽器端
export const load: PageLoad = ({ setHeaders }) => {
	setHeaders({ "cache-control": STATIC_PAGE_CACHE });
};

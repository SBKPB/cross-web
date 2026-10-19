import { STATIC_PAGE_CACHE } from "$lib/cache-control";
import type { PageLoad } from "./$types";

// 舊版為 SSG：CDN 長期快取（setHeaders 只在 server 端生效，瀏覽器端換頁時是 no-op）。
// 這頁沒有自己的 metadata，沿用 root layout 的全站預設 Seo。
export const load: PageLoad = ({ setHeaders }) => {
	setHeaders({ "cache-control": STATIC_PAGE_CACHE });
};

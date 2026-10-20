import { STATIC_PAGE_CACHE } from "$lib/cache-control";
import type { SeoProps } from "$lib/components/Seo.svelte";
import type { PageLoad } from "./$types";

// 舊版首頁沒有自己的 metadata（沿用 root layout 預設，canonical "/"），也不抓資料：
// 整頁是 SSG，CDN 長期快取（setHeaders 只在 server 端生效，瀏覽器端換頁時是 no-op）
export const load: PageLoad = ({ setHeaders }) => {
	setHeaders({ "cache-control": STATIC_PAGE_CACHE });
	return { seo: { canonical: "/" } satisfies SeoProps };
};

import { DYNAMIC_PAGE_CACHE } from "../../lib/cache-control.ts";
import { parseSearchFilters } from "../../lib/clinic-search.ts";
import type { SeoProps } from "$lib/components/Seo.svelte";
import type { PageLoad } from "./$types";

// 移植自舊 Next 的 app/search/page.tsx。店家清單在瀏覽器端抓（同舊版 ClinicSearchView），這裡只解析網址參數。
// 舊版讀 searchParams 而為動態渲染：回應不進 CDN 快取（setHeaders 只在 server 端生效，瀏覽器端換頁時是 no-op）。
// 相對路徑 import：node --test 可直接載入本檔。
export const load: PageLoad = ({ url, setHeaders }) => {
	setHeaders({ "cache-control": DYNAMIC_PAGE_CACHE });
	return {
		initialFilters: parseSearchFilters(url.searchParams),
		// 舊版 metadata 只有 title、description；canonical 沿用 root layout 的首頁網址
		seo: {
			title: "搜尋店家",
			description: "搜尋全台看診、醫美、美容與其他合作店家，線上預約",
			canonical: "/",
		} satisfies SeoProps,
	};
};

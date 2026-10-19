import { STATIC_PAGE_CACHE } from "$lib/cache-control";
import type { SeoProps } from "$lib/components/Seo.svelte";
import type { PageLoad } from "./$types";

// 舊版為 SSG：CDN 長期快取（setHeaders 只在 server 端生效，瀏覽器端換頁時是 no-op）
export const load: PageLoad = ({ setHeaders }) => {
	setHeaders({ "cache-control": STATIC_PAGE_CACHE });
	return {
		seo: {
			title: "Cross 方案與合作",
			description:
				"Cross 預約工作流程單一方案 NT$3,000／月，設備、HIS 與客製整合依範圍報價。Design Partner 共同驗證實際流程。",
			canonical: "/pricing",
		} satisfies SeoProps,
	};
};

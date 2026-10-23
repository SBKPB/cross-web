import { STATIC_PAGE_CACHE } from "#lib/cache-control.ts";
import type { SeoProps } from "#lib/components/Seo.svelte";
import type { PageLoad } from "./$types";

// 舊版為 SSG：CDN 長期快取（setHeaders 只在 server 端生效，瀏覽器端換頁時是 no-op）
export const load: PageLoad = ({ setHeaders }) => {
	setHeaders({ "cache-control": STATIC_PAGE_CACHE });
	return {
		seo: {
			title: "院所預約方案與費用",
			description:
				"Cross 院所預約方案 NT$3,000／月，提供線上預約、服務與人員排班管理。導入前確認開通功能、費用與上線安排。",
			canonical: "/pricing",
		} satisfies SeoProps,
	};
};

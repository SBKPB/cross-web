import { STATIC_PAGE_CACHE } from "../../lib/cache-control.ts";
import type { SeoProps } from "../../lib/components/Seo.svelte";
import type { PageLoad } from "./$types";

// 院所導入頁保留靜態頁快取。
export const load: PageLoad = ({ setHeaders }) => {
	setHeaders({ "cache-control": STATIC_PAGE_CACHE });
	return {
		seo: {
			title: "院所導入",
			description:
				"Cross 協助診所與醫美院所建立線上預約入口，管理諮詢、療程、人員排班與候診流程。了解方案並申請院所導入。",
			canonical: "/join",
		} satisfies SeoProps,
	};
};

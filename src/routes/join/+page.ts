import { STATIC_PAGE_CACHE } from "../../lib/cache-control.ts";
import type { SeoProps } from "../../lib/components/Seo.svelte";
import type { PageLoad } from "./$types";

// 移植自舊版 app/join/page.tsx（SSG，CDN 快取一年）的 metadata
export const load: PageLoad = ({ setHeaders }) => {
	setHeaders({ "cache-control": STATIC_PAGE_CACHE });
	return {
		seo: {
			title: "Design Partner 共同合作",
			description:
				"Cross 募集 3–5 家醫療院所、健康服務機構與設備夥伴，共同設計並量化驗證資料與預約工作流程。",
			canonical: "/join",
		} satisfies SeoProps,
	};
};

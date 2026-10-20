import { STATIC_PAGE_CACHE } from "../../../lib/cache-control.ts";
import type { SeoProps } from "../../../lib/components/Seo.svelte";
import type { PageLoad } from "./$types";

// 移植自舊版 app/join/apply/page.tsx（SSG，CDN 快取一年）的 metadata：
// 沒有 alternates → canonical 沿用 root layout 的 "/"（3100 基準實測）
export const load: PageLoad = ({ setHeaders }) => {
	setHeaders({ "cache-control": STATIC_PAGE_CACHE });
	return {
		seo: {
			title: "申請加入 Cross",
			description:
				"填寫商家資料申請加入 Cross 預約平台。送出後我們會寄驗證信，設定密碼並通過審核即可開通院所後台。",
			canonical: "/",
		} satisfies SeoProps,
	};
};

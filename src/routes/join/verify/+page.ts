import { STATIC_PAGE_CACHE } from "../../../lib/cache-control.ts";
import type { SeoProps } from "../../../lib/components/Seo.svelte";
import type { PageLoad } from "./$types";

// 移植自舊版 app/join/verify/page.tsx（SSG，CDN 快取一年）的 metadata：這頁帶著一次性 token，
// 不該被索引（robots: noindex, nofollow；沒有 googlebot）；描述與 canonical 沿用全站。
// 伺服器端不讀 ?token=（舊版 Suspense 只輸出「載入中…」），回應才能安全地進 CDN 快取。
export const load: PageLoad = ({ setHeaders }) => {
	setHeaders({ "cache-control": STATIC_PAGE_CACHE });
	return {
		seo: { title: "驗證信箱並設定密碼", canonical: "/", noindex: true } satisfies SeoProps,
	};
};

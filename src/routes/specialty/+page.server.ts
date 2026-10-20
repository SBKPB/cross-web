import { LANDING_PAGE_CACHE } from "../../lib/cache-control.ts";
import { categoriesWithCounts } from "../../lib/seo/landing-data.ts";
import { loadLandingData, SPECIALTY_INDEX_SEO, withLabels } from "../../lib/seo/landing-pages.ts";
import type { PageServerLoad } from "./$types";

// 移植自舊 Next 的 app/specialty/page.tsx（revalidate = 3600 → CDN 快取一小時）。
// 相對路徑 import：node --test 可直接載入本檔。
export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const { clinics, taxonomy } = await loadLandingData(fetch);
	setHeaders({ "cache-control": LANDING_PAGE_CACHE });
	return { categories: withLabels(categoriesWithCounts(clinics), taxonomy), seo: SPECIALTY_INDEX_SEO };
};

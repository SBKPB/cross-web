import { LANDING_PAGE_CACHE } from "../../lib/cache-control.ts";
import { citiesWithCounts, getAllClinics } from "../../lib/seo/landing-data.ts";
import { AREA_INDEX_SEO } from "../../lib/seo/landing-pages.ts";
import type { PageServerLoad } from "./$types";

// 移植自舊 Next 的 app/area/page.tsx（revalidate = 3600 → CDN 快取一小時）。
// 相對路徑 import：node --test 可直接載入本檔。
export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const clinics = await getAllClinics({ fetch });
	setHeaders({ "cache-control": LANDING_PAGE_CACHE });
	return { cities: citiesWithCounts(clinics), seo: AREA_INDEX_SEO };
};

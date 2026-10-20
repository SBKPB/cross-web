import { error } from "@sveltejs/kit";
import { categoryLabel } from "../../../lib/api/service-categories.ts";
import { LANDING_PAGE_CACHE } from "../../../lib/cache-control.ts";
import { citiesWithCounts } from "../../../lib/seo/landing-data.ts";
import { buildSpecialtySeo, loadLandingData, specialtyClinics } from "../../../lib/seo/landing-pages.ts";
import type { PageServerLoad } from "./$types";

// 移植自舊 Next 的 app/specialty/[code]/page.tsx（generateMetadata + 頁面資料，revalidate = 3600）。
// 舊版 params 未解碼故自行 decodeURIComponent；SvelteKit 的 params 已解碼，直接比對。
// 相對路徑 import：node --test 可直接載入本檔。
export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const code = params.code;
	const { clinics: all, taxonomy } = await loadLandingData(fetch);
	const clinics = specialtyClinics(all, code);

	// 舊版 ISR 連 notFound() 的 404 也快取一小時（3100 基準與正式站實測），故先設標頭再丟 404
	setHeaders({ "cache-control": LANDING_PAGE_CACHE });
	// 只為「真的有診所」的服務子類別出頁
	if (clinics.length === 0) error(404, "Not Found");

	const label = categoryLabel(taxonomy, code);
	return {
		label,
		clinics,
		taxonomy,
		// 依縣市快捷（內部連結到地區落地頁）
		cities: citiesWithCounts(clinics).slice(0, 12),
		seo: buildSpecialtySeo(code, label, clinics),
	};
};

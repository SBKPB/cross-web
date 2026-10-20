import { error } from "@sveltejs/kit";
import { LANDING_PAGE_CACHE } from "../../../lib/cache-control.ts";
import { categoriesWithCounts } from "../../../lib/seo/landing-data.ts";
import { buildAreaSeo, cityClinics, loadLandingData, withLabels } from "../../../lib/seo/landing-pages.ts";
import type { PageServerLoad } from "./$types";

// 移植自舊 Next 的 app/area/[city]/page.tsx（generateMetadata + 頁面資料，revalidate = 3600）。
// 舊版 params 未解碼故自行 decodeURIComponent；SvelteKit 的 params 已解碼，直接比對。
// 相對路徑 import：node --test 可直接載入本檔。
export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const city = params.city;
	const { clinics: all, taxonomy } = await loadLandingData(fetch);
	const clinics = cityClinics(all, city);

	// 舊版 ISR 連 notFound() 的 404 也快取一小時（3100 基準與正式站實測），故先設標頭再丟 404
	setHeaders({ "cache-control": LANDING_PAGE_CACHE });
	// 只為「真的有診所」的縣市出頁（避免空頁被當薄內容 / doorway）
	if (clinics.length === 0) error(404, "Not Found");

	// 此縣市實際有哪些科別（給內部連結 + 在地關鍵字脈絡）
	const cityCategories = withLabels(categoriesWithCounts(clinics).slice(0, 12), taxonomy);
	return {
		city,
		clinics,
		taxonomy,
		cityCategories,
		/** 介紹文的「…等」科別：前 5 個以「、」連接（沒有科別時為空字串，不顯示） */
		intro: cityCategories
			.slice(0, 5)
			.map((c) => c.label)
			.join("、"),
		seo: buildAreaSeo(city, clinics),
	};
};

import { LANDING_PAGE_CACHE } from "../../lib/cache-control.ts";
import { getAllClinics } from "../../lib/seo/landing-data.ts";
import { dynamicSitemapEntries, renderSitemap, staticSitemapEntries } from "../../lib/seo/sitemap.ts";
import type { RequestHandler } from "./$types";

// 移植自舊 Next 的 app/sitemap.ts：每小時重建一次（revalidate = 3600 → CDN 快取一小時），避免每個請求都打後端。
// 相對路徑 import：node --test 可直接載入本檔。
export const GET: RequestHandler = async ({ fetch }) => {
	const now = new Date();
	const entries = staticSitemapEntries(now);

	const clinics = await getAllClinics({ fetch });
	if (clinics.length === 0) {
		// getAllClinics 失敗或無資料時降級：至少輸出靜態頁，並留下訊號便於排查
		console.warn("[sitemap] 無診所資料，僅輸出靜態頁（檢查 BACKEND_URL 與後端）");
	} else {
		entries.push(...dynamicSitemapEntries(clinics, now));
	}

	return new Response(renderSitemap(entries), {
		headers: { "content-type": "application/xml", "cache-control": LANDING_PAGE_CACHE },
	});
};

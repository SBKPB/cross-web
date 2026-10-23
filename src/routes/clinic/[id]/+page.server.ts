import { error } from "@sveltejs/kit";
import { CLINIC_PAGE_CACHE, CLINIC_PAGE_DEGRADED_CACHE } from "../../../lib/cache-control.ts";
import { buildClinicSeo, loadClinicDetail } from "../../../lib/clinic-detail.ts";
import { isDemoClinic } from "../../../lib/clinic-discovery.ts";
import type { PageServerLoad } from "./$types";

// 移植自舊 Next 的 app/clinic/[clinic-id]/page.tsx（server 端抓資料 + generateMetadata）。
// 相對路徑 import：node --test 可直接載入本檔。
export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const clinicId = params.id;
	const { clinic, schedule, showSchedule, announcements, doctorDetails, taxonomy, degraded } =
		await loadClinicDetail(fetch, clinicId);

	// 同舊版 notFound()：404 不進 CDN 快取
	if (!clinic) error(404, "Not Found");

	// 子請求全部成功才進 CDN 快取；降級渲染（以空值顯示）只給這一次請求，下一次重新抓
	setHeaders({ "cache-control": degraded ? CLINIC_PAGE_DEGRADED_CACHE : CLINIC_PAGE_CACHE });
	return {
		clinicId,
		clinic,
		schedule,
		showSchedule,
		announcements,
		doctorDetails,
		isDemo: isDemoClinic(clinicId),
		seo: buildClinicSeo(clinic, clinicId, taxonomy),
	};
};

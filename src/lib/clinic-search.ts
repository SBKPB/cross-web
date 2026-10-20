import { matchesClinicSearch } from "./clinic-discovery.ts";
import type { Clinic, ClinicFilters } from "./types/clinic.ts";

// 搜尋頁的篩選與排序（移植自舊版 clinic-search-view.tsx 的 filteredClinics useMemo，邏輯相同）。

export type SortKey = "default" | "rating" | "name";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
	{ value: "default", label: "預設排序" },
	{ value: "rating", label: "評分最高" },
	{ value: "name", label: "名稱排序" },
];

export const EMPTY_FILTERS: ClinicFilters = {
	search: "",
	hospitalLevel: "all",
	serviceCategories: [],
	city: "all",
	facilityType: "all",
	paymentType: "all",
};

/** 依篩選條件過濾並排序（回傳新陣列，不改動輸入） */
export function filterAndSortClinics(
	clinics: Clinic[],
	filters: ClinicFilters,
	sort: SortKey,
	categoryLabels: Record<string, string>,
): Clinic[] {
	const result = clinics.filter((clinic) => {
		if (!matchesClinicSearch(clinic, filters.search, categoryLabels)) return false;
		// 醫療分級僅在「看診/全部」大類適用（與 toolbar 的 showLevelFilter 一致，
		// 避免非看診大類帶 level 參數時產生看不見、移不掉的隱形篩選）
		const levelScope = filters.facilityType === "all" || filters.facilityType === "healthcare";
		if (levelScope && filters.hospitalLevel !== "all" && clinic.hospital_level !== filters.hospitalLevel) {
			return false;
		}
		// 第二層子類別（多選，OR 命中）：空陣列=不限
		if (
			filters.serviceCategories.length > 0 &&
			!filters.serviceCategories.some((c) => clinic.departments.includes(c))
		) {
			return false;
		}
		if (filters.city !== "all" && clinic.city !== filters.city) {
			return false;
		}
		if (filters.facilityType !== "all" && clinic.facility_type !== filters.facilityType) {
			return false;
		}
		// 付款方式僅在「看診」大類適用（與 toolbar 的 showPaymentFilter 一致，
		// 避免非看診大類帶 payment 參數時產生隱形篩選）。
		// 健保命中 nhi+both、自費命中 self_pay+both（缺值視為 nhi）
		if (filters.facilityType === "healthcare" && filters.paymentType !== "all") {
			const pt = clinic.payment_type ?? "nhi";
			const hit =
				filters.paymentType === "nhi"
					? pt === "nhi" || pt === "both"
					: pt === "self_pay" || pt === "both";
			if (!hit) return false;
		}
		return true;
	});

	// 精選置頂（付費曝光）一律排最前，再套用使用者選的排序作為次要鍵。
	// default 模式下次要鍵維持後端順序（後端已依 featured → created_at desc）。
	const featuredRank = (c: Clinic) => (c.is_featured ? 0 : 1);
	if (sort === "rating") {
		result.sort((a, b) => featuredRank(a) - featuredRank(b) || (b.rating ?? -1) - (a.rating ?? -1));
	} else if (sort === "name") {
		result.sort(
			(a, b) => featuredRank(a) - featuredRank(b) || a.clinic_name.localeCompare(b.clinic_name, "zh-Hant"),
		);
	} else {
		result.sort((a, b) => featuredRank(a) - featuredRank(b));
	}

	return result;
}

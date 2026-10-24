import { matchesClinicSearch } from "./clinic-discovery.ts";
import type { Clinic, ClinicFilters, FacilityType, HospitalLevel, PaymentType } from "./types/clinic.ts";

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
		if (filters.onlineOnly && clinic.online_booking_enabled !== true) return false;
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

/**
 * /search 網址參數 → 初始篩選（移植自舊版 app/search/page.tsx，邏輯逐行相同）。
 * 參數：q、city、dept（舊版單一子類別 code，向後相容）、cat（多個子類別 code，逗號分隔）、level、type、payment（'nhi' | 'self_pay'）。
 * 值不驗證、原樣帶入（無效值的結果與舊版相同：篩不到店家）。
 * 唯一差異：重複的參數取第一個值；舊版 Next 會把它變成陣列，讓頁面在伺服器端（cat）或載入店家後（q）出錯。
 */
export function parseSearchFilters(searchParams: Pick<URLSearchParams, "get">): ClinicFilters {
	const get = (key: string) => searchParams.get(key) ?? undefined;
	const sp = {
		q: get("q"),
		city: get("city"),
		dept: get("dept"),
		cat: get("cat"),
		level: get("level"),
		type: get("type"),
		payment: get("payment"),
	};

	// 服務大類與付款方式：向後相容舊連結帶進的 type=self_pay
	// FacilityType 已無 self_pay，舊值映射為「看診 + 自費付款」
	const rawType = sp.type;
	let facilityType: FacilityType | "all";
	let paymentTypeFromType: PaymentType | "all" = "all";
	if (rawType === "self_pay") {
		facilityType = "healthcare";
		paymentTypeFromType = "self_pay";
	} else {
		facilityType = rawType ? (rawType as FacilityType) : "all";
	}

	// 子類別：cat（多值，逗號分隔）優先，否則 fallback 舊 dept（單值）
	const serviceCategories = sp.cat
		? sp.cat
				.split(",")
				.map((c) => c.trim())
				.filter(Boolean)
		: sp.dept
			? [sp.dept]
			: [];

	// 付款方式：明確的 payment 參數優先，其次才是 type=self_pay 的映射
	const rawPayment: PaymentType | "all" = (sp.payment as PaymentType | undefined) ?? paymentTypeFromType;

	// 依 facilityType 正規化不適用的篩選軸，避免一進頁就帶入「看不見也移不掉」的隱形篩選：
	// - 付款方式只在「看診」大類有效
	// - 醫療分級只在「看診/全部」大類有效
	const levelScope = facilityType === "all" || facilityType === "healthcare";
	return {
		search: sp.q ?? "",
		city: sp.city ?? "all",
		serviceCategories,
		hospitalLevel: levelScope ? ((sp.level as HospitalLevel) ?? "all") : "all",
		facilityType,
		paymentType: facilityType === "healthcare" ? rawPayment : "all",
		...(searchParams.get("online") === "1" ? { onlineOnly: true } : {}),
	};
}

/** 僅序列化公開的院所搜尋條件，不處理後台客戶搜尋。 */
export function searchFiltersQuery(filters: ClinicFilters, sort: SortKey): string {
	const sp = new URLSearchParams();
	if (filters.search) sp.set("q", filters.search);
	if (filters.city !== "all") sp.set("city", filters.city);
	if (filters.facilityType !== "all") sp.set("type", filters.facilityType);
	if (filters.hospitalLevel !== "all") sp.set("level", filters.hospitalLevel);
	if (filters.paymentType !== "all") sp.set("payment", filters.paymentType);
	if (filters.serviceCategories.length) sp.set("cat", filters.serviceCategories.join(","));
	if (filters.onlineOnly) sp.set("online", "1");
	if (sort !== "default") sp.set("sort", sort);
	return sp.toString();
}

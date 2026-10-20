import { error, redirect } from "@sveltejs/kit";
import { clinicsApi } from "../../../lib/api/clinics.ts";
import { DYNAMIC_PAGE_CACHE } from "../../../lib/cache-control.ts";
import type { PageServerLoad } from "./$types";

// 移植自舊版 app/c/[code]/page.tsx：診所頁短網址 /c/{UUID 前 8 碼} → 轉到完整 /clinic/{id}。
// 短碼以 clinic id 前綴比對（不分大小寫，8 hex 碰撞機率極低）；找不到或後端失敗則 404。
// 舊版為動態渲染：308 與 404 都回 Next 動態頁標頭（setHeaders 對 redirect / error 回應同樣生效）。
// 相對路徑 import：node --test 可直接載入本檔。
export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	setHeaders({ "cache-control": DYNAMIC_PAGE_CACHE });
	const normalized = params.code.toLowerCase();

	let targetId: string | null;
	try {
		const clinics = await clinicsApi.getClinics({ fetch });
		targetId = clinics.find((c) => c.id.toLowerCase().startsWith(normalized))?.id ?? null;
	} catch {
		targetId = null;
	}

	// 短網址為長期結構 → 308 永久轉址，讓搜尋引擎完整傳遞權重給診所頁
	if (targetId) redirect(308, `/clinic/${targetId}`);
	error(404, "Not Found");
};

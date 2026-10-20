import { DYNAMIC_PAGE_CACHE } from "../../../../lib/cache-control.ts";
import type { PageLoad } from "./$types";

// 移植自舊版 app/member/appointments/[id]/page.tsx（client component）：讀動態路由參數而為動態渲染，
// Next 回動態頁標頭（不進 CDN）。伺服器端輸出「載入中」外框，守門與資料在瀏覽器端。
export const load: PageLoad = ({ params, setHeaders }) => {
	setHeaders({ "cache-control": DYNAMIC_PAGE_CACHE });
	return { id: params.id };
};

import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// 舊版 Next 的診所分享圖網址 /clinic/<id>/opengraph-image?<hash> 已被社群平台快取；
// 新版改為 /clinic/<id>/og.png，舊網址（含任意 query）308 永久轉址，舊分享卡不會破圖。
export const GET: RequestHandler = ({ params }) => {
	redirect(308, `/clinic/${encodeURIComponent(params.id)}/og.png`);
};

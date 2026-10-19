import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// 舊版 Next 的 app/opengraph-image.tsx 產生的分享圖網址（/opengraph-image?<hash>）已被社群平台快取，
// 新版改用靜態 /og.png；舊網址（含任意 query）308 永久轉址，舊分享卡不會破圖。
export const GET: RequestHandler = () => {
	redirect(308, "/og.png");
};

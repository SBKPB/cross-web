import { ROBOTS_TXT } from "../../lib/seo/sitemap.ts";

// 移植自舊 Next 的 app/robots.ts。內容固定，建置時預先產生為靜態檔（同舊版：build 時靜態化，部署才更新）。
// 相對路徑 import：node --test 可直接載入本檔。
export const prerender = true;

export function GET(): Response {
	return new Response(ROBOTS_TXT, { headers: { "content-type": "text/plain" } });
}

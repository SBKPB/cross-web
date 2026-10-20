import { CLINIC_OG_CACHE, CLINIC_OG_DEGRADED_CACHE } from "../../../../lib/cache-control.ts";
import { renderClinicOg } from "../../../../lib/og/clinic-og.ts";
import type { RequestHandler } from "./$types";

// 診所專屬分享圖（舊版為同目錄的 opengraph-image.tsx）。頁面 og:image / twitter:image 指向這裡。
// 後端經 event.fetch 走代理；Google Fonts 與 logo 為外部網址，用全域 fetch。
// 完整的卡 CDN 快取一天；退化卡（暫時失敗）照舊版不快取，下一次請求重新產生。
// 相對路徑 import：node --test 可直接載入本檔。
export const GET: RequestHandler = async ({ params, fetch }) => {
	const { png, degraded } = await renderClinicOg(params.id, {
		backendFetch: fetch,
		externalFetch: globalThis.fetch,
	});
	return new Response(png, {
		headers: {
			"content-type": "image/png",
			"cache-control": degraded ? CLINIC_OG_DEGRADED_CACHE : CLINIC_OG_CACHE,
		},
	});
};

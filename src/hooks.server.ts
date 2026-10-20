import type { Handle } from "@sveltejs/kit";
import { CSR_ONLY_ROUTE_CACHE } from "$lib/cache-control";

// ssr = false 的頁面沒有 server load 可呼叫 setHeaders：依路由補上與舊版相同的 Cache-Control（見 CSR_ONLY_ROUTE_CACHE）。
// 已設定標頭的回應（例如頁面 load 的 setHeaders）不覆寫。
export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	const cache = event.route.id ? CSR_ONLY_ROUTE_CACHE[event.route.id] : undefined;
	if (cache && !response.headers.has("cache-control")) response.headers.set("cache-control", cache);
	return response;
};

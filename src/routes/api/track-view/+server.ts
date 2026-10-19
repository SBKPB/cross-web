import { createHash } from "node:crypto";
import type { RequestHandler } from "./$types";

// 移植自舊 Next 的 api/track-view/route.ts。
// 後端一律經 event.fetch 打 /api/v1（內部解析到代理路由），後端網址只在代理那一處；
// 環境變數讀 process.env（node --test 可直接 import 本檔）。

/** 取真實訪客 IP：Vercel / Cloud Run 都會塞 x-forwarded-for，第一段才是原始來源 */
function clientIp(request: Request): string | null {
	const xff = request.headers.get("x-forwarded-for");
	if (xff) {
		const first = xff.split(",")[0]?.trim();
		if (first) return first;
	}
	return request.headers.get("x-real-ip");
}

export const POST: RequestHandler = async ({ request, fetch }) => {
	let clinicId: string | undefined;
	try {
		({ clinicId } = await request.json());
	} catch {
		return new Response(null, { status: 400 });
	}
	if (!clinicId) return new Response(null, { status: 400 });

	/**
	 * 雜湊 salt。原始 IP 只在這支 route handler 裡出現，雜湊後才送後端。
	 *
	 * **沒設就不記錄**，不退回硬編碼常數：salt 一旦是原始碼裡的公開字串，
	 * sha256(常數 + IP) 就是人人都能離線算的函數，IPv4 只有 43 億種可能，
	 * 拿到 DB 的人可以直接反查回 IP，等於明文存 IP 卻自稱雜湊。
	 * 靜默退回比功能壞掉更危險，因為沒人會發現。
	 */
	const salt = process.env.VISITOR_HASH_SALT;
	if (!salt) return new Response(null, { status: 204 });

	const ip = clientIp(request);
	// 拿不到 IP 也不記，寧可少算也不要把所有無 IP 訪客併成同一個人
	if (!ip) return new Response(null, { status: 204 });

	// salt 混入當日日期 → 每日輪替。同一個人跨日就是不同雜湊，無法用單一
	// 雜湊拼出跨院所的長期瀏覽軌跡（醫療科別的瀏覽推論尤其敏感）。
	// 代價：指標語意是「各日不重複人數的加總」，與後台文案「同一 IP 同一天
	// 只算一次」一致，不是「N 天內不重複的人」。
	const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
	const visitor_hash = createHash("sha256").update(`${salt}:${day}:${ip}`).digest("hex");

	try {
		// encodeURIComponent：clinicId 來自請求內容，不讓 ../ 改寫內部代理的路徑
		await fetch(`/api/v1/booking/clinics/${encodeURIComponent(clinicId)}/view`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ visitor_hash }),
		});
	} catch {
		// 記錄造訪失敗不該影響任何人，靜默吞掉
	}
	return new Response(null, { status: 204 });
};

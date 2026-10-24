import { json } from "@sveltejs/kit";
import { canAccessAdmin } from "../../../../lib/auth/roles.ts";
import type { User } from "../../../../lib/types/auth.ts";
import { resolveGoogleMapsLink } from "../../../../lib/server/google-maps.ts";
import { googleMapsUrl } from "../../../../lib/maps/google-maps.ts";
import type { RequestHandler } from "./$types";

const buckets = new Map<string, { count: number; until: number }>();
const reply = (body: object, status = 200) =>
  json(body, { status, headers: { "cache-control": "private, no-store" } });

async function limitedBody(request: Request): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let size = 0,
    text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return text + decoder.decode();
      size += value.byteLength;
      if (size > 12000) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

export const POST: RequestHandler = async ({ request, url, fetch }) => {
  if (request.headers.get("origin") !== url.origin)
    return reply({ detail: "請從院所後台使用位置解析。" }, 403);
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer \S{1,4096}$/.test(authorization))
    return reply({ detail: "請先登入院所後台。" }, 401);
  try {
    const me = await fetch("/api/v1/auth/me", {
      headers: { authorization },
      signal: AbortSignal.timeout(5000),
    });
    if (!me.ok)
      return reply(
        {
          detail:
            me.status === 401
              ? "登入已過期，請重新登入。"
              : "無法確認操作權限，請稍後重試。",
        },
        me.status === 401 ? 401 : 503,
      );
    const user = (await me.json()) as User;
    if (
      !user ||
      typeof user.id !== "string" ||
      !Array.isArray(user.roles) ||
      !canAccessAdmin(user)
    )
      return reply({ detail: "僅院所後台帳號可使用位置解析。" }, 403);
    const now = Date.now();
    for (const [key, bucket] of buckets)
      if (bucket.until <= now) buckets.delete(key);
    const bucket = buckets.get(user.id) ?? { count: 0, until: now + 60_000 };
    if (bucket.count >= 12 || (!buckets.has(user.id) && buckets.size >= 2000))
      return reply({ detail: "解析次數較多，請稍候一分鐘再試。" }, 429);
    buckets.set(user.id, { ...bucket, count: bucket.count + 1 });
    if (Number(request.headers.get("content-length") ?? 0) > 12000)
      return reply({ detail: "分享連結太長，請重新複製。" }, 400);
    const text = await limitedBody(request);
    if (text === null)
      return reply({ detail: "分享連結太長，請重新複製。" }, 400);
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return reply({ detail: "請貼上 Google 地圖分享連結。" }, 400);
    }
    if (typeof body?.url !== "string")
      return reply({ detail: "請貼上 Google 地圖分享連結。" }, 400);
    try {
      googleMapsUrl(body.url);
    } catch {
      return reply({ detail: "請貼上有效的 Google 地圖分享連結。" }, 400);
    }
    try {
      // 使用全域 fetch 只連 Google；後端授權只使用上方 event.fetch，不轉送 token。
      const point = await resolveGoogleMapsLink(body.url);
      return reply(point);
    } catch {
      return reply(
        {
          detail:
            "無法取得位置。請在 Google 地圖開啟院所地點，選「分享 → 複製連結」後重試，或貼上瀏覽器中的完整地點網址。",
        },
        422,
      );
    }
  } catch {
    return reply({ detail: "位置解析暫時無法使用，請稍後重試。" }, 503);
  }
};

import {
  googleMapsCoordinates,
  googleMapsUrl,
  type MapCoordinates,
} from "../maps/google-maps.ts";

/** 僅展開 Google 地圖轉址；不抓取任意網站、HTML、Cookie 或登入資訊。 */
export async function resolveGoogleMapsLink(
  input: string,
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<MapCoordinates> {
  let url = googleMapsUrl(input);
  const signal = AbortSignal.timeout(8000);
  for (let hop = 0; hop < 5; hop++) {
    const point = googleMapsCoordinates(url.href);
    if (point) return point;
    const response = await fetchImpl(url.href, {
      method: "GET",
      redirect: "manual",
      signal,
      credentials: "omit",
      headers: { Accept: "text/html" },
    });
    const location = response.headers.get("location");
    await response.body?.cancel();
    if ([301, 302, 303, 307, 308].includes(response.status) && location) {
      url = googleMapsUrl(new URL(location, url).href);
      continue;
    }
    break;
  }
  throw new Error(
    "這個連結尚未提供可辨識的位置。請在 Google 地圖開啟院所的地點卡片，再選「分享 → 複製連結」；也可貼上瀏覽器中的完整地點網址。",
  );
}

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

const MAP_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "google.com.tw",
  "www.google.com.tw",
  "maps.google.com.tw",
  "www.google.co.jp",
  "google.co.jp",
  "maps.google.co.jp",
  "www.google.com.hk",
  "google.com.hk",
  "maps.google.com.hk",
]);

/** 只接受 HTTPS Google 地圖網址；每一個短連結轉址也須重新檢查。 */
export function googleMapsUrl(input: string): URL {
  if (!input || input.length > 8192)
    throw new Error("請貼上 Google 地圖的分享連結。");
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("請貼上完整的 Google 地圖分享連結。");
  }
  const host = url.hostname;
  const short =
    (host === "maps.app.goo.gl" &&
      /^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) ||
    (host === "goo.gl" && /^\/maps\/[A-Za-z0-9_-]+\/?$/.test(url.pathname));
  const maps =
    MAP_HOSTS.has(host) &&
    (/^\/maps(?:\/|$)/.test(url.pathname) ||
      (host.startsWith("maps.") && url.pathname === "/"));
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    (!short && !maps)
  )
    throw new Error(
      "請使用 Google 地圖的分享連結（maps.app.goo.gl 或 google.com/maps）。",
    );
  url.hash = "";
  return url;
}

function coordinates(lat: string, lng: string): MapCoordinates | null {
  const latitude = Number(lat),
    longitude = Number(lng);
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
    ? { latitude, longitude }
    : null;
}

/** 優先取地點標記；@lat,lng 與 ll 只是視窗中心，不可當成院所座標。 */
export function googleMapsCoordinates(input: string): MapCoordinates | null {
  const url = googleMapsUrl(input);
  let path: string;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (/^\/maps\/dir(?:\/|$)/.test(path)) return null;
  const number = "(-?\\d+(?:\\.\\d+)?)";
  const pin = path.match(new RegExp(`!3d${number}!4d${number}(?=!|/|$)`));
  if (pin) return coordinates(pin[1], pin[2]);
  // Google Maps 的 data 也可能出現在查詢參數中。
  const data = url.searchParams.get("data") ?? "";
  const dataPin = data.match(new RegExp(`!3d${number}!4d${number}(?=!|$)`));
  if (dataPin) return coordinates(dataPin[1], dataPin[2]);
  for (const key of ["query", "q"]) {
    // 有 place ID 時 Google 以該地點為準，不能拿 fallback query 當成地點座標。
    if (
      url.searchParams.has("query_place_id") ||
      url.searchParams.has("place_id")
    )
      continue;
    const match = url.searchParams
      .get(key)
      ?.match(new RegExp(`^\\s*${number}\\s*,\\s*${number}\\s*$`));
    if (match) return coordinates(match[1], match[2]);
  }
  const place = path.match(
    new RegExp(`^/maps/place/${number},\\s*${number}/?$`),
  );
  return place ? coordinates(place[1], place[2]) : null;
}

export function googleMapsPreview(value: MapCoordinates): string {
  return `https://www.google.com/maps/search/?api=1&query=${value.latitude},${value.longitude}`;
}

import assert from "node:assert/strict";
import test from "node:test";
import {
  CLINIC_OG_CACHE,
  CLINIC_OG_DEGRADED_CACHE,
  CLINIC_PAGE_CACHE,
  CLINIC_PAGE_DEGRADED_CACHE,
  DYNAMIC_PAGE_CACHE,
  LANDING_PAGE_CACHE,
  STATIC_PAGE_CACHE,
} from "../src/lib/cache-control.ts";

// 進 CDN 快取的回應：Vercel 依 s-maxage 快取，送給瀏覽器前剝掉 s-maxage 與 stale-while-revalidate。
// 舊版正式站（Next on Vercel）瀏覽器收到的一律是 `public, max-age=0, must-revalidate`（2026-10-21 curl 正式站：
// /terms、/、/area、/sitemap.xml、/auth、診所 opengraph-image），所以 CDN 快取值要以這三個指令開頭，
// 剝掉之後瀏覽器端才與舊版相同（只寫 `public, s-maxage=…` 時瀏覽器只剩 `public`，會依啟發式快取）。
const CDN_CACHES = {
  STATIC_PAGE_CACHE: [STATIC_PAGE_CACHE, 31536000],
  LANDING_PAGE_CACHE: [LANDING_PAGE_CACHE, 3600],
  CLINIC_OG_CACHE: [CLINIC_OG_CACHE, 86400],
};

/** Vercel CDN 送給瀏覽器的 cache-control：拿掉只給 CDN 的指令 */
const browserSees = (value) =>
  value
    .split(",")
    .map((d) => d.trim())
    .filter((d) => !/^(s-maxage|stale-while-revalidate)\b/.test(d))
    .join(", ");

for (const [name, [value, seconds]] of Object.entries(CDN_CACHES)) {
  test(`${name}：public, max-age=0, must-revalidate, s-maxage=${seconds}, stale-while-revalidate`, () => {
    assert.equal(value, `public, max-age=0, must-revalidate, s-maxage=${seconds}, stale-while-revalidate`);
    assert.equal(browserSees(value), "public, max-age=0, must-revalidate", "瀏覽器端與舊版正式站相同");
  });
}

test("不進 CDN 的值：診所頁與降級皆 private, no-store；分享圖退化與舊版 opengraph-image 相同；動態頁同 Next", () => {
  assert.equal(CLINIC_PAGE_CACHE, "private, no-store");
  assert.equal(CLINIC_PAGE_DEGRADED_CACHE, "private, no-store");
  assert.equal(CLINIC_OG_DEGRADED_CACHE, "public, max-age=0, must-revalidate");
  assert.equal(DYNAMIC_PAGE_CACHE, "private, no-cache, no-store, max-age=0, must-revalidate");
  for (const value of [CLINIC_PAGE_CACHE, CLINIC_PAGE_DEGRADED_CACHE, CLINIC_OG_DEGRADED_CACHE, DYNAMIC_PAGE_CACHE]) {
    assert.doesNotMatch(value, /s-maxage/);
  }
});

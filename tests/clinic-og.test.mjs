import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isRedirect } from "@sveltejs/kit";
import { CLINIC_OG_CACHE, CLINIC_OG_DEGRADED_CACHE } from "../src/lib/cache-control.ts";

// 診所專屬分享圖（移植自舊版 app/clinic/[clinic-id]/opengraph-image.tsx）：
// - 1200×630 PNG；有 logo（PNG/JPEG/GIF）用 logo，否則十字記號；中文用 Noto Sans TC 子集
// - 字型載入失敗退回 Latin（Cross / Online Clinic Booking）；任何意外退回漸層品牌卡，永不 500
// - 後端只經 event.fetch（相對路徑走代理）；Google Fonts、logo 是外部網址，用全域 fetch（不帶 event 的 cookie）
// - 只有「完整」的卡片才讓 CDN 快取一天；字型、後端、logo 暫時失敗或退回品牌卡時照舊版不快取
//   （舊版 public, max-age=0, must-revalidate，每次重新產生），避免一次失敗把錯的卡釘在 CDN 上 24 小時
const { GET } = await import("../src/routes/clinic/[id]/og.png/+server.ts");
const { clinicCardElement, renderClinicOg } = await import("../src/lib/og/clinic-og.ts");

const ID = "c406782c-628f-411c-890c-62a3dc4a5cf0";
const RAW = { id: ID, name: "喬鋭德鶴", address: "高雄市三民區博愛里長明街175號", logo: null };
// 以 @vercel/og 自帶的 Latin 字型充當「下載到的字型子集」（測試不連 Google Fonts）
const FONT = readFileSync(new URL("../node_modules/@vercel/og/dist/Geist-Regular.ttf", import.meta.url));
// 1×1 透明 PNG
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const FONT_CSS_PREFIX = "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&text=";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function pngSize(bytes) {
  const b = Buffer.from(bytes);
  assert.equal(b.subarray(1, 4).toString(), "PNG", "應為 PNG");
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

/** 外部網址（Google Fonts、logo）的假回應；記錄呼叫，後端路徑出現在這裡就是漏走代理 */
function mockExternal(t, { fonts = "ok", logo } = {}) {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    url = String(url);
    calls.push(url);
    assert.ok(/^https?:\/\//.test(url) && !url.includes("/api/v1/"), `後端不應走全域 fetch：${url}`);
    if (url.startsWith(FONT_CSS_PREFIX)) {
      if (fonts === "fail") throw new TypeError("fetch failed");
      if (fonts === "no-ttf") return new Response("@font-face { src: url(https://fonts.gstatic.com/s/sub.woff2) format('woff2'); }");
      return new Response("@font-face { src: url(https://fonts.gstatic.com/s/sub.ttf) format('truetype'); }");
    }
    if (url === "https://fonts.gstatic.com/s/sub.ttf") return new Response(FONT);
    if (logo && url === logo.url) {
      if (logo.throws) throw new TypeError("fetch failed");
      return new Response(logo.body, { status: logo.status ?? 200, headers: { "content-type": logo.type } });
    }
    return new Response("not found", { status: 404 });
  });
  return calls;
}

/** 假的 event：fetch 只會被用來打 /api/v1（代理）；status 模擬後端錯誤回應 */
function event(clinics, { status = 200 } = {}) {
  const calls = [];
  return {
    calls,
    params: { id: ID },
    url: new URL(`https://cross.twinhao.com/clinic/${ID}/og.png`),
    fetch: async (url) => {
      calls.push(String(url));
      if (clinics instanceof Error) throw clinics;
      return json(clinics, status);
    },
  };
}

test("有字型：回 200 image/png 1200×630、快取一天；字型子集含診所名、副標與頁尾品牌字", async (t) => {
  const external = mockExternal(t);
  const e = event([{ id: "other", name: "別家" }, RAW]);
  const res = await GET(e);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/png");
  assert.equal(res.headers.get("cache-control"), CLINIC_OG_CACHE);
  assert.deepEqual(pngSize(await res.arrayBuffer()), { width: 1200, height: 630 });
  assert.deepEqual(e.calls, ["/api/v1/booking/clinics"]);
  const css = external.find((u) => u.startsWith(FONT_CSS_PREFIX));
  assert.equal(
    decodeURIComponent(css.slice(FONT_CSS_PREFIX.length)),
    "喬鋭德鶴高雄市・線上預約掛號線上預約掛號診所 Cross cross.twinhao.com",
  );
});

test("字型載入失敗、後端掛掉：仍回 200 PNG（退回 Latin 版面），名稱用預設", async (t) => {
  const external = mockExternal(t, { fonts: "fail" });
  const res = await GET(event(new TypeError("fetch failed")));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/png");
  assert.equal(res.headers.get("cache-control"), CLINIC_OG_DEGRADED_CACHE, "退化卡不可進 CDN 快取一天");
  assert.deepEqual(pngSize(await res.arrayBuffer()), { width: 1200, height: 630 });
  const css = external.find((u) => u.startsWith(FONT_CSS_PREFIX));
  assert.ok(decodeURIComponent(css).includes("診所線上預約線上預約掛號"), css);
});

test("退化快取標頭照舊版：public, max-age=0, must-revalidate（不含 s-maxage）", () => {
  assert.equal(CLINIC_OG_DEGRADED_CACHE, "public, max-age=0, must-revalidate");
  assert.ok(!CLINIC_OG_DEGRADED_CACHE.includes("s-maxage"));
});

// 暫時性失敗：卡片內容不是這間診所「應有」的樣子 → 不可讓 CDN 快取一天
const PNG_LOGO = "https://images.example.com/logo.png";
const degradedCases = [
  { name: "字型載入失敗（後端正常）→ Latin 卡", external: { fonts: "fail" }, clinics: [RAW] },
  { name: "Google Fonts 回的 CSS 沒有 truetype 來源", external: { fonts: "no-ttf" }, clinics: [RAW] },
  { name: "後端連不上（fetch 丟錯）→ 預設名稱", external: {}, clinics: new TypeError("fetch failed") },
  { name: "後端回 502", external: {}, clinics: { detail: "bad gateway" }, status: 502 },
  { name: "後端回 200 但不是陣列", external: {}, clinics: { detail: "oops" } },
  {
    name: "PNG logo 下載丟錯 → 十字記號",
    external: { logo: { url: PNG_LOGO, throws: true } },
    clinics: [{ ...RAW, logo: PNG_LOGO }],
  },
  {
    name: "PNG logo 回 503 → 十字記號",
    external: { logo: { url: PNG_LOGO, body: "x", type: "text/plain", status: 503 } },
    clinics: [{ ...RAW, logo: PNG_LOGO }],
  },
  {
    name: "渲染失敗 → 漸層品牌卡",
    external: { logo: { url: PNG_LOGO, body: Buffer.from("not a png"), type: "image/png" } },
    clinics: [{ ...RAW, logo: PNG_LOGO }],
  },
];
for (const c of degradedCases) {
  test(`退化不快取一天：${c.name}`, async (t) => {
    mockExternal(t, c.external);
    const e = event(c.clinics, { status: c.status });
    const res = await GET(e);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "image/png");
    assert.equal(res.headers.get("cache-control"), CLINIC_OG_DEGRADED_CACHE);
    assert.deepEqual(pngSize(await res.arrayBuffer()), { width: 1200, height: 630 });
    const out = await renderClinicOg(ID, { backendFetch: event(c.clinics, { status: c.status }).fetch, externalFetch: globalThis.fetch });
    assert.equal(out.degraded, true);
  });
}

// 穩定狀態：每次產生都一樣的卡（院所不在清單、logo 是不支援的格式）→ 可以快取一天
const stableCases = [
  { name: "完整卡（有字型、有院所）", external: {}, clinics: [RAW] },
  { name: "院所不在清單（後端正常）→ 預設名稱", external: {}, clinics: [{ ...RAW, id: "other" }] },
  { name: "院所清單為空", external: {}, clinics: [] },
  {
    name: "PNG logo 嵌入",
    external: { logo: { url: PNG_LOGO, body: PNG_1PX, type: "image/png" } },
    clinics: [{ ...RAW, logo: PNG_LOGO }],
  },
  {
    name: "AVIF logo（格式不支援，固定用十字記號）",
    external: { logo: { url: "https://images.example.com/logo.avif", body: PNG_1PX, type: "image/avif" } },
    clinics: [{ ...RAW, logo: "https://images.example.com/logo.avif" }],
  },
];
for (const c of stableCases) {
  test(`穩定卡快取一天：${c.name}`, async (t) => {
    mockExternal(t, c.external);
    const res = await GET(event(c.clinics));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), CLINIC_OG_CACHE);
    const out = await renderClinicOg(ID, { backendFetch: event(c.clinics).fetch, externalFetch: globalThis.fetch });
    assert.equal(out.degraded, false);
    assert.deepEqual(pngSize(out.png), { width: 1200, height: 630 });
  });
}

test("logo 是 PNG 才嵌入；AVIF 等 Satori 不支援的格式退回十字記號", async (t) => {
  const logo = { url: "https://images.example.com/logo.png", body: PNG_1PX, type: "image/png" };
  const external = mockExternal(t, { logo });
  const res = await GET(event([{ ...RAW, logo: logo.url }]));
  assert.equal(res.status, 200);
  assert.ok(external.includes(logo.url));

  const avif = { url: "https://images.example.com/logo.avif", body: PNG_1PX, type: "image/avif" };
  t.mock.restoreAll();
  mockExternal(t, { logo: avif });
  const withAvif = await renderClinicOg(ID, { backendFetch: event([{ ...RAW, logo: avif.url }]).fetch, externalFetch: globalThis.fetch });
  const without = await renderClinicOg(ID, { backendFetch: event([RAW]).fetch, externalFetch: globalThis.fetch });
  assert.deepEqual(Buffer.from(withAvif.png), Buffer.from(without.png), "AVIF logo 應與沒有 logo 的圖相同");
});

test("渲染失敗（logo 標成 PNG 但內容壞掉）：退回漸層品牌卡，不丟錯", async (t) => {
  const logo = { url: "https://images.example.com/broken.png", body: Buffer.from("not a png"), type: "image/png" };
  mockExternal(t, { logo });
  const res = await GET(event([{ ...RAW, logo: logo.url }]));
  assert.equal(res.status, 200);
  const bytes = Buffer.from(await res.arrayBuffer());
  assert.deepEqual(pngSize(bytes), { width: 1200, height: 630 });
  // 與後端回空清單（無名稱、無 logo）的正常卡不同，證明走的是退回品牌卡
  const normal = await renderClinicOg(ID, { backendFetch: event([]).fetch, externalFetch: globalThis.fetch });
  assert.notDeepEqual(bytes, Buffer.from(normal.png));
});

test("版面：有字型顯示診所名與副標（名稱超過 12 字縮小），沒字型顯示 Latin；有 logo 用 img", () => {
  const text = (node) =>
    typeof node === "string" ? node : [node?.props?.children].flat().filter(Boolean).map(text).join("");
  const find = (node, pred) => {
    if (!node || typeof node !== "object") return null;
    if (pred(node)) return node;
    for (const child of [node.props?.children].flat()) {
      const hit = find(child, pred);
      if (hit) return hit;
    }
    return null;
  };

  const tc = clinicCardElement({ name: "喬鋭德鶴", subtitle: "高雄市・線上預約掛號", logo: null, hasFont: true });
  assert.ok(text(tc).includes("喬鋭德鶴高雄市・線上預約掛號"));
  assert.equal(find(tc, (n) => n.props?.children === "喬鋭德鶴").props.style.fontSize, 76);
  assert.equal(tc.props.style.fontFamily, "Noto Sans TC, sans-serif");
  assert.equal(find(tc, (n) => n.type === "img"), null);

  // 12 字以內 76px，超過才縮成 60px
  const twelve = clinicCardElement({ name: "一二三四五六七八九十一二", subtitle: "x", logo: null, hasFont: true });
  assert.equal(find(twelve, (n) => n.props?.children === "一二三四五六七八九十一二").props.style.fontSize, 76);
  const long = clinicCardElement({ name: "一二三四五六七八九十一二三", subtitle: "x", logo: null, hasFont: true });
  assert.equal(find(long, (n) => n.props?.children === "一二三四五六七八九十一二三").props.style.fontSize, 60);

  const latin = clinicCardElement({ name: "喬鋭德鶴", subtitle: "高雄市・線上預約掛號", logo: "data:image/png;base64,AA==", hasFont: false });
  assert.ok(!text(latin).includes("喬鋭德鶴"));
  assert.ok(text(latin).includes("CrossOnline Clinic Booking"));
  assert.equal(latin.props.style.fontFamily, "sans-serif");
  const img = find(latin, (n) => n.type === "img");
  assert.equal(img.props.src, "data:image/png;base64,AA==");
  assert.equal(img.props.width, 260);
});

for (const path of [`/clinic/${ID}/opengraph-image`, `/clinic/${ID}/opengraph-image?5b580dbe5cf4dfa3`]) {
  test(`${path} → 308 /clinic/<id>/og.png（舊分享卡網址不破圖）`, async () => {
    const { GET: legacy } = await import("../src/routes/clinic/[id]/opengraph-image/+server.ts");
    let thrown;
    try {
      legacy({ params: { id: ID }, url: new URL(`https://cross.twinhao.com${path}`) });
    } catch (e) {
      thrown = e;
    }
    assert.ok(isRedirect(thrown), `應丟出 SvelteKit redirect，實際：${thrown}`);
    assert.equal(thrown.status, 308);
    assert.equal(thrown.location, `/clinic/${ID}/og.png`);
  });
}

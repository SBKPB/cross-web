import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isRedirect } from "@sveltejs/kit";
import { CLINIC_OG_CACHE } from "../src/lib/cache-control.ts";

// 診所專屬分享圖（移植自舊版 app/clinic/[clinic-id]/opengraph-image.tsx）：
// - 1200×630 PNG；有 logo（PNG/JPEG/GIF）用 logo，否則十字記號；中文用 Noto Sans TC 子集
// - 字型載入失敗退回 Latin（Cross / Online Clinic Booking）；任何意外退回漸層品牌卡，永不 500
// - 後端只經 event.fetch（相對路徑走代理）；Google Fonts、logo 是外部網址，用全域 fetch（不帶 event 的 cookie）
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
      return new Response("@font-face { src: url(https://fonts.gstatic.com/s/sub.ttf) format('truetype'); }");
    }
    if (url === "https://fonts.gstatic.com/s/sub.ttf") return new Response(FONT);
    if (logo && url === logo.url) return new Response(logo.body, { headers: { "content-type": logo.type } });
    return new Response("not found", { status: 404 });
  });
  return calls;
}

/** 假的 event：fetch 只會被用來打 /api/v1（代理） */
function event(clinics) {
  const calls = [];
  return {
    calls,
    params: { id: ID },
    url: new URL(`https://cross.twinhao.com/clinic/${ID}/og.png`),
    fetch: async (url) => {
      calls.push(String(url));
      if (clinics instanceof Error) throw clinics;
      return json(clinics);
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
  assert.deepEqual(pngSize(await res.arrayBuffer()), { width: 1200, height: 630 });
  const css = external.find((u) => u.startsWith(FONT_CSS_PREFIX));
  assert.ok(decodeURIComponent(css).includes("診所線上預約線上預約掛號"), css);
});

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
  assert.deepEqual(Buffer.from(withAvif), Buffer.from(without), "AVIF logo 應與沒有 logo 的圖相同");
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
  assert.notDeepEqual(bytes, Buffer.from(normal));
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

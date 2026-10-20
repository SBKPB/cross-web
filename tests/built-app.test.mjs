import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { chromium } from "playwright-core";
import { buildProblem, CHROME, startPreview } from "./support/built-app.mjs";

// 對 `pnpm build` 產物（vite preview）驗證的行為；產物不存在或比來源舊就明確失敗（請先 pnpm build）。
const PORT = Number(process.env.BUILT_APP_TEST_PORT ?? 4321);
const problem = buildProblem();
const STATIC_PAGE_CACHE = "public, s-maxage=31536000, stale-while-revalidate";

let preview;
let base;

before(async () => {
  if (problem) return;
  preview = await startPreview(PORT);
  base = preview.origin;
});

after(() => preview?.stop());

// 舊版這五頁是 SSG（CDN 快取一年，部署時清除）；首頁舊版也是 SSG（3100 基準回 s-maxage=31536000）
for (const path of ["/", "/terms", "/privacy", "/refund", "/pricing"]) {
  test(`${path} 帶靜態頁快取標頭（GET 與 HEAD）`, async () => {
    if (problem) assert.fail(problem);
    for (const method of ["GET", "HEAD"]) {
      const res = await fetch(base + path, { method });
      await res.body?.cancel();
      assert.equal(res.status, 200, `${method} ${path}`);
      assert.equal(res.headers.get("cache-control"), STATIC_PAGE_CACHE, `${method} ${path}`);
    }
  });
}

// 預約流程：舊版是動態渲染（依網址參數抓資料、成功頁讀 searchParams），3100 基準與正式站皆回 Next 動態頁標頭
const DYNAMIC_PAGE_CACHE = "private, no-cache, no-store, max-age=0, must-revalidate";
for (const path of [
  "/booking/00000000-0000-0000-0000-000000000000",
  "/booking/00000000-0000-0000-0000-000000000000/success?id=x",
]) {
  test(`${path} 帶動態頁快取標頭（不進 CDN、瀏覽器不快取）`, async () => {
    if (problem) assert.fail(problem);
    for (const method of ["GET", "HEAD"]) {
      const res = await fetch(base + path, { method });
      await res.body?.cancel();
      assert.equal(res.status, 200, `${method} ${path}`);
      assert.equal(res.headers.get("cache-control"), DYNAMIC_PAGE_CACHE, `${method} ${path}`);
    }
  });
}

// 預約流程的伺服器 HTML（3100 基準實測）：舊版沒有頁面專屬 metadata，<head> 是 root layout 的全站預設
// （標題、描述、robots、canonical、og 卡片含 1200×630 分享圖、twitter、全站 JSON-LD）——把預約網址貼到 LINE / FB / Slack，
// 不執行 JS 的預覽爬蟲拿到的是全站卡片。<body> 先輸出民眾端外框（無 footer）與 loading.tsx 骨架，資料之後才到；
// 成功頁照網址的 ?id= 先顯示轉圈（有 id）或「無法載入預約資訊」（沒有 id）。
const BOOKING_ID = "00000000-0000-0000-0000-000000000000";
for (const [path, body] of [
  [`/booking/${BOOKING_ID}`, /<main id="public-content"[^>]*>[\s\S]*role="status" aria-label="載入預約資訊中"/],
  [`/booking/${BOOKING_ID}/success?id=x`, /<main id="public-content"[^>]*>[\s\S]*animate-spin/],
  [`/booking/${BOOKING_ID}/success`, /<main id="public-content"[^>]*>[\s\S]*無法載入預約資訊/],
]) {
  test(`${path}：伺服器 HTML 帶全站預設 <head> 與外框`, async () => {
    if (problem) assert.fail(problem);
    const res = await fetch(base + path);
    const html = await res.text();
    assert.equal(res.status, 200);
    const end = html.indexOf("</head>");
    const head = html.slice(0, end);
    assert.deepEqual([...head.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => m[1]), ["Cross | AIoT 健康資料連接平台"]);
    assert.match(head, /<meta name="description" content="讓設備、醫療軟體與健康資料更容易連接。/);
    assert.match(head, /<meta name="robots" content="index, follow"/);
    assert.match(head, /<link rel="canonical" href="https:\/\/cross\.twinhao\.com"/);
    assert.match(head, /<meta property="og:title" content="Cross \| AIoT 健康資料連接平台"/);
    assert.match(head, /<meta property="og:url" content="https:\/\/cross\.twinhao\.com"/);
    assert.match(head, new RegExp(`<meta property="og:image" content="${base}/og\\.png"`));
    assert.match(head, /<meta property="og:image:width" content="1200"/);
    assert.match(head, /<meta property="og:image:height" content="630"/);
    assert.match(head, /<meta name="twitter:card" content="summary"/);
    assert.match(head, /application\/ld\+json/);
    assert.match(html.slice(end), body);
    assert.doesNotMatch(html, /<footer/, "預約流程的外框沒有 footer（舊版 app/booking/layout.tsx）");
  });
}

test("快取標頭只加在靜態頁：不存在的路徑（404）不帶一年 s-maxage", async () => {
  if (problem) assert.fail(problem);
  const res = await fetch(`${base}/no-such-page-for-cache-test`);
  await res.body?.cancel();
  assert.equal(res.status, 404);
  assert.doesNotMatch(res.headers.get("cache-control") ?? "", /s-maxage=31536000/);
});

// 舊版沒有自訂 not-found：找不到路由時渲染 Next 預設 404 頁（只在 root layout 內，無 header / footer）。
// 伺服器 <head>：全站 metadata + robots noindex，全站與「404: …」兩個 <title>，並有全站 JSON-LD（3100 基準實測）。
// 順序與舊版不同（Svelte 把受管的 <title> 放在 head 最後）；瀏覽器端分頁標題由 Svelte 設為全站標題，與舊版相同。
test("找不到路由：Next 預設 404 頁與 <head>", async () => {
  if (problem) assert.fail(problem);
  const res = await fetch(`${base}/no-such-page-for-404-test`);
  const html = await res.text();
  assert.equal(res.status, 404);
  const head = html.slice(0, html.indexOf("</head>"));
  assert.deepEqual(
    [...head.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => m[1]).sort(),
    ["404: This page could not be found.", "Cross | AIoT 健康資料連接平台"],
  );
  assert.match(head, /<meta name="robots" content="noindex"/);
  assert.match(head, /application\/ld\+json/);
  assert.match(html, /<h1 class="next-error-h1"[^>]*>\s*404\s*<\/h1>/);
  assert.match(html, /This page could not be found\./);
  assert.doesNotMatch(html, /public-content/, "不應包在民眾端外框內");
});

// 舊版 app/robots.ts 是靜態 metadata route（build 時產生，部署才更新）；新版 prerender 成靜態檔，Vercel 由 CDN 直接回應
test("robots.txt：建置時預先產生為靜態檔（含 Vercel 輸出），內容與 3100 基準逐位元組相同", async () => {
  if (problem) assert.fail(problem);
  const baseline = readFileSync(new URL("./support/landing/robots-3100.txt", import.meta.url), "utf8");
  assert.equal(readFileSync(new URL("../.vercel/output/static/robots.txt", import.meta.url), "utf8"), baseline);
  const res = await fetch(`${base}/robots.txt`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /^text\/plain/);
  assert.equal(await res.text(), baseline);
});

test("舊分享圖網址 /opengraph-image（含任意 query）308 → /og.png，且 /og.png 取得到", async () => {
  if (problem) assert.fail(problem);
  for (const path of ["/opengraph-image", "/opengraph-image?d41d8cd98f00b204", "/opengraph-image?a=1&b=2"]) {
    const res = await fetch(base + path, { redirect: "manual" });
    await res.body?.cancel();
    assert.equal(res.status, 308, path);
    assert.equal(res.headers.get("location"), "/og.png", path);
  }
  const og = await fetch(`${base}/og.png`);
  await og.body?.cancel();
  assert.equal(og.status, 200);
  assert.match(og.headers.get("content-type") ?? "", /^image\/png/);
});

// root layout 的 beforeNavigate：換頁期間 <html> 的 scroll-behavior 改成 auto，完成後還原；
// 還原當下頁面已在頂端（不是從上一頁的位置慢慢滑上去）
test("換頁時暫停平滑捲動、完成後還原，新頁面直接在頂端", { skip: existsSync(CHROME) ? false : `找不到 Chrome：${CHROME}` }, async () => {
  if (problem) assert.fail(problem);
  const browser = await chromium.launch({ executablePath: CHROME });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${base}/terms`, { waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), "smooth");
    await page.evaluate(() => {
      window.scrollChanges = [];
      let last = document.documentElement.style.scrollBehavior;
      new MutationObserver(() => {
        const now = document.documentElement.style.scrollBehavior;
        if (now === last) return;
        last = now;
        window.scrollChanges.push({ value: now, path: location.pathname, scrollY: Math.round(window.scrollY) });
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    });
    // 先瞬間捲到底（不受 smooth 影響），再點頁尾連結做 client 端換頁
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    assert.ok((await page.evaluate(() => window.scrollY)) > 500);
    await page.click('footer a[href="/refund"]');
    await page.waitForURL(`${base}/refund`);
    await page.waitForFunction(() => window.scrollChanges.length >= 2);
    const changes = await page.evaluate(() => window.scrollChanges);
    assert.deepEqual(
      changes.map((c) => c.value),
      ["auto", ""],
      JSON.stringify(changes),
    );
    assert.equal(changes[0].path, "/terms", "導航開始前就暫停");
    // window.scrollChanges 還在，表示是 client 端換頁（整頁重新載入會清掉）
    assert.deepEqual({ path: changes[1].path, scrollY: changes[1].scrollY }, { path: "/refund", scrollY: 0 }, "還原時已在新頁頂端");
  } finally {
    await browser.close();
  }
});

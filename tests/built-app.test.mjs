import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { chromium } from "playwright-core";
import { buildProblem, CHROME, startPreview } from "./support/built-app.mjs";

// 對 `pnpm build` 產物（vite preview）驗證的行為；產物不存在或比來源舊就明確失敗（請先 pnpm build）。
const PORT = Number(process.env.BUILT_APP_TEST_PORT ?? 4321);
const problem = buildProblem();
const STATIC_PAGE_CACHE = "public, max-age=0, must-revalidate, s-maxage=31536000, stale-while-revalidate";

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
    assert.deepEqual([...head.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => m[1]), ["Cross | 線上預約與院所管理平台"]);
    assert.match(head, /<meta name="description" content="線上預約看診、醫美諮詢與療程，/);
    assert.match(head, /<meta name="robots" content="index, follow"/);
    assert.match(head, /<link rel="canonical" href="https:\/\/cross\.twinhao\.com"/);
    assert.match(head, /<meta property="og:title" content="Cross \| 線上預約與院所管理平台"/);
    assert.match(head, /<meta property="og:url" content="https:\/\/cross\.twinhao\.com"/);
    // 分享圖網址固定用正式網域（舊版 metadataBase），不是本機 preview 的來源
    assert.match(head, /<meta property="og:image" content="https:\/\/cross\.twinhao\.com\/og\.png"/);
    assert.match(head, /<meta property="og:image:width" content="1200"/);
    assert.match(head, /<meta property="og:image:height" content="630"/);
    assert.match(head, /<meta name="twitter:card" content="summary"/);
    assert.match(head, /application\/ld\+json/);
    assert.match(html.slice(end), body);
    assert.doesNotMatch(html, /<footer/, "預約流程的外框沒有 footer（舊版 app/booking/layout.tsx）");
  });
}

// 伺服器端渲染外框與骨架之後，院所資料仍在瀏覽器端抓（攔截 /api/v1，不連後端）：
// hydration 後顯示預約流程且無錯誤；未開通線上預約的院所以 replace 導回院所頁（舊版 redirect() 串流後在瀏覽器端 replace，HTTP 仍是 200）
test("預約頁 hydration 後在瀏覽器端載入院所資料；未開通線上預約以 replace 導回院所頁", { skip: existsSync(CHROME) ? false : `找不到 Chrome：${CHROME}` }, async () => {
  if (problem) assert.fail(problem);
  const id = "11111111-2222-3333-4444-555555555555";
  const config = (onlineBooking) => ({
    id, clinic_name: "測試預約診所", logo: null, hero_banner: null, primary_color: "#1d4ed8", phone: "02-1234-5678",
    address: "台北市信義區市府路1號", google_maps_url: null, payment_type: "both",
    online_booking_enabled: onlineBooking, phone_booking_enabled: true, show_schedule: false,
  });
  const browser = await chromium.launch({ executablePath: CHROME });
  try {
    for (const onlineBooking of [true, false]) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const problems = [];
      page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
      page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") problems.push(`${m.type()}: ${m.text()}`); });
      const apiCalls = [];
      await page.route(/\/api\/v1\//, (route) => {
        const path = new URL(route.request().url()).pathname;
        apiCalls.push(path);
        const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
        if (path.endsWith(`/clinics/${id}/config`)) return json(config(onlineBooking));
        if (path.endsWith(`/clinics/${id}/services`)) return json([{ id: "s1", name: "一般門診諮詢", description: "", price: 0, duration_minutes: 15, category: "一般服務" }]);
        if (path.endsWith(`/clinics/${id}/doctors`)) return json([{ id: "d1", name: "王醫師", title: "家醫科", specialties: [], is_bookable: true }]);
        return json({ detail: "Not Found" }, 404);
      });
      // 導回院所頁後的 client 端換頁資料請求不連後端
      await page.route(/\/clinic\/[^/]+\/__data\.json/, (route) => route.fulfill({ status: 404, contentType: "text/plain", body: "" }));
      await page.goto(`${base}/terms`);
      const historyBefore = await page.evaluate(() => history.length);
      await page.goto(`${base}/booking/${id}`);
      if (onlineBooking) {
        await page.getByText("測試預約診所").first().waitFor({ timeout: 15_000 });
        await page.getByText("一般門診諮詢").first().waitFor({ timeout: 15_000 });
        assert.equal(await page.locator('[aria-label="載入預約資訊中"]').count(), 0, "資料回來後骨架消失");
        assert.deepEqual(problems, []);
      } else {
        await page.waitForURL(`${base}/clinic/${id}`, { timeout: 15_000 });
        // 直接開預約頁算一筆歷史；replace 導回後不多一筆（上一頁回到 /terms）
        assert.equal(await page.evaluate(() => history.length), historyBefore + 1, "以 replace 導回院所頁");
      }
      for (const kind of ["config", "services", "doctors"]) {
        assert.ok(apiCalls.includes(`/api/v1/booking/clinics/${id}/${kind}`), `瀏覽器端抓 ${kind}：${JSON.stringify(apiCalls)}`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

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
    ["404: This page could not be found.", "Cross | 線上預約與院所管理平台"],
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

// 登入、會員、加入頁（Task 12）：舊版都是 client component，但 Next 仍伺服器端渲染「未登入／載入中」的外框
// 並帶 root layout 的全站 <head>（3100 基準實測）。新版同樣 SSR 外框，登入狀態只在瀏覽器端判斷（SSR 不讀 localStorage）。
const SITE_TITLE = "Cross | 線上預約與院所管理平台";
const SPINNER_60 =
  '<div class="flex min-h-[60vh] items-center justify-center bg-background"><div class="size-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div></div>';
const memberNav = (current) =>
  new RegExp(`<nav aria-label="會員功能"[\\s\\S]*?<a href="${current}" aria-current="page"`);
for (const [path, cache, title, checks] of [
  [
    "/auth",
    STATIC_PAGE_CACHE,
    SITE_TITLE,
    [
      /<body[^>]*>[\s\S]*<div class="flex min-h-screen items-center justify-center bg-background"><div class="size-8 animate-spin rounded-full border-4 border-muted border-t-primary"><\/div><\/div>/,
    ],
  ],
  [
    "/auth?next=%2Fbooking%2Fx",
    STATIC_PAGE_CACHE,
    SITE_TITLE,
    [/<div class="flex min-h-screen items-center justify-center bg-background"><div class="size-8 animate-spin/],
  ],
  [
    "/auth/complete-profile",
    STATIC_PAGE_CACHE,
    SITE_TITLE,
    [
      /<main id="public-content" class="min-w-0 flex-1">[\s\S]*<div class="flex min-h-\[70vh\] items-center justify-center bg-background"><div class="size-8 animate-spin/,
      /<footer/,
    ],
  ],
  ["/member", STATIC_PAGE_CACHE, SITE_TITLE, [memberNav("/member"), SPINNER_60, /<footer/]],
  ["/member/favorites", STATIC_PAGE_CACHE, SITE_TITLE, [memberNav("/member/favorites"), SPINNER_60]],
  ["/member/patients", STATIC_PAGE_CACHE, SITE_TITLE, [memberNav("/member/patients"), SPINNER_60]],
  ["/member/appointments/x", DYNAMIC_PAGE_CACHE, SITE_TITLE, [memberNav("/member"), SPINNER_60]],
  ["/join", STATIC_PAGE_CACHE, "院所導入 | Cross", [/讓預約更有條理，/, /申請院所導入/]],
  ["/join/apply", STATIC_PAGE_CACHE, "申請加入 Cross | Cross", [/成為 Cross 合作夥伴/, /第 1 \/ 3 步 · 你經營的是哪一種？/]],
  ["/join/verify", STATIC_PAGE_CACHE, "驗證信箱並設定密碼 | Cross", [/<div class="text-sm text-muted-foreground">載入中…<\/div>/]],
]) {
  test(`${path}：伺服器 HTML 為舊版的外框與快取標頭`, async () => {
    if (problem) assert.fail(problem);
    const res = await fetch(base + path);
    const html = await res.text();
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), cache);
    const end = html.indexOf("</head>");
    assert.deepEqual([...html.slice(0, end).matchAll(/<title>([^<]*)<\/title>/g)].map((m) => m[1]), [title]);
    for (const check of checks) {
      if (typeof check === "string") assert.ok(html.slice(end).includes(check), `${path} 應含 ${check}`);
      else assert.match(html.slice(end), check);
    }
  });
}

// /join/verify 的伺服器 HTML 不依 ?token= 而不同（舊版 Suspense 在伺服器端只輸出「載入中…」；新版回應進 CDN 快取一年，
// 不能把某個 token 的內容快取給別人）
test("/join/verify：伺服器 HTML 與 token 無關", async () => {
  if (problem) assert.fail(problem);
  const main = (html) => html.slice(html.indexOf("<main"), html.indexOf("</main>"));
  const [a, b] = await Promise.all(
    ["/join/verify", "/join/verify?token=secret-token-123"].map((p) => fetch(base + p).then((r) => r.text())),
  );
  assert.doesNotMatch(b, /secret-token-123/);
  assert.ok(main(a).includes("載入中…"));
  assert.equal(main(b), main(a));
});

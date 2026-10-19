import assert from "node:assert/strict";
import { existsSync } from "node:fs";
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

// 舊版這四頁是 SSG（CDN 快取一年，部署時清除）
for (const path of ["/terms", "/privacy", "/refund", "/pricing"]) {
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

test("快取標頭只加在靜態頁：首頁不帶一年 s-maxage", async () => {
  if (problem) assert.fail(problem);
  const res = await fetch(`${base}/`);
  await res.body?.cancel();
  assert.equal(res.status, 200);
  assert.doesNotMatch(res.headers.get("cache-control") ?? "", /s-maxage=31536000/);
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

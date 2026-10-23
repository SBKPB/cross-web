import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { after, before, test } from "node:test";
import { chromium } from "playwright-core";
import { FALLBACK_TAXONOMY } from "../src/lib/api/service-categories.ts";
import { buildProblem, CHROME, startPreview } from "./support/built-app.mjs";

const external = process.env.HOMEPAGE_ORIGIN;
const evidence = process.env.HOMEPAGE_EVIDENCE_DIR;
const problem = external ? null : buildProblem();
let preview, origin, browser;
const types = ["healthcare", "aesthetic", "beauty", "other"];
const names = ["安心看診測試院所", "安心醫美測試院所", "安心美容測試院所", "安心服務測試院所"];
const clinics = types.map((type, i) => ({
  id: `home-clinic-${i}`, name: names[i], address: "臺北市信義區測試路1號", phone: null,
  facility_type: type, departments: [], logo: null, online_booking_enabled: true,
}));
const skip = existsSync(CHROME) ? false : `找不到 Chrome：${CHROME}`;

before(async () => {
  if (problem) return;
  if (external) origin = external.replace(/\/$/, "");
  else { preview = await startPreview(4398); origin = preview.origin; }
  if (!skip) browser = await chromium.launch({ executablePath: CHROME });
  if (evidence) mkdirSync(evidence, { recursive: true });
});
after(async () => { await browser?.close(); preview?.stop(); });

async function newPage(options = {}) {
  if (problem) assert.fail(problem);
  const page = await browser.newPage(options);
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(30000);
  const errors = [], writes = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // 所有 API 一律攔截；部署驗收也不讀寫正式會員與預約資料。
  await page.route("**/api/**", (route) => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (!["GET", "HEAD"].includes(req.method())) writes.push(`${req.method()} ${path}`);
    const body = path === "/api/v1/booking/clinics" ? clinics :
      path === "/api/v1/service-categories" ? FALLBACK_TAXONOMY : { detail: "未登入" };
    return route.fulfill({ status: path.includes("/auth/me") ? 401 : 200,
      contentType: "application/json", body: JSON.stringify(body) });
  });
  return { page, errors, writes };
}

// 搜尋入口需在不執行 JavaScript 的情況也可用，不把首頁變成只能等待載入的畫面。
test("首頁：伺服器提供單一主標題、搜尋表單及可直接使用的預約／院所入口", async () => {
  if (problem) assert.fail(problem);
  const res = await fetch(origin);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  assert.match(html, /預約好時間，/);
  assert.match(html, /<form[^>]*action="\/search"[^>]*method="GET"/);
  assert.match(html, /name="q" type="search"/);
  assert.match(html, /href="\/member"/);
  assert.match(html, /id="how-it-works"/);
  assert.match(html, /href="\/join"/);
  assert.match(html, /href="\/pricing"/);
});

test("首頁：鍵盤搜尋帶入結果、空白搜尋可瀏覽全部院所，手機分類正確篩選", { skip }, async () => {
  const { page, errors, writes } = await newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(origin);
    const input = page.getByRole("searchbox", { name: "想找哪間院所或哪種服務？" });
    await input.fill("安心醫美");
    await input.press("Enter");
    await page.waitForURL((url) => url.pathname === "/search" && url.searchParams.get("q") === "安心醫美");
    await page.getByText(names[1], { exact: true }).waitFor();
    assert.equal(await page.getByText(names[0], { exact: true }).count(), 0);
    await page.goto(origin);
    await page.getByRole("button", { name: "搜尋院所", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/search");
    for (const name of names) await page.getByText(name, { exact: true }).waitFor();
    for (const [i, type] of types.entries()) {
      await page.goto(origin);
      await page.getByRole("navigation", { name: "依服務類型找院所" }).locator(`a[href="/search?type=${type}"]`).click();
      await page.waitForURL((url) => url.searchParams.get("type") === type);
      await page.getByText(names[i], { exact: true }).waitFor();
      for (const other of names.filter((name) => name !== names[i]))
        assert.equal(await page.getByText(other, { exact: true }).count(), 0);
    }
    assert.deepEqual(errors, []); assert.deepEqual(writes, []);
  } finally { await page.close(); }
});

test("首頁：回訪客戶前往登入並保留目的地；院所導入與方案入口可到達", { skip }, async () => {
  const { page, errors, writes } = await newPage();
  try {
    await page.goto(origin);
    await page.getByRole("link", { name: "查看我的預約", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/auth" && url.searchParams.get("next") === "/member");
    await page.goto(origin);
    await page.getByRole("link", { name: "了解院所導入", exact: true }).click();
    await page.waitForURL(`${origin}/join`);
    await page.getByRole("heading", { level: 1 }).filter({ hasText: "讓預約更有條理" }).waitFor();
    await page.goto(origin);
    await page.locator("#for-clinics").getByRole("link", { name: "查看方案與費用", exact: true }).click();
    await page.waitForURL(`${origin}/pricing`);
    assert.deepEqual(errors, []); assert.deepEqual(writes, []);
  } finally { await page.close(); }
});

test("首頁：手機／平板／桌機及深色模式無溢出，搜尋可見、主圖正常、點擊區足夠", { skip }, async () => {
  for (const colorScheme of ["light", "dark"]) {
    for (const width of [360, 390, 768, 1440]) {
      const { page, errors } = await newPage({ viewport: { width, height: width < 768 ? 844 : 900 }, colorScheme });
      try {
        await page.goto(origin, { waitUntil: "networkidle" });
        await page.locator('img[fetchpriority="high"]').evaluate((img) => img.decode());
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width} ${colorScheme}`);
        const search = await page.getByRole("button", { name: "搜尋院所", exact: true }).boundingBox();
        assert.ok(search.y + search.height < (width < 768 ? 844 : 900), "第一屏可搜尋");
        for (const target of await page.locator('main form button, main nav a, main a[data-slot="button"], header a[href="/search"], header a[href="/member"]').all()) {
          const box = await target.boundingBox();
          assert.ok(box && box.height >= 44 && box.width >= 44, `${await target.textContent()} 點擊區至少44px`);
        }
        assert.equal(await page.locator("html").evaluate((el) => el.classList.contains("dark")), colorScheme === "dark");
        const input = page.getByRole("searchbox");
        await input.focus();
        assert.equal(await input.evaluate((el) => el.matches(":focus-visible")), true);
        if (evidence) await page.screenshot({ path: resolve(evidence, `home-${width}-${colorScheme}.png`), fullPage: true });
        assert.deepEqual(errors, []);
      } finally { await page.close(); }
    }
  }
});

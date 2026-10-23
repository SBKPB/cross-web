import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { after, before, test } from "node:test";
import { chromium } from "playwright-core";
import { CHROME } from "./support/built-app.mjs";
import { startHarness } from "./support/component-harness.mjs";

// 舊版 ClinicList 以 key={clinic.id} 渲染卡片：清單重新排序（搜尋排序、篩選）時，卡片元件與其狀態跟著同一間診所走。
// 新版以 clinic.id 為 key；後端清單有重複 id 時退回索引 key（舊版 React 只警告、照樣全部渲染，Svelte 會丟 each_key_duplicate）。
// 以 production 模式建置 support/clinic-list-keys（真正的 ClinicList / ClinicCard / FavoriteButton）用系統 Chrome 驗證。
const noChrome = existsSync(CHROME) ? false : `找不到 Chrome：${CHROME}`;

let harness;
let browser;

before(async () => {
  if (noChrome) return;
  harness = await startHarness("clinic-list-keys");
  browser = await chromium.launch({ executablePath: CHROME });
});

after(async () => {
  await browser?.close();
  await harness?.close();
});

/** 某間診所卡片上的收藏按鈕 */
const favorite = (page, name) =>
  page.locator('[data-slot="card"]', { hasText: name }).getByRole("button", { name: /收藏/ });

test("排序後收藏按鈕的 busy 狀態跟著同一間診所", { skip: noChrome }, async () => {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // 收藏清單為空；加入收藏的請求先擱著不回，按鈕維持 busy（disabled）
  const held = [];
  await page.route("**/api/v1/member/favorites", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/api/v1/member/favorites/*", (route) => held.push(route));
  await page.goto(`${harness.origin}/`);
  await page.waitForFunction(() => document.documentElement.dataset.mounted === "true");

  await favorite(page, "甲診所").click();
  await page.waitForFunction(() => document.querySelectorAll("button[disabled]").length === 1);
  assert.equal(await favorite(page, "甲診所").isDisabled(), true, "甲診所的請求進行中");
  assert.equal(await favorite(page, "乙診所").isDisabled(), false);
  assert.equal(held.length, 1);
  assert.match(held[0].request().url(), /\/favorites\/00000000-0000-4000-8000-000000000001$/);

  // 反轉順序：busy 要留在甲診所的卡片（索引 key 會讓狀態留在第一個位置、變成乙診所）
  await page.click("#reverse");
  const names = await page.$$eval('#list [data-slot="card-title"]', (els) => els.map((el) => el.textContent.trim()));
  assert.deepEqual(names, ["乙診所", "甲診所"]);
  assert.equal(await favorite(page, "甲診所").isDisabled(), true, "排序後 busy 仍在甲診所");
  assert.equal(await favorite(page, "乙診所").isDisabled(), false, "乙診所不應繼承 busy");
  assert.equal(await favorite(page, "甲診所").getAttribute("aria-pressed"), "true", "樂觀更新也跟著甲診所");

  // 請求完成後解除 busy
  await held[0].fulfill({ status: 204, body: "" });
  await page.waitForFunction(() => document.querySelectorAll("button[disabled]").length === 0);
  assert.deepEqual(errors, []);
  await page.close();
});

test("重複 id 不丟錯，照舊版全部渲染；恢復不重複後照常", { skip: noChrome }, async () => {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/v1/member/favorites", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.goto(`${harness.origin}/`);
  await page.waitForFunction(() => document.documentElement.dataset.mounted === "true");
  const titles = () => page.$$eval('#list [data-slot="card-title"]', (els) => els.map((el) => el.textContent.trim()));

  await page.click("#duplicate");
  assert.deepEqual(await titles(), ["甲診所", "甲診所", "乙診所"]);
  await page.click("#unique");
  assert.deepEqual(await titles(), ["乙診所", "甲診所"]);
  await page.click("#reverse");
  assert.deepEqual(await titles(), ["甲診所", "乙診所"]);

  const recorded = JSON.parse(await page.evaluate(() => document.documentElement.dataset.errors));
  assert.deepEqual([...errors, ...recorded], []);
  await page.close();
});

test("院所卡片載入 Logo；缺圖或失效時顯示首字，換圖後可恢復", { skip: noChrome }, async () => {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/v1/member/favorites", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/logo-valid.svg", (route) => route.fulfill({
    status: 200, contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="120" height="60" fill="#2563eb"/></svg>',
  }));
  await page.route("**/logo-broken.svg", (route) => route.fulfill({ status: 404, body: "" }));
  try {
    await page.goto(harness.origin);
    await page.waitForFunction(() => document.documentElement.dataset.mounted === "true");
    const card = page.locator('[data-slot="card"]', { hasText: "甲診所" });
    const fallback = card.locator('[data-slot="avatar-fallback"]');
    const logo = card.locator('[data-slot="avatar-image"]');
    await fallback.waitFor({ state: "visible" });
    assert.equal(await fallback.innerText(), "甲");
    for (const button of ["#logo-valid", "#logo-broken", "#logo-valid", "#logo-none", "#logo-valid"]) {
      await page.click(button);
      if (button === "#logo-valid") {
        await logo.waitFor({ state: "visible" });
        assert.equal(await logo.evaluate((img) => img.complete && img.naturalWidth === 120 && img.naturalHeight === 60), true);
        assert.match(await logo.getAttribute("class"), /object-contain/);
        await fallback.waitFor({ state: "hidden" });
      } else {
        await fallback.waitFor({ state: "visible" });
        assert.equal(await fallback.innerText(), "甲");
        await logo.waitFor({ state: "hidden" });
      }
    }
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

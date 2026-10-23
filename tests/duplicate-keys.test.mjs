import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { chromium } from "playwright-core";
import { build } from "vite";
import { CHROME } from "./support/built-app.mjs";

// 後端陣列有重複 id / code 時（例如同一位醫師重複出現、科別重複），舊版 React 只在 dev 警告、照樣全部渲染；
// Svelte 5 的 keyed each 遇到重複 key 會丟 each_key_duplicate（production 也會），整頁壞掉。
// 所有「迴圈資料來自後端」的元件都要能渲染重複資料：以 production 模式建置 support/duplicate-keys 再用系統 Chrome 載入。
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const HARNESS = fileURLToPath(new URL("./support/duplicate-keys/", import.meta.url));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

const noChrome = existsSync(CHROME) ? false : `找不到 Chrome：${CHROME}`;

let outDir;
let server;
let origin;
let browser;
let page;

before(async () => {
  if (noChrome) return;
  outDir = await mkdtemp(join(tmpdir(), "duplicate-keys-"));
  await build({
    configFile: false,
    root: HARNESS,
    logLevel: "error",
    mode: "production",
    plugins: [svelte({ configFile: false, preprocess: vitePreprocess() })],
    resolve: {
      alias: {
        "#lib": join(ROOT, "src/lib"),
        "$app/navigation": join(ROOT, "tests/support/app-navigation.mjs"),
        "$app/state": join(HARNESS, "app-state.js"),
      },
    },
    build: { outDir, emptyOutDir: true, minify: false },
  });
  server = createServer(async (req, res) => {
    const path = normalize(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
    try {
      const body = await readFile(join(outDir, path));
      res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      // 服務分類等 API 一律 404，元件用 fallback 字彙
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath: CHROME });
  page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/`);
  await page.waitForFunction(() => document.documentElement.dataset.mounted === "true");
  await page.waitForTimeout(200);
  page.__errors = errors;
});

after(async () => {
  await browser?.close();
  server?.close();
  if (outDir) await rm(outDir, { recursive: true, force: true });
});

/** 某範圍內出現某文字的次數 */
const count = (selector, text) =>
  page.$eval(selector, (el, t) => el.textContent.split(t).length - 1, text);

test("重複資料不丟錯（沒有 each_key_duplicate）", { skip: noChrome }, async () => {
  const errors = [...page.__errors, ...(await page.evaluate(() => JSON.parse(document.documentElement.dataset.errors)))];
  assert.deepEqual(errors, []);
});

test("診所卡片：重複科別照樣渲染兩次；清單：同 id 的兩張卡都渲染", { skip: noChrome }, async () => {
  assert.equal(await count("#card", "家醫科"), 2);
  assert.equal(await count("#list", "重複資料診所"), 2);
});

test("診所詳情對話框：重複科別、營業時間、人員、服務都渲染", { skip: noChrome }, async () => {
  await page.waitForSelector('[role="dialog"]');
  const text = await page.$$eval('[role="dialog"]', (els) => els.map((el) => el.textContent));
  const clinicDialog = text.find((t) => t.includes("重複資料診所"));
  assert.ok(clinicDialog, "找不到診所詳情對話框");
  const n = (t) => clinicDialog.split(t).length - 1;
  assert.equal(n("家醫科"), 2);
  assert.equal(n("09:00 - 12:00"), 2);
  assert.equal(n("重複醫師"), 2);
  assert.equal(n("重複服務"), 2);
});

test("診所詳情頁元件：公告、科別、營業時間、服務、團隊、時刻表、落地頁清單的重複資料都渲染", { skip: noChrome }, async () => {
  assert.equal(await count("#announcements", "重複公告"), 2);
  assert.equal(await count("#departments", "家醫科"), 2);
  assert.equal(await count("#hours", "09:00 - 12:00"), 2);
  assert.equal(await count("#services", "重複服務"), 2);
  assert.equal(await count("#team", "重複醫師"), 2);
  // 同一格同一位醫師依 doctor_id 去重（舊版行為）
  assert.equal(await count("#schedule", "重複醫師"), 1);
  assert.equal(await count("#landing", "重複落地診所"), 2);
  assert.equal(await count("#landing", "兒科"), 4);
});

test("醫師詳情對話框：重複專長、學歷、經歷都渲染", { skip: noChrome }, async () => {
  const text = await page.$$eval('[role="dialog"]', (els) => els.map((el) => el.textContent));
  const doctorDialog = text.find((t) => t.includes("重複學歷"));
  assert.ok(doctorDialog);
  const n = (t) => doctorDialog.split(t).length - 1;
  assert.equal(n("專長乙"), 2);
  assert.equal(n("重複學歷"), 2);
  assert.equal(n("重複經歷"), 2);
});

test("團隊成員分頁：依角色組顯示分頁，點「醫師」只列醫師與治療師、點「行政」只列櫃台", { skip: noChrome }, async () => {
  const tabs = await page.$$eval("#team-roles button:not([aria-label])", (els) => els.map((el) => el.textContent.trim()));
  assert.deepEqual(tabs, ["全部", "醫師", "護理", "行政"]);
  const names = () =>
    page.$$eval("#team-roles button[aria-label^='查看']", (els) => els.map((el) => el.getAttribute("aria-label")));
  assert.equal((await names()).length, 4);
  // 頁面上有開啟中的對話框（modal 擋住指標事件），直接對按鈕派送 click
  const tab = (label) =>
    page.$$eval("#team-roles button:not([aria-label])", (els, l) => els.find((el) => el.textContent.trim() === l).click(), label);
  await tab("醫師");
  assert.deepEqual(await names(), ["查看 重複醫師 詳細資料", "查看 治療丙 詳細資料"]);
  await tab("行政");
  assert.deepEqual(await names(), ["查看 櫃台乙 詳細資料"]);
});

test("預約流程：重複的日期、時段、服務、人員都渲染", { skip: noChrome }, async () => {
  assert.equal(await count("#booking-dates", "週三"), 2);
  assert.equal(await count("#booking-slots", "09:30"), 2);
  assert.equal(await count("#booking-services", "重複預約服務"), 2);
  assert.equal(await count("#booking-doctors", "重複預約醫師"), 2);
});

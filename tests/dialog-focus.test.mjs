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

// 對話框（Dialog、Sheet）開啟與關閉時的焦點要與舊版（Radix）相同：
// - 開啟：依 DOM 順序找第一個可 Tab、且不是 <a> 的元素（input 會全選），都沒有就聚焦內容容器。
//   Bits UI 預設會聚焦第一個可 Tab 的元素（含連結），診所詳情對話框因此聚焦「查看可約時段」連結，
//   鍵盤使用者再按 Enter 就跳去預約頁；舊版聚焦關閉鈕，Enter 是關閉。
// - 關閉：只把焦點還給對話框自己的 Trigger；沒有 Trigger（外部按鈕受控開啟）就落到 body。
//   Bits UI 預設是還給開啟前聚焦的元素。
// 用 vite 把 support/dialog-focus（掛真正的共用 ui 元件與診所對話框）建置成靜態頁，再用系統 Chrome 以鍵盤操作驗證。
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const HARNESS = fileURLToPath(new URL("./support/dialog-focus/", import.meta.url));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

const noChrome = existsSync(CHROME) ? false : `找不到 Chrome：${CHROME}`;

let outDir;
let server;
let origin;
let browser;

before(async () => {
  if (noChrome) return;
  outDir = await mkdtemp(join(tmpdir(), "dialog-focus-"));
  await build({
    configFile: false,
    root: HARNESS,
    logLevel: "error",
    plugins: [svelte({ configFile: false, preprocess: vitePreprocess() })],
    resolve: { alias: { $lib: join(ROOT, "src/lib") } },
    build: { outDir, emptyOutDir: true, minify: false },
  });
  server = createServer(async (req, res) => {
    const path = normalize(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
    try {
      const body = await readFile(join(outDir, path));
      res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      // 服務分類等 API 在這裡一律 404，元件會用 fallback（與後端不可用時相同）
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath: CHROME });
});

after(async () => {
  await browser?.close();
  server?.close();
  if (outDir) await rm(outDir, { recursive: true, force: true });
});

/** 聚焦觸發鈕、按 Enter 開啟（與鍵盤使用者相同），等開啟時的自動聚焦跑完，回傳 page 與目前焦點的描述 */
async function openWithKeyboard(scenario, role = "dialog") {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error));
  await page.goto(`${origin}/?case=${scenario}`);
  await page.focus("#trigger");
  await page.keyboard.press("Enter");
  await page.waitForSelector(`[role="${role}"][data-state="open"]`);
  // Bits UI 與我們的自動聚焦都在下一個 frame 執行；多等幾個 frame 與一小段時間，確保焦點不會再移動
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(100);
  assert.deepEqual(errors, [], "頁面不應有錯誤");
  return { page, active: await describeActive(page) };
}

/** 等對話框移除、關閉時的焦點處理跑完，回傳目前焦點的描述 */
async function closeAndDescribe(page, role = "dialog") {
  await page.waitForSelector(`[role="${role}"]`, { state: "detached" });
  await page.waitForTimeout(100);
  return describeActive(page);
}

function describeActive(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    return {
      tag: el.tagName,
      id: el.id,
      slot: el.getAttribute("data-slot"),
      text: el.textContent.trim(),
      focusVisible: el.matches(":focus-visible"),
      selected: el instanceof HTMLInputElement ? [el.selectionStart, el.selectionEnd, el.value.length] : null,
    };
  });
}

test("診所詳情對話框：以鍵盤開啟時聚焦關閉鈕（不是「查看可約時段」連結），再按 Enter 是關閉", { skip: noChrome }, async () => {
  const { page, active } = await openWithKeyboard("clinic-detail");
  // 前提：對話框內關閉鈕之前確實有連結（預約、詳情、導航）
  const links = await page.$$eval('[role="dialog"] a[href]', (as) => as.map((a) => a.getAttribute("href")));
  assert.ok(links.includes("/booking/00000000-0000-4000-8000-000000000001"), JSON.stringify(links));
  assert.equal(active.tag, "BUTTON", JSON.stringify(active));
  assert.equal(active.slot, "dialog-close", JSON.stringify(active));
  assert.equal(active.text, "Close");
  assert.equal(active.focusVisible, true, "鍵盤開啟時關閉鈕顯示焦點框（與舊版相同）");

  await page.keyboard.press("Enter");
  const after = await closeAndDescribe(page);
  assert.equal(new URL(page.url()).pathname, "/", "Enter 應關閉對話框而不是導到預約頁");
  // 沒有 Trigger（由卡片按鈕受控開啟）：舊版關閉後焦點落到 body，不回到開啟它的按鈕
  assert.equal(after.tag, "BODY", JSON.stringify(after));
  await page.close();
});

test("分享對話框：聚焦第一個非連結元素（唯讀網址欄）並全選", { skip: noChrome }, async () => {
  const { page, active } = await openWithKeyboard("share");
  assert.equal(active.tag, "INPUT", JSON.stringify(active));
  assert.equal(active.selected[0], 0);
  assert.equal(active.selected[1], active.selected[2]);
  await page.close();
});

test("略過 disabled、hidden、type=hidden、display:none 與連結；input 全選", { skip: noChrome }, async () => {
  const { page, active } = await openWithKeyboard("skips-unfocusable");
  assert.equal(active.id, "text-input", JSON.stringify(active));
  assert.deepEqual(active.selected, [0, 5, 5]);
  await page.close();
});

test("只有連結時聚焦內容容器本身（Radix 的 fallback）", { skip: noChrome }, async () => {
  const { page, active } = await openWithKeyboard("links-only");
  assert.equal(active.slot, "dialog-content", JSON.stringify(active));
  await page.close();
});

test("Sheet 套用同一規則：略過連結聚焦按鈕", { skip: noChrome }, async () => {
  const { page, active } = await openWithKeyboard("sheet");
  assert.equal(active.id, "sheet-button", JSON.stringify(active));
  await page.close();
});

test("呼叫端的 onOpenAutoFocus preventDefault 時不自動聚焦", { skip: noChrome }, async () => {
  const { page, active } = await openWithKeyboard("prevented");
  assert.equal(active.id, "trigger", JSON.stringify(active));
  await page.close();
});

test("內容裡已有元素自行聚焦時不搶焦點", { skip: noChrome }, async () => {
  const { page, active } = await openWithKeyboard("self-focused");
  assert.equal(active.id, "self-focus-input", JSON.stringify(active));
  await page.close();
});

test("有 Trigger 的對話框：Esc 關閉後焦點回到 Trigger", { skip: noChrome }, async () => {
  const { page } = await openWithKeyboard("trigger-dialog");
  await page.keyboard.press("Escape");
  const after = await closeAndDescribe(page);
  assert.equal(after.id, "trigger", JSON.stringify(after));
  await page.close();
});

test("有 Trigger 的 Sheet：按關閉鈕後焦點回到 Trigger", { skip: noChrome }, async () => {
  const { page, active } = await openWithKeyboard("trigger-sheet");
  assert.equal(active.slot, "sheet-close", JSON.stringify(active));
  await page.keyboard.press("Enter");
  const after = await closeAndDescribe(page);
  assert.equal(after.id, "trigger", JSON.stringify(after));
  await page.close();
});

test("由外部按鈕開啟、另有 Trigger：關閉後聚焦 Trigger（Radix），不是開啟前的焦點（Bits 預設）", { skip: noChrome }, async () => {
  const { page } = await openWithKeyboard("external-with-trigger");
  await page.keyboard.press("Escape");
  const after = await closeAndDescribe(page);
  assert.equal(after.id, "dialog-trigger", JSON.stringify(after));
  await page.close();
});

test("呼叫端的 onCloseAutoFocus preventDefault 時關閉後不移動焦點", { skip: noChrome }, async () => {
  const { page } = await openWithKeyboard("trigger-close-prevented");
  await page.keyboard.press("Escape");
  const after = await closeAndDescribe(page);
  assert.equal(after.tag, "BODY", JSON.stringify(after));
  await page.close();
});

// 確認對話框（AlertDialog）與舊版 Radix AlertDialog 相同：開啟時聚焦「取消」鈕（Bits UI 預設聚焦內容容器），
// 關閉時同 Dialog 規則（只還給自己的 Trigger，沒有就落到 body）；點遮罩不關閉
test("確認對話框：以鍵盤開啟時聚焦「取消」鈕（Radix AlertDialog），Enter 即取消並關閉，焦點落到 body", { skip: noChrome }, async () => {
  const { page, active } = await openWithKeyboard("alert-dialog", "alertdialog");
  assert.equal(active.id, "alert-cancel", JSON.stringify(active));
  assert.equal(active.focusVisible, true, "鍵盤開啟時取消鈕顯示焦點框（與舊版相同）");
  await page.keyboard.press("Enter");
  const after = await closeAndDescribe(page, "alertdialog");
  assert.equal(after.tag, "BODY", JSON.stringify(after));
  await page.close();
});

test("確認對話框：Action 不自動關閉（呼叫端自行處理）；點遮罩不關閉；Esc 關閉", { skip: noChrome }, async () => {
  const { page } = await openWithKeyboard("alert-dialog", "alertdialog");
  await page.click("#alert-action");
  await page.mouse.click(5, 5);
  await page.waitForTimeout(150);
  assert.equal(await page.locator('[role="alertdialog"][data-state="open"]').count(), 1);
  await page.keyboard.press("Escape");
  const after = await closeAndDescribe(page, "alertdialog");
  assert.equal(after.tag, "BODY", JSON.stringify(after));
  await page.close();
});

test("有 Trigger 的確認對話框：開啟聚焦取消鈕，Esc 關閉後焦點回到 Trigger", { skip: noChrome }, async () => {
  const { page, active } = await openWithKeyboard("trigger-alert-dialog", "alertdialog");
  assert.equal(active.id, "alert-cancel", JSON.stringify(active));
  await page.keyboard.press("Escape");
  const after = await closeAndDescribe(page, "alertdialog");
  assert.equal(after.id, "trigger", JSON.stringify(after));
  await page.close();
});

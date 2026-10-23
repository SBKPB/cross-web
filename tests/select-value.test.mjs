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

// 共用 Select 收合時的顯示文字要與舊版（Radix）相同：
// - 值對得到選項：顯示選項文字；值是空字串：顯示 placeholder（沒給就空白）
// - 值對不到任何選項（例如網址帶進 /search?city=台北市、level=bogus）：Radix 顯示空白；
//   Bits UI 預設會把原始值當文字顯示，所以共用 SelectValue 要改成空白。
// 用 vite 把 support/select-value（掛真正的共用 ui/select 元件）建置成靜態頁，再用系統 Chrome 讀文字。
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const HARNESS = fileURLToPath(new URL("./support/select-value/", import.meta.url));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

const noChrome = existsSync(CHROME) ? false : `找不到 Chrome：${CHROME}`;

let outDir;
let server;
let origin;
let browser;

before(async () => {
  if (noChrome) return;
  outDir = await mkdtemp(join(tmpdir(), "select-value-"));
  await build({
    configFile: false,
    root: HARNESS,
    logLevel: "error",
    plugins: [svelte({ configFile: false, preprocess: vitePreprocess() })],
    resolve: { alias: { "#lib": join(ROOT, "src/lib") } },
    build: { outDir, emptyOutDir: true, minify: false },
  });
  server = createServer(async (req, res) => {
    const path = normalize(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
    try {
      const body = await readFile(join(outDir, path));
      res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
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

const shown = (page, id) => page.locator(`#${id} [data-slot="select-value"]`).textContent().then((t) => t.trim());

test("SelectValue：對得到選項顯示選項文字、空值顯示 placeholder、對不到選項顯示空白（同 Radix）", { skip: noChrome }, async () => {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error));
  try {
    await page.goto(origin);
    await page.waitForSelector("#custom [data-slot=select-value]");
    assert.equal(await shown(page, "valid"), "診所");
    assert.equal(await shown(page, "same-label"), "臺北市");
    assert.equal(await shown(page, "invalid"), "");
    assert.equal(await shown(page, "empty"), "");
    assert.equal(await shown(page, "empty-placeholder"), "請選擇");
    assert.equal(await shown(page, "invalid-placeholder"), "");
    // 呼叫端自帶 children 時照用
    assert.equal(await shown(page, "custom"), "自訂：台北市");
    // 外部改成有效值後顯示選項文字
    assert.equal(await shown(page, "changeable"), "");
    await page.click("#fix");
    await page.waitForFunction(() => document.querySelector("#changeable [data-slot=select-value]").textContent.trim() === "全部縣市");
    assert.deepEqual(errors, [], "頁面不應有錯誤");
  } finally {
    await page.close();
  }
});

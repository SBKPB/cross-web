import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { chromium } from "playwright-core";
import { BYPASS_HEADER, BYPASS_PERMISSIONS, routeBypass } from "../scripts/parity/bypass.mjs";
import { buildProblem, CHROME, startPreview } from "./support/built-app.mjs";

// 既有使用者主題偏好（Review Focus 2）：localStorage.theme 已存的值必須在首屏就套用，
// 不能等 hydration 才切換（否則深色使用者會先閃一下白）。
// 對 `pnpm build` 的產物跑 `vite preview`（產物不存在或比來源舊就明確失敗）；設 THEME_TEST_URL 則改打該網址（例如 preview 部署）。
const PORT = Number(process.env.THEME_TEST_PORT ?? 4319);
const REMOTE = process.env.THEME_TEST_URL;
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

const noChrome = existsSync(CHROME) ? false : `找不到 Chrome：${CHROME}`;
const problem = REMOTE ? null : buildProblem();

let preview;
let browser;
let base;

before(async () => {
  if (noChrome) return;
  browser = await chromium.launch({ executablePath: CHROME });
  if (REMOTE) base = new URL(REMOTE).origin;
  else if (!problem) {
    preview = await startPreview(PORT);
    base = preview.origin;
  }
});

after(async () => {
  await browser?.close();
  preview?.stop();
});

/** 測試用 context：bypass 密鑰只帶給受測站台 origin（與 screenshot.mjs 同一套做法，見 bypass.mjs） */
async function newContext(origin, secret, options = {}) {
  const context = await browser.newContext({ ...options, permissions: BYPASS_PERMISSIONS });
  if (secret) await routeBypass(context, origin, secret);
  return context;
}

// [localStorage.theme, 系統偏好, 預期是否為深色]；系統偏好刻意與儲存值相反，證明是儲存值生效
const CASES = [
  ["dark", "light", true],
  ["light", "dark", false],
  ["system", "dark", true],
];

for (const [stored, colorScheme, expectDark] of CASES) {
  test(
    `localStorage.theme=${stored}（系統 ${colorScheme}）首屏即${expectDark ? "" : "不"}套用 .dark`,
    { skip: noChrome },
    async () => {
      if (problem) assert.fail(problem);
      const context = await newContext(base, BYPASS, { colorScheme });
      const page = await context.newPage();
      await page.goto(`${base}/`);
      await page.evaluate((t) => localStorage.setItem("theme", t), stored);

      // 記錄 <body> 剛插入時（首次可繪製前）與 DOMContentLoaded 時 <html> 的 dark class 與 color-scheme
      await page.addInitScript(() => {
        // init script 執行時 documentElement 可能還不存在，故觀察 document 本身
        const snapshot = () => ({
          dark: document.documentElement.classList.contains("dark"),
          colorScheme: document.documentElement.style.colorScheme,
        });
        const observer = new MutationObserver(() => {
          if (document.body) {
            window.atBody = snapshot();
            observer.disconnect();
          }
        });
        observer.observe(document, { childList: true, subtree: true });
        document.addEventListener("DOMContentLoaded", () => {
          window.atDCL = snapshot();
        });
      });
      // 擋掉 SvelteKit 的 client JS：只靠 <head> 內同步腳本也必須正確，證明不依賴 hydration
      await page.route("**/_app/immutable/**", (route) => route.abort());

      await page.reload();
      const result = await page.evaluate(() => ({ atBody: window.atBody, atDCL: window.atDCL }));
      // color-scheme 決定原生表單元件、捲軸的配色；淺色偏好在系統深色時也必須是 light
      const expected = { dark: expectDark, colorScheme: expectDark ? "dark" : "light" };
      assert.deepEqual(result, { atBody: expected, atDCL: expected });
      await context.close();
    },
  );
}

// 受測站轉址到第三方時，密鑰不能跟著轉址送出（route.continue 的標頭覆寫會沿用到轉址後的請求）
test("bypass 密鑰只送受測站：302 到第三方本地 server 時第三方收不到", { skip: noChrome }, async () => {
  const SECRET = "theme-test-secret";
  const seen = { target: [], third: [] };
  const listen = async (handler) => {
    const server = createServer(handler);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    return { server, origin: `http://127.0.0.1:${server.address().port}` };
  };
  const third = await listen((req, res) => {
    seen.third.push({ path: req.url, bypass: req.headers[BYPASS_HEADER] });
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end("<!doctype html><h1>第三方</h1>");
  });
  const target = await listen((req, res) => {
    seen.target.push({ path: req.url, bypass: req.headers[BYPASS_HEADER] });
    res.writeHead(302, { location: `${third.origin}/landing` }).end();
  });
  try {
    const context = await newContext(target.origin, SECRET);
    const page = await context.newPage();
    await page.goto(`${target.origin}/`);
    assert.equal(page.url(), `${third.origin}/landing`);
    await context.close();
    assert.deepEqual(seen.target, [{ path: "/", bypass: SECRET }]);
    assert.ok(seen.third.some((r) => r.path === "/landing"), JSON.stringify(seen.third));
    assert.ok(seen.third.every((r) => r.bypass === undefined), `第三方收到密鑰：${JSON.stringify(seen.third)}`);
  } finally {
    target.server.close();
    third.server.close();
  }
});

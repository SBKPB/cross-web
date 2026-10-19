import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { after, before, test } from "node:test";
import { chromium } from "playwright-core";

// 既有使用者主題偏好（Review Focus 2）：localStorage.theme 已存的值必須在首屏就套用，
// 不能等 hydration 才切換（否則深色使用者會先閃一下白）。
// 對 `pnpm build` 的產物跑 `vite preview`；設 THEME_TEST_URL 則改打該網址（例如 preview 部署）。
const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = Number(process.env.THEME_TEST_PORT ?? 4319);
const BASE = process.env.THEME_TEST_URL ?? `http://localhost:${PORT}`;
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

const missing = !existsSync(CHROME)
  ? `找不到 Chrome：${CHROME}`
  : !process.env.THEME_TEST_URL && !existsSync(".svelte-kit/output/client")
    ? "沒有建置產物，請先執行 pnpm build"
    : null;

let server;
let browser;

before(async () => {
  if (missing) return;
  if (!process.env.THEME_TEST_URL) {
    server = spawn("pnpm", ["exec", "vite", "preview", "--port", String(PORT), "--strictPort"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("vite preview 啟動逾時")), 30_000);
      server.stdout.on("data", (chunk) => {
        if (String(chunk).includes(`${PORT}`)) {
          clearTimeout(timer);
          resolve();
        }
      });
      server.on("exit", (code) => reject(new Error(`vite preview 結束（${code}）`)));
    });
  }
  browser = await chromium.launch({ executablePath: CHROME });
});

after(async () => {
  await browser?.close();
  server?.kill();
});

// [localStorage.theme, 系統偏好, 預期是否為深色]；系統偏好刻意與儲存值相反，證明是儲存值生效
const CASES = [
  ["dark", "light", true],
  ["light", "dark", false],
  ["system", "dark", true],
];

for (const [stored, colorScheme, expectDark] of CASES) {
  test(
    `localStorage.theme=${stored}（系統 ${colorScheme}）首屏即${expectDark ? "" : "不"}套用 .dark`,
    { skip: missing ?? false },
    async () => {
      const context = await browser.newContext({ colorScheme });
      if (BYPASS) {
        // bypass 密鑰只帶給受測站台本身，不能用 extraHTTPHeaders（會一併送往 Google Fonts 等第三方）
        await context.route(`${new URL(BASE).origin}/**`, (route) =>
          route.continue({
            headers: { ...route.request().headers(), "x-vercel-protection-bypass": BYPASS },
          }),
        );
      }
      const page = await context.newPage();
      await page.goto(`${BASE}/`);
      await page.evaluate((t) => localStorage.setItem("theme", t), stored);

      // 記錄 <body> 剛插入時（首次可繪製前）與 DOMContentLoaded 時 <html> 的 dark class
      await page.addInitScript(() => {
        // init script 執行時 documentElement 可能還不存在，故觀察 document 本身
        const isDark = () => document.documentElement.classList.contains("dark");
        const observer = new MutationObserver(() => {
          if (document.body) {
            window.atBody = isDark();
            observer.disconnect();
          }
        });
        observer.observe(document, { childList: true, subtree: true });
        document.addEventListener("DOMContentLoaded", () => {
          window.atDCL = isDark();
        });
      });
      // 擋掉 SvelteKit 的 client JS：只靠 <head> 內同步腳本也必須正確，證明不依賴 hydration
      await page.route("**/_app/immutable/**", (route) => route.abort());

      await page.reload();
      const result = await page.evaluate(() => ({ atBody: window.atBody, atDCL: window.atDCL }));
      assert.deepEqual(result, { atBody: expectDark, atDCL: expectDark });
      await context.close();
    },
  );
}

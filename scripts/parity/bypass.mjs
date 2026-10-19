// Vercel Deployment Protection 的 automation bypass：密鑰只能送往受測站台（預覽）本身。
// - 不用 extraHTTPHeaders：會一併送往 Google Fonts 等第三方。
// - 不用 route.continue({ headers })：覆寫的標頭會沿用到轉址後的請求，受測站 302 到第三方時密鑰跟著外洩。
// 做法：只攔 origin 相同的請求，用 route.fetch({ maxRedirects: 0 }) 自己發、route.fulfill 交回；
// 轉址回應原樣交給瀏覽器重新發請求，每一跳再由這個條件決定是否帶密鑰。
// route.fulfill 回應的頁面會被 Chrome 視為公網來源，連 loopback（本機站台、測試伺服器）會被 Local Network Access
// 擋下，所以 context 必須帶 BYPASS_PERMISSIONS。
// screenshot.mjs 與 tests/theme.test.mjs 共用。

export const BYPASS_HEADER = "x-vercel-protection-bypass";
export const BYPASS_PERMISSIONS = ["local-network-access"];

/**
 * @param {import("playwright-core").BrowserContext} context
 * @param {string} origin 受測站台來源（只有這個來源的請求帶密鑰）
 * @param {string} secret
 * @param {{ onError?: (url: string) => void }} [options] 請求失敗時的回呼；錯誤物件的 call log 會列出所有請求標頭（含密鑰），只給網址
 */
export async function routeBypass(context, origin, secret, { onError } = {}) {
  await context.route(
    (url) => url.origin === origin,
    async (route) => {
      const headers = { ...route.request().headers(), [BYPASS_HEADER]: secret };
      try {
        await route.fulfill({ response: await route.fetch({ headers, maxRedirects: 0 }) });
      } catch {
        onError?.(route.request().url());
        await route.abort().catch(() => {});
      }
    },
  );
}

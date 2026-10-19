// 截圖比對：每條路由以 淺色 1280／深色 1280／淺色 375 三種情境，各截「基準」與「預覽」整頁圖，
// 存到 <out>/<群組>/<路由>.<情境>.{base,preview,diff}.png，並印出像素差異比例（供人工確認）。
//
// 用法：node scripts/parity/screenshot.mjs --preview <url> [--base <url>] [--group <群組>] [--out <資料夾>] [--routes <檔案>]
// - auth 路由需設 PARITY_TOKEN（access token），可再設 PARITY_REFRESH_TOKEN；只注入基準與預覽來源的
//   localStorage.access_token／refresh_token。沒設 PARITY_TOKEN 就略過。
// - 最後停留的路徑和要求的不同（例如 token 過期被導去 /auth）就列為錯誤，不算差異比例。
// - 預覽受 Vercel Deployment Protection 保護時設 VERCEL_AUTOMATION_BYPASS_SECRET；密鑰只加在送往預覽來源的請求，
//   不用 extraHTTPHeaders（會送往 Google Fonts 等第三方），也不用 route.continue（標頭會沿用到跨來源轉址）。
// - 像素比對在瀏覽器的 canvas 裡做，不另裝影像套件。
// - --routes 預設為同資料夾的 routes.json（測試用來換成假路由）。
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { chromium } from "playwright-core";

const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const { values: args } = parseArgs({
  options: {
    base: { type: "string", default: "http://localhost:3100" },
    preview: { type: "string" },
    group: { type: "string" },
    routes: { type: "string", default: fileURLToPath(new URL("./routes.json", import.meta.url)) },
    out: { type: "string", default: fileURLToPath(new URL("./out", import.meta.url)) },
  },
});
if (!args.preview) {
  console.error(
    "用法：node scripts/parity/screenshot.mjs --preview <url> [--base <url>] [--group <群組>] [--out <資料夾>] [--routes <檔案>]",
  );
  process.exit(2);
}
const routes = JSON.parse(readFileSync(args.routes, "utf8"));
if (args.group && !routes[args.group]) {
  console.error(`routes.json 沒有群組「${args.group}」`);
  process.exit(2);
}
const base = new URL(args.base).origin;
const preview = new URL(args.preview).origin;
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const TOKEN = process.env.PARITY_TOKEN;
const REFRESH = process.env.PARITY_REFRESH_TOKEN;
// 錯誤訊息可能夾帶請求標頭（Playwright 的 call log），印出前遮掉密鑰與 token
const redact = (text) => [BYPASS, TOKEN, REFRESH].reduce((t, v) => (v ? t.replaceAll(v, "***") : t), text);

const VARIANTS = [
  ["light", { viewport: { width: 1280, height: 800 }, colorScheme: "light" }],
  ["dark", { viewport: { width: 1280, height: 800 }, colorScheme: "dark" }],
  ["375", { viewport: { width: 375, height: 812 }, colorScheme: "light" }],
];
// 單一色版差超過此值才算不同，吸收漸層抖色等雜訊
const TOLERANCE = 8;

const browser = await chromium.launch({ executablePath: CHROME });

async function shot(origin, path, variant, options, auth) {
  // route.fulfill 回應的頁面會被 Chrome 視為公網來源，連 loopback（本機基準、測試用伺服器）會被
  // Local Network Access 擋下，所以允許 local-network-access
  const context = await browser.newContext({
    ...options,
    deviceScaleFactor: 1,
    permissions: ["local-network-access"],
  });
  if (BYPASS) {
    // route.fetch 不跟隨轉址：轉址交回瀏覽器重新發請求，每一跳再由這個條件決定是否帶密鑰
    await context.route(
      (url) => url.origin === preview,
      async (route) => {
        const headers = { ...route.request().headers(), "x-vercel-protection-bypass": BYPASS };
        try {
          await route.fulfill({ response: await route.fetch({ headers, maxRedirects: 0 }) });
        } catch {
          // 錯誤訊息的 call log 會列出所有請求標頭（含密鑰），只印網址
          console.log(`預覽請求失敗：${route.request().url()}`);
          await route.abort().catch(() => {});
        }
      },
    );
  }
  await context.addInitScript(
    ({ origins, theme, token, refresh }) => {
      if (!origins.includes(location.origin)) return;
      localStorage.setItem("theme", theme);
      if (token) localStorage.setItem("access_token", token);
      if (refresh) localStorage.setItem("refresh_token", refresh);
    },
    {
      origins: [base, preview],
      theme: variant === "dark" ? "dark" : "light",
      token: auth ? TOKEN : null,
      refresh: auth ? REFRESH : null,
    },
  );
  const page = await context.newPage();
  try {
    const res = await page.goto(origin + path, { waitUntil: "load" });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready.then(() => {}));
    const png = await page.screenshot({ fullPage: true, animations: "disabled" });
    // 伺服器或前端轉址（例如 token 失效導去 /auth）後的實際路徑
    const finalPath = new URL(page.url()).pathname;
    const moved = finalPath === new URL(path, origin).pathname ? null : finalPath;
    return { png, status: res?.status(), moved };
  } finally {
    await context.close();
  }
}

// 比對用的空白頁：圖片以 data: URL 載入，不會發任何網路請求
const diffPage = await (await browser.newContext()).newPage();
function pixelDiff(a, b) {
  return diffPage.evaluate(
    async ({ a, b, tolerance }) => {
      const load = async (b64) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        return img;
      };
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      // 尺寸不同時以較大者為準，超出的部分（透明 vs 有內容）算差異
      const w = Math.max(ia.width, ib.width);
      const h = Math.max(ia.height, ib.height);
      const pixels = (img) => {
        const ctx = new OffscreenCanvas(w, h).getContext("2d");
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, w, h).data;
      };
      const pa = pixels(ia);
      const pb = pixels(ib);
      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext("2d");
      const out = ctx.createImageData(w, h);
      let changed = 0;
      for (let i = 0; i < pa.length; i += 4) {
        let d = 0;
        for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(pa[i + c] - pb[i + c]));
        if (d > tolerance) {
          changed++;
          out.data.set([255, 0, 0, 255], i); // 不同：紅
        } else {
          const g = (pa[i] + pa[i + 1] + pa[i + 2]) / 3;
          out.data.set([g, g, g, 64], i); // 相同：淡化的基準圖
        }
      }
      ctx.putImageData(out, 0, 0);
      const blob = await canvas.convertToBlob({ type: "image/png" });
      const url = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      return { ratio: changed / (w * h), diff: url.slice(url.indexOf(",") + 1) };
    },
    { a: a.toString("base64"), b: b.toString("base64"), tolerance: TOLERANCE },
  );
}

const slug = (path) => decodeURIComponent(path).replace(/^\/+/, "").replace(/[^\p{L}\p{N}._-]+/gu, "_") || "index";

console.log(`基準 ${base} ↔ 預覽 ${preview}`);
let errors = 0;
for (const [group, list] of Object.entries(args.group ? { [args.group]: routes[args.group] } : routes)) {
  const dir = join(args.out, group);
  mkdirSync(dir, { recursive: true });
  console.log(`\n[${group}]`);
  for (const route of list) {
    if (route.auth && !TOKEN) {
      console.log(`${route.path}  略過（auth 路由需設 PARITY_TOKEN，最好也設 PARITY_REFRESH_TOKEN）`);
      continue;
    }
    for (const [variant, options] of VARIANTS) {
      try {
        const [b, p] = await Promise.all([
          shot(base, route.path, variant, options, route.auth),
          shot(preview, route.path, variant, options, route.auth),
        ]);
        if (b.moved || p.moved) {
          errors++;
          const to = (side, s) => `${side}${s.moved ? `轉址到 ${s.moved}` : "未轉址"}`;
          console.log(`${route.path}  ${variant.padEnd(5)}  → ${to("基準", b)}，${to("預覽", p)}`);
          continue;
        }
        const { ratio, diff } = await pixelDiff(b.png, p.png);
        const name = `${slug(route.path)}.${variant}`;
        writeFileSync(join(dir, `${name}.base.png`), b.png);
        writeFileSync(join(dir, `${name}.preview.png`), p.png);
        writeFileSync(join(dir, `${name}.diff.png`), Buffer.from(diff, "base64"));
        console.log(
          `${route.path}  ${variant.padEnd(5)}  ${(ratio * 100).toFixed(2)}%  (HTTP ${b.status}/${p.status})`,
        );
      } catch (e) {
        errors++;
        console.log(`${route.path}  ${variant.padEnd(5)}  失敗：${redact(e.message)}`);
      }
    }
  }
}
console.log(`\n截圖存於 ${args.out}`);
await browser.close();
process.exitCode = errors ? 1 : 0;

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { after, before, test } from "node:test";

// 比對工具（scripts/parity）本身的測試：用三個本機伺服器分別扮演「基準」「預覽」「第三方」，
// 驗證差異偵測，以及 bypass 密鑰只送往預覽來源（連轉址到第三方時也不帶）。
const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SECRET = "test-secret";
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
// 照抄 next@16.4.0 dist/shared/lib/router/utils/html-bots.js 的 HTML_LIMITED_BOT_UA_RE：
// Next 16 只對符合這個 regex 的 UA 關閉串流 metadata（server/lib/streaming-metadata.js），其他 UA（含 Googlebot）都可能串流到 <body>。
// 下方「以舊版 Next 實際函式驗證」的測試會比對這份副本與 ../web-next-ref 的原始碼是否一致。
const HTML_LIMITED_BOT_UA_RE =
  /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight/i;
const NEXT_REF = resolve(process.env.NEXT_REF_DIR ?? "../web-next-ref");
const seen = { base: [], preview: [], third: [] };
const origins = {};
let drift = false; // 開啟時預覽站在 static 四頁各製造一種差異
const servers = [];

function handler(side) {
  return (req, res) => {
    const self = origins[side];
    const path = req.url;
    seen[side].push({ path, bypass: req.headers["x-vercel-protection-bypass"], ua: req.headers["user-agent"] });
    if (side === "third") {
      if (path === "/font.css") return res.writeHead(200, { "content-type": "text/css" }).end("h1{color:#123}");
      return res.writeHead(200, { "content-type": "image/png" }).end(PNG);
    }
    if (path === "/redir-img") return res.writeHead(302, { location: `${origins.third}/img.png` }).end();
    if (path.startsWith("/opengraph-image")) return res.writeHead(200, { "content-type": "image/png" }).end(PNG);
    if (path === "/missing.png") return res.writeHead(404).end();
    // 永不回應：測 seo-diff 的逾時
    if (path === "/hang") return;
    // 連線直接中斷：讓預覽的 route.fetch 失敗（錯誤訊息的 call log 會列出所有請求標頭）
    if (path === "/boom.css" || (path === "/boom-doc" && side === "preview")) return req.socket.destroy();
    // 需登入頁：token 不對就像舊版／新版 app 一樣導去 /auth
    if (path === "/member") {
      return res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(`<!doctype html><html><head><script>
if (localStorage.getItem("access_token") !== "tok" || localStorage.getItem("refresh_token") !== "ref") location.replace("/auth");
</script></head><body style="margin:0;font:32px sans-serif"><h1>會員中心</h1></body></html>`);
    }

    const d = drift && side === "preview";
    // 基準與預覽的 og:image 網址刻意不同（R6：只比存在與否、能否取得）；預覽的會轉址到第三方
    let ogImage = side === "base" ? `${self}/opengraph-image?abc` : `${self}/redir-img`;
    if (d && path === "/pricing") ogImage = `${self}/missing.png`;
    const ld = { "@type": "WebPage", name: d && path === "/refund" ? "變了" : "條款" };
    // 同一個 og:url，預覽在 /refund 改用 name 屬性：比對要能分辨 property 與 name
    const ogUrlAttr = d && path === "/refund" ? "name" : "property";
    const meta = `<title>${d && path === "/terms" ? "不同標題" : "條款 &amp; 規範"} | Cross</title>
<meta name="description" content="說明 &quot;引號&quot;">
<link rel="canonical" href="${self}${path}">
${d && path === "/terms" ? "" : `<meta property="og:title" content="條款">`}
<meta ${ogUrlAttr}="og:url" content="${self}${path}">
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="summary">`;
    // 模擬 Next 16 的串流 metadata：基準只對 HTML-limited bot UA 把 metadata 放在 <head>，
    // 其他 UA（一般瀏覽器、Googlebot）一律串流到 <body>；預覽（SvelteKit）不論 UA 都在 <head>
    const metaInHead = side !== "base" || HTML_LIMITED_BOT_UA_RE.test(req.headers["user-agent"] ?? "");
    const html = `<!doctype html><html><head>
${metaInHead ? meta : ""}
<link rel="stylesheet" href="${origins.third}/font.css">
${path === "/sub-fail" ? `<link rel="stylesheet" href="${self}/boom.css">` : ""}
</head><body style="margin:0;font:32px sans-serif">
${metaInHead ? "" : meta}
<h1>${d && path === "/terms" ? "完全不同的內容" : "服務條款"}</h1>
<img src="${self}/redir-img" width="40" height="40">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</body></html>`;
    res.writeHead(d && path === "/privacy" ? 404 : 200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
  };
}

before(async () => {
  for (const side of ["base", "preview", "third"]) {
    const server = createServer(handler(side));
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    origins[side] = `http://127.0.0.1:${server.address().port}`;
    servers.push(server);
  }
});

after(() => servers.forEach((s) => s.close()));

// killAfter：子行程最多跑多久（卡住時強制結束，測試檔才不會跟著卡住）
function run(script, args, env = {}, killAfter = 180_000) {
  for (const list of Object.values(seen)) list.length = 0;
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [`scripts/parity/${script}`, "--base", origins.base, "--preview", origins.preview, ...args],
      { env: { ...process.env, VERCEL_AUTOMATION_BYPASS_SECRET: SECRET, ...env }, timeout: killAfter },
      (err, stdout, stderr) => resolve({ code: err ? err.code : 0, stdout, stderr }),
    );
  });
}

function assertBypassScoped() {
  assert.ok(seen.preview.length > 0, "預覽站應收到請求");
  assert.ok(
    seen.preview.every((r) => r.bypass === SECRET),
    `預覽站每個請求都要帶密鑰：${JSON.stringify(seen.preview)}`,
  );
  assert.ok(seen.third.some((r) => r.path === "/img.png"), "應有轉址到第三方的請求");
  for (const side of ["base", "third"]) {
    assert.ok(
      seen[side].every((r) => r.bypass === undefined),
      `${side} 不得收到密鑰：${JSON.stringify(seen[side])}`,
    );
  }
}

test("fixture：基準對一般 UA 與 Googlebot 把 metadata 串流到 <body>，只有 HTML-limited bot 放在 <head>", async () => {
  const placement = async (ua) => {
    const html = await (await fetch(`${origins.base}/terms`, { headers: { "user-agent": ua } })).text();
    const head = html.slice(0, html.search(/<\/head>/i));
    return head.includes("<title>") ? "head" : "body";
  };
  assert.equal(await placement(GOOGLEBOT), "body");
  assert.equal(await placement("Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36"), "body");
  assert.equal(await placement("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"), "head");
});

test("seo-diff：內容相同（圖片網址不同）→ 0 差異，密鑰只送預覽來源，兩邊都用 HTML-limited bot UA", async () => {
  drift = false;
  const { code, stdout, stderr } = await run("seo-diff.mjs", ["--group", "static"]);
  assert.equal(code, 0, stdout + stderr);
  for (const p of ["/terms", "/privacy", "/refund", "/pricing"]) assert.match(stdout, new RegExp(`✓ ${p}\\b`));
  assertBypassScoped();
  for (const side of ["base", "preview"]) {
    assert.ok(seen[side].length > 0);
    assert.ok(
      seen[side].every((r) => HTML_LIMITED_BOT_UA_RE.test(r.ua ?? "")),
      `${side} 收到不在 HTML-limited bot 清單的 UA：${JSON.stringify(seen[side])}`,
    );
  }
});

// 直接拿舊版 Next 的判定函式驗證：seo-diff 實際送出的 UA 必須讓 Next 關閉串流 metadata；
// 同時確認 fixture 的 regex 副本與 Next 原始碼一致（Next 升級改清單時這裡會失敗）
const streamingMetadataJs = join(NEXT_REF, "node_modules/next/dist/server/lib/streaming-metadata.js");
test("seo-diff 的 UA 經舊版 Next 判定為不串流 metadata（Googlebot 則會串流）", {
  skip: existsSync(streamingMetadataJs) ? false : `找不到舊版 Next：${streamingMetadataJs}（可設 NEXT_REF_DIR）`,
}, async () => {
  const require = createRequire(streamingMetadataJs);
  const { shouldServeStreamingMetadata } = require(streamingMetadataJs);
  const { HTML_LIMITED_BOT_UA_RE: nextRe } = require("../../shared/lib/router/utils/html-bots.js");
  assert.equal(HTML_LIMITED_BOT_UA_RE.source, nextRe.source, "fixture 的 regex 副本與 Next 不一致");
  assert.equal(HTML_LIMITED_BOT_UA_RE.flags, nextRe.flags);

  drift = false;
  const { code, stdout, stderr } = await run("seo-diff.mjs", ["--group", "static"]);
  assert.equal(code, 0, stdout + stderr);
  const uas = new Set([...seen.base, ...seen.preview].map((r) => r.ua));
  assert.equal(uas.size, 1, `seo-diff 應只用一種 UA：${[...uas].join(" | ")}`);
  const [ua] = uas;
  assert.equal(shouldServeStreamingMetadata(ua, undefined), false, `Next 會對「${ua}」串流 metadata`);
  assert.equal(shouldServeStreamingMetadata(GOOGLEBOT, undefined), true, "Googlebot 在 Next 16 應會串流 metadata");
});

test("seo-diff：偵測標籤缺漏、屬性不同、狀態碼、JSON-LD 與取不到的分享圖", async () => {
  drift = true;
  const { code, stdout } = await run("seo-diff.mjs", ["--group", "static"]);
  assert.equal(code, 1, stdout);
  assert.match(stdout, /✗ \/terms[\s\S]*- property:og:title=條款/);
  assert.match(stdout, /- title=條款 & 規範 \| Cross/);
  assert.match(stdout, /✗ \/privacy[\s\S]*\+ HTTP=404/);
  assert.match(stdout, /✗ \/refund[\s\S]*JSON-LD[\s\S]*變了/);
  assert.match(stdout, /✗ \/refund[\s\S]*- property:og:url=https:\/\/cross\.twinhao\.com\/refund/);
  assert.match(stdout, /✗ \/refund[\s\S]*\+ name:og:url=https:\/\/cross\.twinhao\.com\/refund/);
  assert.match(stdout, /✗ \/pricing[\s\S]*og:image[\s\S]*404/);
  assertBypassScoped();
});

// 沒有逾時的話 /hang 會讓 seo-diff 永遠卡住；test 自己的 timeout 讓這種退化變成失敗而不是卡死
test("seo-diff：抓取逾時印出路由並以非 0 結束，其他路由照常比對", { timeout: 20_000 }, async () => {
  drift = false;
  const dir = mkdtempSync(join(tmpdir(), "parity-"));
  try {
    writeFileSync(join(dir, "routes.json"), JSON.stringify({ t: [{ path: "/hang" }, { path: "/terms" }] }));
    const started = Date.now();
    const { code, stdout } = await run(
      "seo-diff.mjs",
      ["--routes", join(dir, "routes.json")],
      { PARITY_FETCH_TIMEOUT_MS: "300" },
      15_000,
    );
    assert.equal(code, 1, stdout);
    assert.match(stdout, /✗ \/hang\n\s+.*逾時/);
    assert.match(stdout, /✓ \/terms/);
    assert.ok(Date.now() - started < 15_000, "逾時後不應卡住");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("比對工具頂部註解寫明 auth 路由是 local-vs-local（3101 ↔ 本地 preview，皆接 8001）", () => {
  for (const script of ["seo-diff.mjs", "screenshot.mjs"]) {
    const header = readFileSync(`scripts/parity/${script}`, "utf8").split("\nimport ")[0];
    for (const needle of ["--target-local", "local-vs-local", "http://localhost:3101", "http://localhost:8001", "pnpm preview"]) {
      assert.ok(header.includes(needle), `${script} 頂部註解缺「${needle}」`);
    }
  }
});

test("screenshot：三種情境各存基準／預覽／差異圖，算出像素差異，密鑰只送預覽來源", {
  skip: existsSync(CHROME) ? false : `找不到 Chrome：${CHROME}`,
}, async () => {
  drift = true;
  const out = mkdtempSync(join(tmpdir(), "parity-"));
  try {
    const { code, stdout, stderr } = await run("screenshot.mjs", ["--group", "static", "--out", out]);
    assert.equal(code, 0, stdout + stderr);
    const files = readdirSync(join(out, "static"));
    assert.equal(files.length, 4 * 3 * 3, files.join("\n"));
    for (const v of ["light", "dark", "375"]) {
      for (const kind of ["base", "preview", "diff"]) {
        const png = readFileSync(join(out, "static", `terms.${v}.${kind}.png`));
        assert.equal(png.subarray(1, 4).toString(), "PNG");
      }
      assert.ok(Number(stdout.match(new RegExp(`/terms\\s+${v}\\s+([\\d.]+)%`))[1]) > 0, stdout);
      assert.match(stdout, new RegExp(`/refund\\s+${v}\\s+0\\.00%`));
      assert.match(stdout, new RegExp(`/privacy\\s+${v}\\s+0\\.00%.*200/404`));
    }
    assertBypassScoped();
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// 用暫存的 routes.json 跑 screenshot，回傳執行結果
async function screenshotWith(routes, env) {
  const dir = mkdtempSync(join(tmpdir(), "parity-"));
  try {
    writeFileSync(join(dir, "routes.json"), JSON.stringify(routes));
    return await run("screenshot.mjs", ["--routes", join(dir, "routes.json"), "--out", dir], env);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("screenshot：預覽請求失敗時只印網址，密鑰不會出現在輸出", {
  skip: existsSync(CHROME) ? false : `找不到 Chrome：${CHROME}`,
}, async () => {
  drift = false;
  const { code, stdout, stderr } = await screenshotWith({
    broken: [
      { path: "/sub-fail", auth: false },
      { path: "/boom-doc", auth: false },
    ],
  });
  assert.ok(!(stdout + stderr).includes(SECRET), `輸出含密鑰：\n${stdout}\n${stderr}`);
  assert.equal(code, 1, stdout + stderr);
  assert.ok(seen.preview.some((r) => r.path === "/boom.css" && r.bypass === SECRET), "預覽應收到 /boom.css");
  assert.match(stdout, new RegExp(`預覽請求失敗：${origins.preview}/boom\\.css`));
  assert.match(stdout, new RegExp(`預覽請求失敗：${origins.preview}/boom-doc`));
  for (const v of ["light", "dark", "375"]) {
    assert.match(stdout, new RegExp(`/sub-fail\\s+${v}\\s+[\\d.]+%`));
    assert.match(stdout, new RegExp(`/boom-doc\\s+${v}\\s+失敗`));
  }
});

test("screenshot：auth 路由注入 access／refresh token，被導去別頁時列為錯誤", {
  skip: existsSync(CHROME) ? false : `找不到 Chrome：${CHROME}`,
}, async () => {
  drift = false;
  const routes = { auth: [{ path: "/member", auth: true }] };
  const ok = await screenshotWith(routes, { PARITY_TOKEN: "tok", PARITY_REFRESH_TOKEN: "ref" });
  assert.equal(ok.code, 0, ok.stdout + ok.stderr);
  for (const v of ["light", "dark", "375"]) assert.match(ok.stdout, new RegExp(`/member\\s+${v}\\s+0\\.00%`));
  assert.doesNotMatch(ok.stdout, /轉址/);

  // token 過期／無效：兩邊都導去 /auth，截圖會一模一樣，必須報錯而不是 0.00%
  const bad = await screenshotWith(routes, { PARITY_TOKEN: "expired", PARITY_REFRESH_TOKEN: "ref" });
  assert.equal(bad.code, 1, bad.stdout + bad.stderr);
  for (const v of ["light", "dark", "375"]) {
    assert.match(bad.stdout, new RegExp(`/member\\s+${v}\\s+→ 基準轉址到 /auth，預覽轉址到 /auth`));
  }
  assert.doesNotMatch(bad.stdout, /\/member\s+\S+\s+[\d.]+%/);
});

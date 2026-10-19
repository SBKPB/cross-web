import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

const seen = { base: [], preview: [], third: [] };
const origins = {};
let drift = false; // 開啟時預覽站在 static 四頁各製造一種差異
const servers = [];

function handler(side) {
  return (req, res) => {
    const self = origins[side];
    const path = req.url;
    seen[side].push({ path, bypass: req.headers["x-vercel-protection-bypass"] });
    if (side === "third") {
      if (path === "/font.css") return res.writeHead(200, { "content-type": "text/css" }).end("h1{color:#123}");
      return res.writeHead(200, { "content-type": "image/png" }).end(PNG);
    }
    if (path === "/redir-img") return res.writeHead(302, { location: `${origins.third}/img.png` }).end();
    if (path.startsWith("/opengraph-image")) return res.writeHead(200, { "content-type": "image/png" }).end(PNG);
    if (path === "/missing.png") return res.writeHead(404).end();

    const d = drift && side === "preview";
    // 基準與預覽的 og:image 網址刻意不同（R6：只比存在與否、能否取得）；預覽的會轉址到第三方
    let ogImage = side === "base" ? `${self}/opengraph-image?abc` : `${self}/redir-img`;
    if (d && path === "/pricing") ogImage = `${self}/missing.png`;
    const ld = { "@type": "WebPage", name: d && path === "/refund" ? "變了" : "條款" };
    const html = `<!doctype html><html><head>
<title>${d && path === "/terms" ? "不同標題" : "條款 &amp; 規範"} | Cross</title>
<meta name="description" content="說明 &quot;引號&quot;">
<link rel="canonical" href="${self}${path}">
${d && path === "/terms" ? "" : `<meta property="og:title" content="條款">`}
<meta property="og:url" content="${self}${path}">
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="${origins.third}/font.css">
</head><body style="margin:0;font:32px sans-serif">
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

function run(script, args) {
  for (const list of Object.values(seen)) list.length = 0;
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [`scripts/parity/${script}`, "--base", origins.base, "--preview", origins.preview, ...args],
      { env: { ...process.env, VERCEL_AUTOMATION_BYPASS_SECRET: SECRET } },
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

test("seo-diff：內容相同（圖片網址不同）→ 0 差異，密鑰只送預覽來源", async () => {
  drift = false;
  const { code, stdout, stderr } = await run("seo-diff.mjs", ["--group", "static"]);
  assert.equal(code, 0, stdout + stderr);
  for (const p of ["/terms", "/privacy", "/refund", "/pricing"]) assert.match(stdout, new RegExp(`✓ ${p}\\b`));
  assertBypassScoped();
});

test("seo-diff：偵測標籤缺漏、狀態碼、JSON-LD 與取不到的分享圖", async () => {
  drift = true;
  const { code, stdout } = await run("seo-diff.mjs", ["--group", "static"]);
  assert.equal(code, 1, stdout);
  assert.match(stdout, /✗ \/terms[\s\S]*- og:title=條款/);
  assert.match(stdout, /- title=條款 & 規範 \| Cross/);
  assert.match(stdout, /✗ \/privacy[\s\S]*\+ HTTP=404/);
  assert.match(stdout, /✗ \/refund[\s\S]*JSON-LD[\s\S]*變了/);
  assert.match(stdout, /✗ \/pricing[\s\S]*og:image[\s\S]*404/);
  assertBypassScoped();
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

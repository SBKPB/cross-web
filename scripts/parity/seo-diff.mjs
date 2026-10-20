// SEO 比對：對「基準」（預設本機舊版 Next，localhost:3100）與「預覽」逐條抓非 auth 路由，
// 比較 HTTP 狀態、<title>、description／robots／googlebot／keywords、canonical、全部 og:*、twitter:*
// 與每段 JSON-LD；有任何差異就印出並 exit 1。3xx 轉址（例如 /c/[code] 短網址）只比狀態碼與 Location。
//
// 用法：node scripts/parity/seo-diff.mjs --preview <url> [--base <url>] [--group <群組>] [--routes <檔案>]
//       node scripts/parity/seo-diff.mjs --preview <url> [--base <url>] --sitemap [--group <群組>]
// - --sitemap：比 /sitemap.xml 與 /robots.txt；沒給 --group 時只比這兩個，給了 --group 再加比該群組路由。
//   兩邊都須回 200、content-type 媒體類型相同；
//   sitemap 比對 <loc> 集合（多重集合，含重複）與順序、每個網址的 changefreq / priority、lastmod 有無與是否為 ISO 8601，
//   lastmod 的「值」是各自的產生時間所以不比；最後把 lastmod 值遮掉後整份 XML 逐位元組比對。
//   robots.txt 逐位元組比對。兩者都先把站台網址換成正式網址。
// - 兩邊都以 bingbot UA 抓取。Next 16 只對符合 HTML_LIMITED_BOT_UA_RE（next/dist/shared/lib/router/utils/html-bots.js）
//   的 UA 關閉串流 metadata、保證 metadata 在 <head>（server/lib/streaming-metadata.js 的 shouldServeStreamingMetadata）；
//   其他 UA 一律可能把 metadata 串流到 <body>。Googlebot 不在這份清單：is-bot.js 把它歸為會執行 JS 的 'dom' bot，
//   待遇和一般瀏覽器相同，所以不能用 Googlebot UA。bingbot、facebookexternalhit 都在清單內。
// - meta 以「屬性:名稱」為鍵比對（property:og:title 與 name:og:title 視為不同）。
// - 每個請求 30 秒逾時（環境變數 PARITY_FETCH_TIMEOUT_MS 可改），逾時的路由列為差異並以 exit 1 結束。
// - 預覽受 Vercel Deployment Protection 保護時，設環境變數 VERCEL_AUTOMATION_BYPASS_SECRET；
//   密鑰只會帶給預覽來源（每一跳轉址各自判斷），不會送往基準或第三方。
// - --routes 預設為同資料夾的 routes.json（測試用來換成假路由）。
//
// auth 路由（routes.json 的 auth: true）這支會略過，只用 screenshot.mjs 比對，而且一律 local-vs-local：
// 基準與預覽必須接同一個後端才能共用 token。沒有 --target-local 參數，等效用法是
//   基準：舊 Next（../web-next-ref）BACKEND_URL=http://localhost:8001 pnpm start -p 3101
//   預覽：本 repo pnpm build && BACKEND_URL=http://localhost:8001 pnpm preview --port 4173
//   PARITY_TOKEN=… PARITY_REFRESH_TOKEN=… node scripts/parity/screenshot.mjs --base http://localhost:3101 --preview http://localhost:4173 --group <群組>
// token 由本地 dev DB 測試帳號登入取得（後端 http://localhost:8001）；不要對 Vercel preview（接正式後端）跑 auth 路由。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual, parseArgs } from "node:util";

const PROD = "https://cross.twinhao.com";
// 必須符合 Next 的 HTML-limited bot 清單（見頂部註解），舊版才會把 metadata 放在 <head>
const CRAWLER_UA = "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";
const TIMEOUT_MS = Number(process.env.PARITY_FETCH_TIMEOUT_MS ?? 30_000);
const { values: args } = parseArgs({
  options: {
    base: { type: "string", default: "http://localhost:3100" },
    preview: { type: "string" },
    group: { type: "string" },
    routes: { type: "string", default: fileURLToPath(new URL("./routes.json", import.meta.url)) },
    sitemap: { type: "boolean", default: false },
  },
});
if (!args.preview) {
  console.error(
    "用法：node scripts/parity/seo-diff.mjs --preview <url> [--base <url>] [--group <群組>] [--routes <檔案>]\n" +
      "      node scripts/parity/seo-diff.mjs --preview <url> [--base <url>] --sitemap [--group <群組>]",
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

/**
 * 不自動跟隨轉址，每一跳都重新判斷是否帶密鑰（fetch 跨來源轉址會沿用自訂標頭）。
 * 回傳 { res, text }：逾時涵蓋到讀完 body（signal 會中斷 body 串流），逾時的錯誤訊息含網址。
 */
async function get(url, { follow = false, body = true } = {}) {
  for (let hop = 0; ; hop++) {
    const headers = { "user-agent": CRAWLER_UA };
    if (BYPASS && new URL(url).origin === preview) headers["x-vercel-protection-bypass"] = BYPASS;
    let location;
    try {
      const res = await fetch(url, { redirect: "manual", headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
      location = res.headers.get("location");
      if (!follow || !location || hop === 5) {
        const text = body ? await res.text() : (await res.body?.cancel(), "");
        return { res, text };
      }
      await res.body?.cancel();
    } catch (e) {
      if (e?.name === "TimeoutError") throw new Error(`逾時（${TIMEOUT_MS / 1000} 秒）：${url}`);
      throw e;
    }
    url = new URL(location, url).href;
  }
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" };
const decode = (s) =>
  s.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (m, e) =>
    e[0] !== "#"
      ? (ENTITIES[e.toLowerCase()] ?? m)
      : String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))),
  );
const attrs = (tag) =>
  Object.fromEntries(
    [...tag.matchAll(/([^\s=/<>"']+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map((m) => [
      m[1].toLowerCase(),
      decode(m[2] ?? m[3] ?? m[4]),
    ]),
  );

const NAMES = new Set(["description", "robots", "googlebot", "keywords"]);
const IMAGES = new Set(["og:image", "twitter:image"]);

/**
 * 站台網址一律換成正式網址再比（canonical、og:url、sitemap 的 loc 等），切換後兩邊就是同一個網域；
 * lookahead 避免 http://x:3100 誤換到 http://x:31000 之類的前綴
 */
const ownOrigin = (origin) => new RegExp(`${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w.:-])`, "g");

/** 抓一頁並抽出要比對的標籤（以「鍵=值」字串表示，方便做集合比對）、分享圖網址與 JSON-LD */
async function snapshot(origin, path) {
  const { res, text } = await get(origin + path);
  const own = ownOrigin(origin);
  const html = text.replace(own, PROD);
  const location = res.headers.get("location");
  const entries = [`HTTP=${res.status}${location ? ` → ${location.replace(own, PROD)}` : ""}`];
  // 3xx 轉址只比狀態碼與 Location：瀏覽器與爬蟲都不看轉址回應的 body（舊版 Next 的 308 帶整份全站 <head>，SvelteKit 是空 body）
  if (res.status >= 300 && res.status < 400) return { status: res.status, entries, images: [], jsonLd: [] };
  const images = [];
  const end = html.search(/<\/head>/i);
  const head = end < 0 ? html : html.slice(0, end);
  for (const m of head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)) entries.push(`title=${decode(m[1])}`);
  for (const m of head.matchAll(/<(meta|link)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
    const a = attrs(m[0]);
    let key;
    let value;
    let name;
    if (m[1].toLowerCase() === "link") {
      if (a.rel !== "canonical") continue;
      key = "canonical";
      value = a.href;
    } else {
      // 鍵帶上屬性：property="og:title" 與 name="og:title" 對爬蟲不一定等價，要能比出差異
      const attr = a.property !== undefined ? "property" : a.name !== undefined ? "name" : null;
      if (!attr) continue;
      name = a[attr];
      if (!(NAMES.has(name) || /^(og|twitter):/.test(name))) continue;
      key = `${attr}:${name}`;
      value = a.content;
    }
    // R6：分享圖只比「有沒有」，網址另外檢查能否取得
    if (IMAGES.has(name)) images.push([key, value]);
    entries.push(`${key}=${IMAGES.has(name) ? "<圖片>" : value}`);
  }
  const jsonLd = [...html.matchAll(/<script\b[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => {
    try {
      return JSON.parse(m[1]);
    } catch {
      return { 無法解析: m[1] };
    }
  });
  return { status: res.status, entries, images, jsonLd };
}

/** 分享圖必須回 200 image/*；正式網址換回該站來源再抓（檢查的是這次部署有沒有這張圖） */
async function checkImage(origin, [key, value]) {
  const u = new URL(value, origin);
  const url = u.origin === PROD ? origin + u.pathname + u.search : u.href;
  try {
    const { res } = await get(url, { follow: true, body: false });
    const type = res.headers.get("content-type") ?? "";
    return res.status === 200 && type.startsWith("image/") ? null : `${key} 無法取得：${url} → ${res.status} ${type}`;
  } catch (e) {
    return `${key} 無法取得：${url} → ${e.message}`;
  }
}

/** 兩邊各自多出來的項目（多重集合差） */
function minus(a, b, eq) {
  const rest = [...b];
  return a.filter((x) => {
    const i = rest.findIndex((y) => eq(x, y));
    if (i < 0) return true;
    rest.splice(i, 1);
    return false;
  });
}

/** 抓純文字資源（sitemap / robots）：狀態、content-type 媒體類型、站台網址正規化後的內容 */
async function fetchText(origin, path) {
  const { res, text } = await get(origin + path);
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  return { status: res.status, type, text: text.replace(ownOrigin(origin), PROD) };
}

/** 兩邊都要 200，content-type 媒體類型相同（charset 等參數不比） */
function compareResponse(b, p) {
  const problems = [];
  for (const [label, s] of [["基準", b], ["預覽", p]]) {
    if (s.status !== 200) problems.push(`${label} HTTP ${s.status}，預期 200`);
  }
  if (b.type !== p.type) problems.push(`content-type ${b.type || "（無）"} → ${p.type || "（無）"}`);
  return problems;
}

/** 逐行比對，列出不同的行（行號從 1 起） */
function lineDiff(a, b) {
  const [la, lb] = [a.split("\n"), b.split("\n")];
  const out = [];
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (la[i] === lb[i]) continue;
    if (la[i] !== undefined) out.push(`- 第 ${i + 1} 行 ${JSON.stringify(la[i])}`);
    if (lb[i] !== undefined) out.push(`+ 第 ${i + 1} 行 ${JSON.stringify(lb[i])}`);
  }
  return out;
}

// Next 以 Date#toISOString 輸出 lastmod；也接受 W3C Datetime 常見的時區寫法
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

function parseSitemap(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => {
    const field = (tag) => m[1].match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1];
    return { loc: field("loc"), lastmod: field("lastmod"), changefreq: field("changefreq"), priority: field("priority") };
  });
}

async function diffSitemap() {
  const [b, p] = await Promise.all([fetchText(base, "/sitemap.xml"), fetchText(preview, "/sitemap.xml")]);
  const problems = compareResponse(b, p);
  const [bi, pi] = [parseSitemap(b.text), parseSitemap(p.text)];
  const [bLocs, pLocs] = [bi.map((x) => x.loc), pi.map((x) => x.loc)];
  const eq = (x, y) => x === y;
  problems.push(...minus(bLocs, pLocs, eq).map((loc) => `- <loc> ${loc}`));
  problems.push(...minus(pLocs, bLocs, eq).map((loc) => `+ <loc> ${loc}`));
  const byLoc = new Map(pi.map((x) => [x.loc, x]));
  for (const x of bi) {
    const y = byLoc.get(x.loc);
    if (!y) continue;
    for (const f of ["changefreq", "priority"]) {
      if (x[f] !== y[f]) problems.push(`${x.loc} ${f}：${x[f] ?? "（無）"} → ${y[f] ?? "（無）"}`);
    }
    const has = (v) => (v === undefined ? "（無）" : "有");
    if (has(x.lastmod) !== has(y.lastmod)) problems.push(`${x.loc} lastmod：${has(x.lastmod)} → ${has(y.lastmod)}`);
  }
  for (const [label, items] of [["基準", bi], ["預覽", pi]]) {
    for (const x of items) {
      if (x.lastmod !== undefined && !ISO_8601.test(x.lastmod)) {
        problems.push(`${label} ${x.loc} lastmod 不是 ISO 8601 時間：${x.lastmod}`);
      }
    }
  }
  // 集合相同才看順序與其餘位元組（集合不同時這兩項必然不同，不重複列）
  if (!problems.length) {
    const i = bLocs.findIndex((loc, k) => loc !== pLocs[k]);
    if (i >= 0) problems.push(`網址順序不同：第 ${i + 1} 筆 基準 ${bLocs[i]}，預覽 ${pLocs[i]}`);
  }
  if (!problems.length) {
    const mask = (t) => t.replace(/<lastmod>[^<]*<\/lastmod>/g, "<lastmod>…</lastmod>");
    const diff = lineDiff(mask(b.text), mask(p.text));
    if (diff.length) problems.push(`XML 內容不同（lastmod 以外）：${diff[0].replace(/^- /, "")}`, ...diff);
  }
  return { problems, count: bi.length };
}

async function diffRobots() {
  const [b, p] = await Promise.all([fetchText(base, "/robots.txt"), fetchText(preview, "/robots.txt")]);
  const problems = compareResponse(b, p);
  if (b.text !== p.text) problems.push(...lineDiff(b.text, p.text));
  return { problems };
}

console.log(`基準 ${base} ↔ 預覽 ${preview}（- 只在基準，+ 只在預覽）`);
let failed = 0;
let total = 0;
if (args.sitemap) {
  console.log("\n[sitemap]");
  for (const [path, check] of [["/sitemap.xml", diffSitemap], ["/robots.txt", diffRobots]]) {
    total++;
    let result;
    try {
      result = await check();
    } catch (e) {
      result = { problems: [`抓取失敗：${e.message}`] };
    }
    if (result.problems.length) failed++;
    const note = result.count === undefined ? "" : `（${result.count} 個網址）`;
    console.log(`${result.problems.length ? "✗" : "✓"} ${path}${note}`);
    for (const line of result.problems) console.log(`    ${line}`);
  }
}
// --sitemap 沒給 --group：只比 sitemap / robots，不跑 routes.json 的路由
const groups = args.group ? { [args.group]: routes[args.group] } : args.sitemap ? {} : routes;
for (const [group, list] of Object.entries(groups)) {
  console.log(`\n[${group}]`);
  for (const route of list.filter((r) => !r.auth)) {
    total++;
    const problems = [];
    try {
      const [b, p] = await Promise.all([snapshot(base, route.path), snapshot(preview, route.path)]);
      const expect = route.expectStatus ?? 200;
      for (const [label, s] of [["基準", b], ["預覽", p]]) {
        if (s.status !== expect) problems.push(`${label} HTTP ${s.status}，預期 ${expect}`);
      }
      const eq = (x, y) => x === y;
      problems.push(...minus(b.entries, p.entries, eq).map((x) => `- ${x}`));
      problems.push(...minus(p.entries, b.entries, eq).map((x) => `+ ${x}`));
      problems.push(...minus(b.jsonLd, p.jsonLd, isDeepStrictEqual).map((x) => `- JSON-LD ${JSON.stringify(x)}`));
      problems.push(...minus(p.jsonLd, b.jsonLd, isDeepStrictEqual).map((x) => `+ JSON-LD ${JSON.stringify(x)}`));
      for (const [label, origin, s] of [["基準", base, b], ["預覽", preview, p]]) {
        for (const msg of await Promise.all(s.images.map((img) => checkImage(origin, img)))) {
          if (msg) problems.push(`${label} ${msg}`);
        }
      }
    } catch (e) {
      problems.push(`抓取失敗：${e.message}`);
    }
    if (problems.length) failed++;
    console.log(`${problems.length ? "✗" : "✓"} ${route.path}`);
    for (const line of problems) console.log(`    ${line}`);
  }
}
console.log(failed ? `\n${failed}/${total} 條路由有差異` : `\n全部 ${total} 條路由一致`);
process.exitCode = failed ? 1 : 0;

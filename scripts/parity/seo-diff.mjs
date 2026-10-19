// SEO 比對：對「基準」（預設本機舊版 Next，localhost:3100）與「預覽」逐條抓非 auth 路由，
// 比較 HTTP 狀態、<title>、description／robots／googlebot／keywords、canonical、全部 og:*、twitter:*
// 與每段 JSON-LD；有任何差異就印出並 exit 1。
//
// 用法：node scripts/parity/seo-diff.mjs --preview <url> [--base <url>] [--group <群組>]
// 預覽受 Vercel Deployment Protection 保護時，設環境變數 VERCEL_AUTOMATION_BYPASS_SECRET；
// 密鑰只會帶給預覽來源（每一跳轉址各自判斷），不會送往基準或第三方。
import { readFileSync } from "node:fs";
import { isDeepStrictEqual, parseArgs } from "node:util";

const PROD = "https://cross.twinhao.com";
const { values: args } = parseArgs({
  options: {
    base: { type: "string", default: "http://localhost:3100" },
    preview: { type: "string" },
    group: { type: "string" },
  },
});
if (!args.preview) {
  console.error("用法：node scripts/parity/seo-diff.mjs --preview <url> [--base <url>] [--group <群組>]");
  process.exit(2);
}
const routes = JSON.parse(readFileSync(new URL("./routes.json", import.meta.url), "utf8"));
if (args.group && !routes[args.group]) {
  console.error(`routes.json 沒有群組「${args.group}」`);
  process.exit(2);
}
const base = new URL(args.base).origin;
const preview = new URL(args.preview).origin;
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

/** 不自動跟隨轉址，每一跳都重新判斷是否帶密鑰（fetch 跨來源轉址會沿用自訂標頭） */
async function get(url, follow) {
  for (let hop = 0; ; hop++) {
    const headers = BYPASS && new URL(url).origin === preview ? { "x-vercel-protection-bypass": BYPASS } : {};
    const res = await fetch(url, { redirect: "manual", headers });
    const location = res.headers.get("location");
    if (!follow || !location || hop === 5) return res;
    await res.body?.cancel();
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

/** 抓一頁並抽出要比對的標籤（以「鍵=值」字串表示，方便做集合比對）、分享圖網址與 JSON-LD */
async function snapshot(origin, path) {
  const res = await get(origin + path, false);
  // 站台網址一律換成正式網址再比（canonical、og:url 等），切換後兩邊就是同一個網域；
  // lookahead 避免 http://x:3100 誤換到 http://x:31000 之類的前綴
  const own = new RegExp(`${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w.:-])`, "g");
  const html = (await res.text()).replace(own, PROD);
  const location = res.headers.get("location");
  const entries = [`HTTP=${res.status}${location ? ` → ${location.replace(own, PROD)}` : ""}`];
  const images = [];
  const end = html.search(/<\/head>/i);
  const head = end < 0 ? html : html.slice(0, end);
  for (const m of head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)) entries.push(`title=${decode(m[1])}`);
  for (const m of head.matchAll(/<(meta|link)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
    const a = attrs(m[0]);
    const key = m[1].toLowerCase() === "link" ? (a.rel === "canonical" ? "canonical" : null) : (a.property ?? a.name);
    if (!key || !(key === "canonical" || NAMES.has(key) || /^(og|twitter):/.test(key))) continue;
    const value = key === "canonical" ? a.href : a.content;
    // R6：分享圖只比「有沒有」，網址另外檢查能否取得
    if (IMAGES.has(key)) images.push([key, value]);
    entries.push(`${key}=${IMAGES.has(key) ? "<圖片>" : value}`);
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
    const res = await get(url, true);
    const type = res.headers.get("content-type") ?? "";
    await res.body?.cancel();
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

console.log(`基準 ${base} ↔ 預覽 ${preview}（- 只在基準，+ 只在預覽）`);
let failed = 0;
let total = 0;
for (const [group, list] of Object.entries(args.group ? { [args.group]: routes[args.group] } : routes)) {
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

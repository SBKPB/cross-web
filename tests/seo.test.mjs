import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile } from "svelte/compiler";
import { render } from "svelte/server";

// 把真正的 Seo.svelte 編成 SSR 模組後 render，比對輸出的 <head> 標籤。
// $app/state 換成固定網址的替身，#lib 與 svelte 換成實際檔案路徑（data: 模組只能 import 絕對網址）。
const ORIGIN = "https://cross.twinhao.com";
// 目前請求的來源刻意用 preview 網域：og:image 要用固定的正式網域（舊版 metadataBase），不能跟著請求來源變
const REQUEST_ORIGIN = "https://cross-abc123-office.vercel.app";
const stub = (code) => `data:text/javascript,${encodeURIComponent(code)}`;
const source = readFileSync(new URL("../src/lib/components/Seo.svelte", import.meta.url), "utf8");
const code = compile(source, { generate: "server", filename: "Seo.svelte" })
  .js.code.replace(/(["'])svelte\/internal\/server\1/, JSON.stringify(import.meta.resolve("svelte/internal/server")))
  .replace(/(["'])\$app\/state\1/, JSON.stringify(stub(`export const page = { url: new URL("${REQUEST_ORIGIN}/") };`)))
  .replace(
    /(["'])\#lib\/seo\/serialize-json-ld\.ts\1/,
    JSON.stringify(new URL("../src/lib/seo/serialize-json-ld.ts", import.meta.url).href),
  );
const { default: Seo } = await import(stub(code));

/** render 後依出現順序列出 title / description / keywords / robots / canonical / og / twitter，格式同 baseline 擷取 */
function headLines(props) {
  const { head } = render(Seo, { props });
  const attr = (tag, name) =>
    tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const lines = [`title=${head.match(/<title>([^<]*)<\/title>/)[1]}`];
  for (const tag of head.match(/<(meta|link)\b[^>]*>/g) ?? []) {
    const key = attr(tag, "name") ?? attr(tag, "property") ?? attr(tag, "rel");
    lines.push(`${key}=${attr(tag, "content") ?? attr(tag, "href")}`);
  }
  return lines;
}
const lines = (text) => text.trim().split("\n").map((l) => l.trim());

// metadata 結構沿用原正式版；全站品牌文案依 2026-10-23 預約優先定位更新。
// og:image / twitter:image 的網址依 R6 只要求存在（舊版是 /opengraph-image，新版是 og.png）。
const ROBOTS = `
  robots=index, follow
  googlebot=index, follow, max-image-preview:large, max-snippet:-1`;
const ROOT_KEYWORDS =
  "keywords=線上預約,線上掛號,看診預約,診所預約,醫美諮詢,療程預約,院所管理,排班管理,台灣診所,Cross";
const ROOT_TWITTER = `
  twitter:card=summary
  twitter:title=Cross | 線上預約與院所管理平台
  twitter:description=線上預約看診、醫美諮詢與療程，查詢院所服務及可預約時段。Cross 協助院所集中管理預約、人員排班與候診叫號。`;

test("沒給 openGraph / twitter：輸出全站 og、twitter 與預設分享圖（舊版 /terms）", () => {
  assert.deepEqual(
    headLines({ canonical: "/" }),
    lines(`
      title=Cross | 線上預約與院所管理平台
      description=線上預約看診、醫美諮詢與療程，查詢院所服務及可預約時段。Cross 協助院所集中管理預約、人員排班與候診叫號。
      ${ROOT_KEYWORDS}${ROBOTS}
      canonical=https://cross.twinhao.com
      og:title=Cross | 線上預約與院所管理平台
      og:description=線上預約看診、醫美諮詢與療程，查詢院所服務及可預約時段。Cross 協助院所集中管理預約、人員排班與候診叫號。
      og:url=https://cross.twinhao.com
      og:site_name=Cross
      og:locale=zh_TW
      og:image=${ORIGIN}/og.png
      og:image:type=image/png
      og:image:width=1200
      og:image:height=630
      og:image:alt=Cross — 線上預約與院所管理
      og:type=website${ROOT_TWITTER}
      twitter:image=${ORIGIN}/og.png
      twitter:image:alt=Cross — 線上預約與院所管理
      twitter:image:type=image/png
      twitter:image:width=1200
      twitter:image:height=630`),
  );
});

test("openGraph + twitter 整組取代：沒有全站 og:image / site_name / locale / type（舊版 /refund）", () => {
  const description =
    "Cross 退款政策：取消續訂後使用至到期，誤購或誤續約於付款後 7 日內且未使用付費功能可申請退款，另提供扣款錯誤與服務問題的處理方式。";
  assert.deepEqual(
    headLines({
      title: "退款政策",
      description,
      canonical: "/refund",
      openGraph: { title: "退款政策 | Cross", description, url: "/refund" },
      twitter: { card: "summary", title: "退款政策 | Cross", description },
    }),
    lines(`
      title=退款政策 | Cross
      description=${description}
      ${ROOT_KEYWORDS}${ROBOTS}
      canonical=https://cross.twinhao.com/refund
      og:title=退款政策 | Cross
      og:description=${description}
      og:url=https://cross.twinhao.com/refund
      twitter:card=summary
      twitter:title=退款政策 | Cross
      twitter:description=${description}`),
  );
});

test("只給 openGraph：og:description 退回頁面描述，twitter 維持全站值且沒有圖（舊版 /area、/specialty）", () => {
  const description =
    "依縣市查找台灣各地可線上預約掛號的診所。涵蓋各科別門診，查看門診時間、醫師團隊與服務項目，直接線上預約。";
  assert.deepEqual(
    headLines({
      title: "各縣市診所一覽｜線上預約掛號",
      description,
      canonical: "/area",
      openGraph: {
        type: "website",
        siteName: "Cross",
        url: "https://cross.twinhao.com/area",
        title: "各縣市診所一覽｜線上預約掛號 | Cross",
      },
    }),
    lines(`
      title=各縣市診所一覽｜線上預約掛號 | Cross
      description=${description}
      ${ROOT_KEYWORDS}${ROBOTS}
      canonical=https://cross.twinhao.com/area
      og:title=各縣市診所一覽｜線上預約掛號 | Cross
      og:description=${description}
      og:url=https://cross.twinhao.com/area
      og:site_name=Cross
      og:type=website${ROOT_TWITTER}`),
  );
});

test("openGraph 只給 title、url（舊版 /developers、/developers/docs/[slug]）", () => {
  const description =
    "用 Cross 的本機沙盒、OpenAPI 與 Python／JavaScript 範例，完成心率與合成 ECG 的第一條資料流程。";
  assert.deepEqual(
    headLines({
      title: "開發者入口",
      description,
      canonical: "/developers",
      openGraph: { title: "Cross 開發者入口", url: "/developers" },
    }),
    lines(`
      title=開發者入口 | Cross
      description=${description}
      ${ROOT_KEYWORDS}${ROBOTS}
      canonical=https://cross.twinhao.com/developers
      og:title=Cross 開發者入口
      og:description=${description}
      og:url=https://cross.twinhao.com/developers
      ${ROOT_TWITTER.trim()}`),
  );
});

test("覆寫 keywords（舊版 /area/[city]、/specialty/[code]）", () => {
  const city = "高雄市";
  const path = `/area/${encodeURIComponent(city)}`;
  const description = `${city}共 1 家診所可線上預約掛號。查詢${city}各科別門診時間、醫師團隊與服務項目，免打電話直接線上預約。`;
  assert.deepEqual(
    headLines({
      title: `${city}診所推薦｜線上預約掛號`,
      description,
      canonical: path,
      keywords: [`${city}診所`, `${city}門診`, `${city}線上預約`, "掛號"].join("、"),
      openGraph: {
        type: "website",
        siteName: "Cross",
        url: `${ORIGIN}${path}`,
        title: `${city}診所推薦｜線上預約掛號 | Cross`,
        description,
      },
    }),
    lines(`
      title=高雄市診所推薦｜線上預約掛號 | Cross
      description=${description}
      keywords=高雄市診所、高雄市門診、高雄市線上預約、掛號${ROBOTS}
      canonical=https://cross.twinhao.com/area/%E9%AB%98%E9%9B%84%E5%B8%82
      og:title=高雄市診所推薦｜線上預約掛號 | Cross
      og:description=${description}
      og:url=https://cross.twinhao.com/area/%E9%AB%98%E9%9B%84%E5%B8%82
      og:site_name=Cross
      og:type=website${ROOT_TWITTER}`),
  );
});

test("openGraph + twitter + 頁面分享圖：twitter:image 沿用 og 圖（舊版 /clinic/[id] 的 opengraph-image）", () => {
  const id = "c406782c-628f-411c-890c-62a3dc4a5cf0";
  const title = "喬鋭德鶴｜高雄市傳統整復推拿線上預約";
  const description =
    "物理治療師；傳統整復推拿技術士；中西技術整合；臨床個案十萬人以上；安全、科學、有效；提供不一樣的體驗。";
  const image = `${ORIGIN}/clinic/${id}/og.png`;
  assert.deepEqual(
    headLines({
      title,
      description,
      canonical: `/clinic/${id}`,
      keywords: "喬鋭德鶴、傳統整復推拿、高雄市、線上預約、掛號",
      image: { url: image, alt: "診所線上預約掛號 — Cross", type: "image/png", width: 1200, height: 630 },
      openGraph: { type: "website", siteName: "Cross", url: `${ORIGIN}/clinic/${id}`, title: `${title} | Cross`, description },
      twitter: { card: "summary_large_image", title: `${title} | Cross`, description },
    }),
    lines(`
      title=${title} | Cross
      description=${description}
      keywords=喬鋭德鶴、傳統整復推拿、高雄市、線上預約、掛號${ROBOTS}
      canonical=https://cross.twinhao.com/clinic/${id}
      og:title=${title} | Cross
      og:description=${description}
      og:url=https://cross.twinhao.com/clinic/${id}
      og:site_name=Cross
      og:image=${image}
      og:image:type=image/png
      og:image:width=1200
      og:image:height=630
      og:image:alt=診所線上預約掛號 — Cross
      og:type=website
      twitter:card=summary_large_image
      twitter:title=${title} | Cross
      twitter:description=${description}
      twitter:image=${image}
      twitter:image:alt=診所線上預約掛號 — Cross
      twitter:image:type=image/png
      twitter:image:width=1200
      twitter:image:height=630`),
  );
});

// 舊版 root layout 設 metadataBase = https://cross.twinhao.com：og:image / twitter:image 的相對網址一律以正式網域補成絕對網址，
// preview 部署與本機也一樣（不是目前請求的來源）。新版預設分享圖 og.png 與診所 og.png 同樣用固定網域。
test("og:image / twitter:image 一律以 https://cross.twinhao.com/ 開頭，不隨請求來源（舊版 metadataBase）", () => {
  const { head } = render(Seo, { props: { canonical: "/" } });
  const images = [...head.matchAll(/<meta (?:property|name)="(og:image|twitter:image)" content="([^"]*)"/g)];
  assert.deepEqual(
    images.map((m) => [m[1], m[2]]),
    [
      ["og:image", "https://cross.twinhao.com/og.png"],
      ["twitter:image", "https://cross.twinhao.com/og.png"],
    ],
  );
  assert.ok(!head.includes(REQUEST_ORIGIN), "不得出現請求來源");
});

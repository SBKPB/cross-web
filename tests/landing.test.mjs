import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isHttpError } from "@sveltejs/kit";
import { FALLBACK_TAXONOMY } from "../src/lib/api/service-categories.ts";
import { LANDING_PAGE_CACHE } from "../src/lib/cache-control.ts";

// 移植自舊版 app/{area,specialty}/**、sitemap.ts、robots.ts（web-next-ref 546d950）。
// metadata / JSON-LD 預期值逐字取自 3100 基準（舊 Next 接正式後端）實際輸出；
// sitemap / robots 的預期內容是 3100 基準實際回應的原始位元組（tests/support/landing/*-3100.*）。

const KAOHSIUNG = "c406782c-628f-411c-890c-62a3dc4a5cf0";
const DEMO = "42399a23-1119-407e-91ed-e2df5bdbb218";
const ENC_KAOHSIUNG = "%E9%AB%98%E9%9B%84%E5%B8%82";

/** 正式後端 /booking/clinics 目前的兩筆（示範院所會被排除） */
const PROD_CLINICS = [
  {
    id: DEMO,
    name: "康健家庭醫學診所-示範",
    address: "台北市信義區市府路45號",
    departments: ["family_medicine", "internal_medicine", "pediatrics"],
    facility_type: "healthcare",
    payment_type: "both",
    logo: null,
    phone: "02-2720-1234",
    is_featured: true,
  },
  {
    id: KAOHSIUNG,
    name: "喬鋭德鶴",
    address: "高雄市三民區博愛里長明街175號",
    departments: ["oth_manipulation"],
    facility_type: "other",
    payment_type: "self_pay",
    logo: null,
    phone: "0921147832",
    is_featured: false,
  },
];

const clinic = (id, name, address, departments, extra = {}) => ({
  id,
  name,
  address,
  departments,
  facility_type: "healthcare",
  logo: null,
  phone: null,
  is_featured: false,
  ...extra,
});

/** 多縣市、多科別的假資料：排序（精選優先、名稱）、科別快捷前 12、JSON-LD 前 50 */
const MANY = [
  clinic("t1", "乙診所", "台北市大安區", ["internal_medicine", "pediatrics", "other"]),
  clinic("t2", "甲診所", "臺北市中山區", ["internal_medicine"], { is_featured: true }),
  clinic("t3", "丙診所", "台北市信義區", ["dermatology"]),
  clinic("k1", "高雄一", "高雄市前鎮區", ["internal_medicine"]),
  clinic("n1", "無地址", null, ["dentistry"]),
];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** 假的 event.fetch：依路徑回應並記錄呼叫（相對路徑 = 經內部 /api/v1 代理） */
function fakeFetch(clinics, { taxonomy = FALLBACK_TAXONOMY, clinicsStatus = 200 } = {}) {
  const calls = [];
  const fetch = async (url) => {
    calls.push(String(url));
    if (String(url) === "/api/v1/booking/clinics") return json(clinics, clinicsStatus);
    if (String(url) === "/api/v1/service-categories") return json(taxonomy);
    return json({ detail: "Not Found" }, 404);
  };
  return { fetch, calls };
}

/** 呼叫 load，回傳 { data, headers }；丟出的錯誤原樣拋出（headers 仍可由 sink 取得） */
async function runLoad(load, { clinics = PROD_CLINICS, params = {}, sink = [], ...opts } = {}) {
  const { fetch } = fakeFetch(clinics, opts);
  const data = await load({ params, fetch, setHeaders: (h) => sink.push(h) });
  return { data, headers: sink };
}

test.beforeEach((t) => {
  // 後端只能經傳入的 event.fetch 走代理
  t.mock.method(globalThis, "fetch", () => assert.fail("不應呼叫全域 fetch"));
});

test("快取常數：落地頁 / sitemap 一小時（舊版 revalidate = 3600）", () => {
  assert.equal(LANDING_PAGE_CACHE, "public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate");
});

// ---------- /area ----------

test("/area load：縣市清單（依數量、同數依名稱），排除示範院所，快取一小時，metadata 同 3100", async () => {
  const { load } = await import("../src/routes/area/+page.server.ts");
  const prod = await runLoad(load);
  assert.deepEqual(prod.headers, [{ "cache-control": LANDING_PAGE_CACHE }]);
  assert.deepEqual(prod.data.cities, [{ city: "高雄市", count: 1 }]);
  assert.deepEqual(prod.data.seo, {
    title: "各縣市診所一覽｜線上預約掛號",
    description:
      "依縣市查找台灣各地可線上預約掛號的診所。涵蓋各科別門診，查看門診時間、醫師團隊與服務項目，直接線上預約。",
    canonical: "/area",
    openGraph: {
      type: "website",
      siteName: "Cross",
      url: "https://cross.twinhao.com/area",
      title: "各縣市診所一覽｜線上預約掛號 | Cross",
    },
  });

  const many = await runLoad(load, { clinics: MANY });
  // 台北市、臺北市都正規化為「臺北市」；沒有地址的不列入
  assert.deepEqual(many.data.cities, [
    { city: "臺北市", count: 3 },
    { city: "高雄市", count: 1 },
  ]);
});

test("/area load：後端掛掉 → 空清單（頁面顯示「目前尚無診所資料」），仍快取一小時（同舊版 ISR）", async () => {
  const { load } = await import("../src/routes/area/+page.server.ts");
  const { data, headers } = await runLoad(load, { clinicsStatus: 500 });
  assert.deepEqual(data.cities, []);
  assert.deepEqual(headers, [{ "cache-control": LANDING_PAGE_CACHE }]);
});

// ---------- /area/[city] ----------

test("/area/[city] load：高雄市 → 院所、科別快捷、metadata 與 JSON-LD 逐字同 3100", async () => {
  const { load } = await import("../src/routes/area/[city]/+page.server.ts");
  const { data, headers } = await runLoad(load, { params: { city: "高雄市" } });
  assert.deepEqual(headers, [{ "cache-control": LANDING_PAGE_CACHE }]);
  assert.equal(data.city, "高雄市");
  assert.deepEqual(
    data.clinics.map((c) => c.id),
    [KAOHSIUNG],
  );
  assert.deepEqual(data.cityCategories, [{ code: "oth_manipulation", count: 1, label: "傳統整復推拿" }]);
  assert.equal(data.intro, "傳統整復推拿");
  assert.deepEqual(data.taxonomy, FALLBACK_TAXONOMY);

  const url = `https://cross.twinhao.com/area/${ENC_KAOHSIUNG}`;
  const description =
    "高雄市共 1 家診所可線上預約掛號。查詢高雄市各科別門診時間、醫師團隊與服務項目，免打電話直接線上預約。";
  assert.deepEqual(data.seo, {
    title: "高雄市診所推薦｜線上預約掛號",
    description,
    keywords: "高雄市診所、高雄市門診、高雄市線上預約、掛號",
    canonical: `/area/${ENC_KAOHSIUNG}`,
    openGraph: {
      type: "website",
      siteName: "Cross",
      url,
      title: "高雄市診所推薦｜線上預約掛號 | Cross",
      description,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": url,
          url,
          name: "高雄市診所推薦",
          description: "高雄市可線上預約掛號的診所清單",
        },
        {
          "@type": "ItemList",
          numberOfItems: 1,
          itemListElement: [
            { "@type": "ListItem", position: 1, url: `https://cross.twinhao.com/clinic/${KAOHSIUNG}`, name: "喬鋭德鶴" },
          ],
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "首頁", item: "https://cross.twinhao.com" },
            { "@type": "ListItem", position: 2, name: "地區", item: "https://cross.twinhao.com/area" },
            { "@type": "ListItem", position: 3, name: "高雄市", item: url },
          ],
        },
      ],
    },
  });
});

test("/area/[city] load：精選優先再依名稱排序；科別快捷依數量、最多 12 個、排除 other；介紹文取前 5 個以「、」連接", async () => {
  const { load } = await import("../src/routes/area/[city]/+page.server.ts");
  const { data } = await runLoad(load, { clinics: MANY, params: { city: "臺北市" } });
  // 甲診所是精選；乙（1 劃）、丙（5 劃）依 zh-Hant 筆畫排序
  assert.deepEqual(
    data.clinics.map((c) => c.name),
    ["甲診所", "乙診所", "丙診所"],
  );
  assert.deepEqual(data.cityCategories, [
    { code: "internal_medicine", count: 2, label: "內科" },
    { code: "pediatrics", count: 1, label: "兒科" },
    { code: "dermatology", count: 1, label: "皮膚科" },
  ]);
  assert.equal(data.intro, "內科、兒科、皮膚科");
  assert.equal(data.seo.jsonLd["@graph"][1].numberOfItems, 3);

  const lots = Array.from({ length: 60 }, (_, i) =>
    clinic(`c${i}`, `診所${String(i).padStart(2, "0")}`, "台中市西區", [`code_${i % 14}`]),
  );
  const big = (await runLoad(load, { clinics: lots, params: { city: "臺中市" } })).data;
  assert.equal(big.cityCategories.length, 12);
  assert.equal(big.intro.split("、").length, 5);
  assert.equal(big.seo.jsonLd["@graph"][1].numberOfItems, 60);
  assert.equal(big.seo.jsonLd["@graph"][1].itemListElement.length, 50);
  assert.equal(big.seo.jsonLd["@graph"][1].itemListElement[49].position, 50);

  // 沒有任何科別（只有 other）：沒有快捷，介紹文不帶「… 等」
  const plain = (await runLoad(load, { clinics: [clinic("o", "其他", "台南市東區", ["other"])], params: { city: "臺南市" } }))
    .data;
  assert.deepEqual(plain.cityCategories, []);
  assert.equal(plain.intro, "");
});

test("/area/[city] load：沒有院所的縣市（含只有示範院所的臺北市、未正規化的台北市、未知字串）→ 404，且同舊版 ISR 快取一小時", async () => {
  const { load } = await import("../src/routes/area/[city]/+page.server.ts");
  for (const city of ["臺北市", "台北市", "nowhere", "%E9%AB%98%E9%9B%84%E5%B8%82", "高雄"]) {
    const sink = [];
    await assert.rejects(runLoad(load, { params: { city }, sink }), (e) => isHttpError(e, 404), city);
    assert.deepEqual(sink, [{ "cache-control": LANDING_PAGE_CACHE }], city);
  }
});

// ---------- /specialty ----------

test("/specialty load：科別清單帶中文名（依數量），排除 other，快取一小時，metadata 同 3100", async () => {
  const { load } = await import("../src/routes/specialty/+page.server.ts");
  const prod = await runLoad(load);
  assert.deepEqual(prod.headers, [{ "cache-control": LANDING_PAGE_CACHE }]);
  assert.deepEqual(prod.data.categories, [{ code: "oth_manipulation", count: 1, label: "傳統整復推拿" }]);
  assert.deepEqual(prod.data.seo, {
    title: "各科別診所一覽｜線上預約掛號",
    description:
      "依科別查找診所：內科、皮膚科、牙科、中醫、醫美、美容等。比較各科別診所的門診時間與服務，直接線上預約掛號。",
    canonical: "/specialty",
    openGraph: {
      type: "website",
      siteName: "Cross",
      url: "https://cross.twinhao.com/specialty",
      title: "各科別診所一覽｜線上預約掛號 | Cross",
    },
  });

  const many = await runLoad(load, { clinics: MANY });
  assert.deepEqual(many.data.categories, [
    { code: "internal_medicine", count: 3, label: "內科" },
    { code: "pediatrics", count: 1, label: "兒科" },
    { code: "dermatology", count: 1, label: "皮膚科" },
    { code: "dentistry", count: 1, label: "牙科" },
  ]);
  // 字彙查不到的 code 顯示原 code
  const unknown = await runLoad(load, { clinics: [clinic("x", "X", "台北市", ["mystery_code"])] });
  assert.deepEqual(unknown.data.categories, [{ code: "mystery_code", count: 1, label: "mystery_code" }]);
});

// ---------- /specialty/[code] ----------

test("/specialty/[code] load：oth_manipulation → 院所、縣市快捷、metadata 與 JSON-LD 逐字同 3100", async () => {
  const { load } = await import("../src/routes/specialty/[code]/+page.server.ts");
  const { data, headers } = await runLoad(load, { params: { code: "oth_manipulation" } });
  assert.deepEqual(headers, [{ "cache-control": LANDING_PAGE_CACHE }]);
  assert.equal(data.label, "傳統整復推拿");
  assert.deepEqual(
    data.clinics.map((c) => c.id),
    [KAOHSIUNG],
  );
  assert.deepEqual(data.cities, [{ city: "高雄市", count: 1 }]);
  assert.deepEqual(data.taxonomy, FALLBACK_TAXONOMY);

  const url = "https://cross.twinhao.com/specialty/oth_manipulation";
  const description =
    "精選 1 家傳統整復推拿診所，皆可線上預約掛號。比較各傳統整復推拿診所的門診時間、醫師團隊與服務項目，免打電話直接線上預約。";
  assert.deepEqual(data.seo, {
    title: "傳統整復推拿診所推薦｜線上預約掛號",
    description,
    keywords: "傳統整復推拿診所、傳統整復推拿推薦、傳統整復推拿線上預約、掛號",
    canonical: "/specialty/oth_manipulation",
    openGraph: {
      type: "website",
      siteName: "Cross",
      url,
      title: "傳統整復推拿診所推薦｜線上預約掛號 | Cross",
      description,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": url,
          url,
          name: "傳統整復推拿診所推薦",
          description: "可線上預約掛號的傳統整復推拿診所清單",
        },
        {
          "@type": "ItemList",
          numberOfItems: 1,
          itemListElement: [
            { "@type": "ListItem", position: 1, url: `https://cross.twinhao.com/clinic/${KAOHSIUNG}`, name: "喬鋭德鶴" },
          ],
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "首頁", item: "https://cross.twinhao.com" },
            { "@type": "ListItem", position: 2, name: "科別", item: "https://cross.twinhao.com/specialty" },
            { "@type": "ListItem", position: 3, name: "傳統整復推拿", item: url },
          ],
        },
      ],
    },
  });
});

test("/specialty/[code] load：縣市快捷依數量、最多 12 個；路徑與 JSON-LD 網址以 encodeURIComponent 編碼", async () => {
  const { load } = await import("../src/routes/specialty/[code]/+page.server.ts");
  const { data } = await runLoad(load, { clinics: MANY, params: { code: "internal_medicine" } });
  assert.equal(data.label, "內科");
  assert.deepEqual(
    data.clinics.map((c) => c.name),
    ["甲診所", "乙診所", "高雄一"],
  );
  assert.deepEqual(data.cities, [
    { city: "臺北市", count: 2 },
    { city: "高雄市", count: 1 },
  ]);
  assert.equal(data.seo.canonical, "/specialty/internal_medicine");

  // 舊版 dynamicParams：other 不產生靜態頁，但有院所時照樣可瀏覽（label 為「其他」）
  const other = (await runLoad(load, { clinics: MANY, params: { code: "other" } })).data;
  assert.equal(other.label, "其他");
  assert.equal(other.seo.title, "其他診所推薦｜線上預約掛號");

  const odd = (await runLoad(load, { clinics: [clinic("z", "Z", "台北市", ["a b/c"])], params: { code: "a b/c" } })).data;
  assert.equal(odd.seo.canonical, "/specialty/a%20b%2Fc");
  assert.equal(odd.seo.jsonLd["@graph"][0].url, "https://cross.twinhao.com/specialty/a%20b%2Fc");
});

test("/specialty/[code] load：沒有院所的科別或未知 code → 404，且同舊版 ISR 快取一小時", async () => {
  const { load } = await import("../src/routes/specialty/[code]/+page.server.ts");
  for (const code of ["internal_medicine", "nope", "family_medicine"]) {
    const sink = [];
    await assert.rejects(runLoad(load, { params: { code }, sink }), (e) => isHttpError(e, 404), code);
    assert.deepEqual(sink, [{ "cache-control": LANDING_PAGE_CACHE }], code);
  }
});

// ---------- sitemap.xml ----------

const SITEMAP_TIME = "2026-10-19T19:48:02.423Z";

async function getSitemap(t, clinics, opts) {
  t.mock.timers.enable({ apis: ["Date"], now: new Date(SITEMAP_TIME) });
  const { GET } = await import("../src/routes/sitemap.xml/+server.ts");
  const { fetch, calls } = fakeFetch(clinics, opts);
  const res = await GET({ fetch });
  return { res, body: await res.text(), calls };
}

test("sitemap.xml：與 3100 基準逐位元組相同（同一個產生時間），application/xml，快取一小時", async (t) => {
  const { res, body, calls } = await getSitemap(t, PROD_CLINICS);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "application/xml");
  assert.equal(res.headers.get("cache-control"), LANDING_PAGE_CACHE);
  assert.equal(body, readFileSync(new URL("./support/landing/sitemap-3100.xml", import.meta.url), "utf8"));
  assert.deepEqual(calls, ["/api/v1/booking/clinics"]);
});

test("sitemap.xml：院所、縣市（編碼）、科別依舊版順序與欄位", async (t) => {
  const { body } = await getSitemap(t, MANY);
  const locs = [...body.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  assert.equal(locs.length, 16 + 5 + 2 + 4);
  assert.deepEqual(locs.slice(16), [
    ...["t1", "t2", "t3", "k1", "n1"].map((id) => `https://cross.twinhao.com/clinic/${id}`),
    `https://cross.twinhao.com/area/${encodeURIComponent("臺北市")}`,
    `https://cross.twinhao.com/area/${ENC_KAOHSIUNG}`,
    // 沒有地址的院所不產生縣市頁
    ...["internal_medicine", "pediatrics", "dermatology", "dentistry"].map(
      (code) => `https://cross.twinhao.com/specialty/${code}`,
    ),
  ]);
  assert.match(
    body,
    /<url>\n<loc>https:\/\/cross\.twinhao\.com\/clinic\/t1<\/loc>\n<lastmod>[^<]+<\/lastmod>\n<changefreq>weekly<\/changefreq>\n<priority>0\.8<\/priority>\n<\/url>/,
  );
  assert.match(body, /<loc>https:\/\/cross\.twinhao\.com\/specialty\/dentistry<\/loc>\n<lastmod>[^<]+<\/lastmod>\n<changefreq>weekly<\/changefreq>\n<priority>0\.7<\/priority>/);
});

test("sitemap.xml：沒有院所資料（後端失敗）→ 只輸出 16 個靜態頁並 console.warn，仍回 200", async (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const { res, body } = await getSitemap(t, [], { clinicsStatus: 503 });
  assert.equal(res.status, 200);
  const baseline = readFileSync(new URL("./support/landing/sitemap-3100.xml", import.meta.url), "utf8");
  // 基準的前 16 筆（靜態頁）原封不動，後面沒有任何動態頁
  const staticPart = baseline.slice(0, baseline.indexOf("<url>\n<loc>https://cross.twinhao.com/clinic/"));
  assert.equal(body, `${staticPart}</urlset>\n`);
  assert.equal(warn.mock.callCount(), 1);
  assert.equal(warn.mock.calls[0].arguments[0], "[sitemap] 無診所資料，僅輸出靜態頁（檢查 BACKEND_URL 與後端）");
});

// ---------- robots.txt ----------

test("robots.txt：與 3100 基準逐位元組相同，text/plain，預先產生為靜態檔", async () => {
  const mod = await import("../src/routes/robots.txt/+server.ts");
  assert.equal(mod.prerender, true);
  const res = await mod.GET();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "text/plain");
  assert.equal(await res.text(), readFileSync(new URL("./support/landing/robots-3100.txt", import.meta.url), "utf8"));
});

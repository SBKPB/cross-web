import assert from "node:assert/strict";
import test from "node:test";
import { isHttpError } from "@sveltejs/kit";
import { FALLBACK_TAXONOMY } from "../src/lib/api/service-categories.ts";
import { CLINIC_PAGE_CACHE, CLINIC_PAGE_DEGRADED_CACHE } from "../src/lib/cache-control.ts";
import {
  buildClinicJsonLd,
  buildClinicSeo,
  loadClinicDetail,
  transformClinicData,
} from "../src/lib/clinic-detail.ts";
import { DEMO_CLINIC_ID } from "../src/lib/clinic-discovery.ts";

// 移植自舊版 app/clinic/[clinic-id]/page.tsx：資料轉換、平行抓取（含 fallback）、metadata 與 JSON-LD。
// 預期值依舊版程式逐項推得，並對照 3100 基準的實際 <head>（喬鋭德鶴：other / 無 logo / 未開通線上預約）。

const ID = "c406782c-628f-411c-890c-62a3dc4a5cf0";
const ORIGIN = "https://preview.example.com";

/** 後端 /booking/clinics 清單項目（欄位同正式後端） */
const RAW = {
  id: ID,
  name: "喬鋭德鶴",
  hospital_level: "clinic",
  facility_type: "other",
  payment_type: "self_pay",
  logo: null,
  departments: ["oth_manipulation"],
  phone: "0921147832",
  address: "高雄市三民區博愛里長明街175號",
  rating: null,
  review_count: null,
  business_hours: {
    saturday: { open: "13:00", close: "21:00" },
    monday: { open: "13:00", close: "21:00", breaks: [{ start: "15:00", end: "16:00" }] },
    tuesday: { open: "13:00", close: "21:00" },
  },
  members: [{ id: "m1", name: "洪尚利", role: "therapist", main_specialties: ["全身調理"], avatar_url: null }],
  online_booking_enabled: false,
  phone_booking_enabled: true,
  show_schedule: false,
  is_featured: false,
  description: "物理治療師；傳統整復推拿技術士。",
  latitude: null,
  longitude: null,
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** 假的 event.fetch：依路徑回應，並記錄呼叫（相對路徑 = 經內部 /api/v1 代理） */
function fakeFetch(routes) {
  const calls = [];
  const fetch = async (url) => {
    calls.push(String(url));
    const handler = routes[String(url)];
    if (!handler) return json({ detail: "Not Found" }, 404);
    return handler();
  };
  return { fetch, calls };
}

const BASE = "/api/v1/booking/clinics";

test.beforeEach((t) => {
  // 後端只能經傳入的 event.fetch 走代理
  t.mock.method(globalThis, "fetch", () => assert.fail("不應呼叫全域 fetch"));
});

test("transformClinicData：營業時間依週一到週日排序並轉中文、去掉 breaks，人員與預設值照舊版", () => {
  const clinic = transformClinicData(RAW);
  assert.deepEqual(clinic.business_hours, [
    { day: "週一", open: "13:00", close: "21:00", is_closed: false },
    { day: "週二", open: "13:00", close: "21:00", is_closed: false },
    { day: "週六", open: "13:00", close: "21:00", is_closed: false },
  ]);
  assert.deepEqual(clinic.members, [
    { id: "m1", name: "洪尚利", role: "therapist", specialties: ["全身調理"], title: "治療師", avatar: undefined },
  ]);
  assert.equal(clinic.clinic_name, "喬鋭德鶴");
  assert.equal(clinic.city, "高雄市");
  assert.deepEqual(clinic.departments, ["oth_manipulation"]);
  assert.equal(clinic.logo, null);
  assert.equal(clinic.rating, undefined);
  assert.equal(clinic.online_booking_enabled, false);
  assert.equal(clinic.phone_booking_enabled, true);
  assert.equal(clinic.show_schedule, false);

  // 缺欄位時的預設值：level=clinic、線上預約開、電話預約關、時刻表開；科別退回 medical_department；facility 由人員推導
  const bare = transformClinicData({
    id: "x",
    name: "空白診所",
    address: null,
    phone: null,
    medical_department: "pediatrics",
    members: [{ id: "d", name: "醫師", role: "doctor" }],
  });
  assert.equal(bare.hospital_level, "clinic");
  assert.deepEqual(bare.departments, ["pediatrics"]);
  assert.equal(bare.business_hours, undefined);
  assert.equal(bare.online_booking_enabled, true);
  assert.equal(bare.phone_booking_enabled, false);
  assert.equal(bare.show_schedule, true);
  assert.equal(bare.is_featured, false);
  assert.equal(bare.facility_type, "healthcare");
  assert.equal(bare.members[0].title, "醫師");
});

test("loadClinicDetail：單一院所端點不存在時改從清單找，其餘資料平行抓取並映射", async () => {
  const { fetch, calls } = fakeFetch({
    [`${BASE}`]: () => json([{ id: "other", name: "別家" }, RAW]),
    [`${BASE}/${ID}/services`]: () =>
      json([
        { id: "s1", service_name: "部位調理", description: null, price: "600.00", duration_minutes: 30, category: "一般服務" },
        { id: "s2", name: "全身", price: "abc" },
      ]),
    [`${BASE}/${ID}/doctors`]: () =>
      json([
        { id: "m1", name: "洪尚利", department: "醫師", avatar_url: null, main_specialties: ["全身調理"], role: "therapist", education: [], experience: ["物理治療師"], license_type: null },
        { id: "m2", name: "王醫師", department: "家醫科", avatar_url: "https://img/x.png" },
      ]),
    [`${BASE}/${ID}/announcements`]: () => json([{ id: "a1", title: "公告", content: "內容", created_at: "2026-06-07T14:16:24Z" }]),
    [`${BASE}/${ID}/schedule`]: () => json({ week_start: "2026-10-19", week_end: "2026-10-25", week_offset: 0, entries: [] }),
  });
  const detail = await loadClinicDetail(fetch, ID);
  // 先打單一端點（404），再退回清單
  assert.ok(calls.includes(`${BASE}/${ID}`));
  assert.ok(calls.includes(BASE));
  assert.ok(calls.every((url) => url.startsWith("/api/v1/")), calls.join());
  assert.equal(detail.clinic.clinic_name, "喬鋭德鶴");
  // 有服務項目就併入 clinic.services
  assert.deepEqual(detail.clinic.services, [
    { id: "s1", name: "部位調理", description: "", price: 600, show_price: true, duration_minutes: 30, category: "一般服務" },
    { id: "s2", name: "全身", description: "", price: 0, show_price: true, duration_minutes: 30, category: "一般服務" },
  ]);
  assert.deepEqual(detail.doctorDetails, [
    { id: "m1", name: "洪尚利", role: "therapist", department: undefined, avatar: undefined, specialties: ["全身調理"], education: [], experience: ["物理治療師"], license_type: undefined },
    { id: "m2", name: "王醫師", role: "doctor", department: "家醫科", avatar: "https://img/x.png", specialties: [], education: [], experience: [], license_type: undefined },
  ]);
  assert.equal(detail.announcements.length, 1);
  assert.equal(detail.schedule.week_start, "2026-10-19");
  // show_schedule=false → 不顯示門診時刻表
  assert.equal(detail.showSchedule, false);
});

test("loadClinicDetail：單一端點成功就不打清單；排班抓不到則不顯示時刻表", async () => {
  const { fetch, calls } = fakeFetch({
    [`${BASE}/${ID}`]: () => json({ ...RAW, show_schedule: true }),
    [`${BASE}/${ID}/services`]: () => json([]),
    [`${BASE}/${ID}/doctors`]: () => json([]),
    [`${BASE}/${ID}/announcements`]: () => json([]),
  });
  const detail = await loadClinicDetail(fetch, ID);
  assert.ok(!calls.includes(BASE));
  assert.equal(detail.clinic.services, undefined, "沒有服務項目時不設定 services");
  assert.equal(detail.schedule, null);
  assert.equal(detail.showSchedule, false);
  assert.equal(detail.degraded, true, "排班抓不到（後端對上架院所一律回 200）算降級");
});

test("loadClinicDetail：找不到院所或後端全掛 → clinic 為 null，其他資料降級為空", async () => {
  const notFound = await loadClinicDetail(fakeFetch({ [BASE]: () => json([{ id: "other" }]) }).fetch, ID);
  assert.equal(notFound.clinic, null);

  const down = await loadClinicDetail(async () => {
    throw new TypeError("fetch failed");
  }, ID);
  assert.deepEqual(down, {
    clinic: null,
    schedule: null,
    showSchedule: false,
    announcements: [],
    doctorDetails: [],
    taxonomy: FALLBACK_TAXONOMY,
    degraded: true,
  });
});

/** 院所與所有子請求都成功的後端（單一院所端點照正式後端回 404，從清單找到） */
const SCHEDULE = { week_start: "2026-10-19", week_end: "2026-10-25", week_offset: 0, entries: [] };
const okRoutes = () => ({
  [BASE]: () => json([RAW]),
  [`${BASE}/${ID}/services`]: () => json([]),
  [`${BASE}/${ID}/doctors`]: () => json([]),
  [`${BASE}/${ID}/announcements`]: () => json([]),
  [`${BASE}/${ID}/schedule`]: () => json(SCHEDULE),
  "/api/v1/service-categories": () => json(FALLBACK_TAXONOMY),
});

test("loadClinicDetail：所有子請求成功 → 不算降級（單一院所端點 404 退回清單是正式後端的正常路徑）", async () => {
  const { fetch, calls } = fakeFetch(okRoutes());
  const detail = await loadClinicDetail(fetch, ID);
  assert.ok(calls.includes(`${BASE}/${ID}`), "先試單一端點");
  assert.equal(detail.clinic.clinic_name, "喬鋭德鶴");
  assert.equal(detail.degraded, false);
});

// 子請求失敗時頁面照舊版以空值顯示（服務、公告、醫師為空，時刻表不顯示，分類字彙用內建 fallback），但要標成降級
const FAILURES = {
  "HTTP 500": () => json({ detail: "boom" }, 500),
  "HTTP 404": () => json({ detail: "Not Found" }, 404),
  連線失敗: () => {
    throw new TypeError("fetch failed");
  },
  "回應不是 JSON": () => new Response("<html>bad gateway</html>", { status: 200, headers: { "content-type": "text/html" } }),
};
for (const [sub, path] of [
  ["services", `${BASE}/${ID}/services`],
  ["schedule", `${BASE}/${ID}/schedule`],
  ["announcements", `${BASE}/${ID}/announcements`],
  ["doctors", `${BASE}/${ID}/doctors`],
  ["服務分類字彙（退回 fallback）", "/api/v1/service-categories"],
]) {
  test(`loadClinicDetail：${sub} 失敗 → 以空值降級且 degraded`, async () => {
    for (const [mode, failure] of Object.entries(FAILURES)) {
      const { fetch } = fakeFetch({ ...okRoutes(), [path]: failure });
      const detail = await loadClinicDetail(fetch, ID);
      assert.equal(detail.clinic.clinic_name, "喬鋭德鶴", mode);
      assert.equal(detail.degraded, true, `${sub} ${mode}`);
    }
  });
}

test("loadClinicDetail：services / doctors 回應不是陣列（.map 丟錯）也算降級", async () => {
  for (const path of [`${BASE}/${ID}/services`, `${BASE}/${ID}/doctors`]) {
    const { fetch } = fakeFetch({ ...okRoutes(), [path]: () => json({ detail: "unexpected" }) });
    const detail = await loadClinicDetail(fetch, ID);
    assert.equal(detail.degraded, true, path);
  }
});

test("loadClinicDetail：clinicId 編碼後才放進路徑，不會被當成其他後端路徑", async () => {
  const { fetch, calls } = fakeFetch({});
  await loadClinicDetail(fetch, "../../admin/users");
  for (const url of calls) assert.ok(!url.includes("../"), url);
  assert.ok(calls.includes(`${BASE}/..%2F..%2Fadmin%2Fusers`));
});

test("buildClinicSeo：title／description／keywords／og／twitter 與 3100 基準相同", () => {
  const clinic = transformClinicData(RAW);
  const seo = buildClinicSeo(clinic, ID, FALLBACK_TAXONOMY);
  const title = "喬鋭德鶴｜高雄市傳統整復推拿線上預約";
  const description = "物理治療師；傳統整復推拿技術士。";
  assert.equal(seo.title, title);
  assert.equal(seo.description, description);
  assert.equal(seo.keywords, "喬鋭德鶴、傳統整復推拿、高雄市、線上預約、掛號");
  assert.equal(seo.canonical, `/clinic/${ID}`);
  assert.equal(seo.noindex, false);
  assert.deepEqual(seo.openGraph, {
    type: "website",
    siteName: "Cross",
    url: `https://cross.twinhao.com/clinic/${ID}`,
    title: `${title} | Cross`,
    description,
  });
  assert.deepEqual(seo.twitter, { card: "summary_large_image", title: `${title} | Cross`, description });
  // 分享圖改指 og.png，網域固定為正式站（舊版 metadataBase；不是請求來源 ORIGIN），alt / 型別 / 尺寸照舊版 opengraph-image
  assert.deepEqual(seo.image, {
    url: `https://cross.twinhao.com/clinic/${ID}/og.png`,
    alt: "診所線上預約掛號 — Cross",
    type: "image/png",
    width: 1200,
    height: 630,
  });
  assert.deepEqual(seo.jsonLd, buildClinicJsonLd(clinic, ID, FALLBACK_TAXONOMY));
});

test("buildClinicSeo：看診用「線上預約掛號」；沒自介時組合在地描述；description 最多 150 字", () => {
  const clinic = transformClinicData({
    ...RAW,
    facility_type: "healthcare",
    departments: ["family_medicine", "other", "pediatrics", "internal_medicine", "ent"],
    description: "  ",
  });
  const seo = buildClinicSeo(clinic, ID, FALLBACK_TAXONOMY);
  assert.equal(seo.title, "喬鋭德鶴｜高雄市家醫科線上預約掛號");
  assert.equal(
    seo.description,
    "喬鋭德鶴（高雄市高雄市三民區博愛里長明街175號）線上預約掛號。服務項目：家醫科、兒科、內科。電話 0921147832。查看門診時間、醫師團隊與服務項目，免打電話直接線上預約。",
  );
  assert.equal(seo.keywords, "喬鋭德鶴、家醫科、兒科、內科、高雄市、線上預約、掛號");

  const long = buildClinicSeo(transformClinicData({ ...RAW, description: "長".repeat(200) }), ID, FALLBACK_TAXONOMY);
  assert.equal(long.description, "長".repeat(150));

  // 沒有城市也沒有分類 → 主關鍵字退回大類 label；連大類都沒有就只有動作
  const noCity = transformClinicData({ ...RAW, address: null, departments: [] });
  assert.equal(buildClinicSeo(noCity, ID, FALLBACK_TAXONOMY).title, "喬鋭德鶴｜其他線上預約");
  assert.equal(
    buildClinicSeo({ ...noCity, facility_type: undefined }, ID, FALLBACK_TAXONOMY).title,
    "喬鋭德鶴｜線上預約",
  );
});

test("buildClinicSeo：示範院所 noindex 且不輸出院所 JSON-LD", () => {
  const seo = buildClinicSeo(transformClinicData({ ...RAW, id: DEMO_CLINIC_ID }), DEMO_CLINIC_ID, FALLBACK_TAXONOMY);
  assert.equal(seo.noindex, true);
  assert.equal(seo.jsonLd, undefined);
});

test("buildClinicJsonLd：MedicalClinic + 營業時間 + 麵包屑，與 3100 基準相同", () => {
  const clinic = transformClinicData(RAW);
  const url = `https://cross.twinhao.com/clinic/${ID}`;
  assert.deepEqual(buildClinicJsonLd(clinic, ID, FALLBACK_TAXONOMY), {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalClinic",
        "@id": url,
        name: "喬鋭德鶴",
        url,
        description: "物理治療師；傳統整復推拿技術士。",
        telephone: "0921147832",
        address: {
          "@type": "PostalAddress",
          streetAddress: "高雄市三民區博愛里長明街175號",
          addressCountry: "TW",
          addressLocality: "高雄市",
        },
        areaServed: "高雄市",
        medicalSpecialty: ["傳統整復推拿"],
        openingHoursSpecification: [
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "13:00", closes: "21:00" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "13:00", closes: "21:00" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "13:00", closes: "21:00" },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首頁", item: "https://cross.twinhao.com" },
          { "@type": "ListItem", position: 2, name: "診所搜尋", item: "https://cross.twinhao.com/search" },
          { "@type": "ListItem", position: 3, name: "喬鋭德鶴", item: url },
        ],
      },
    ],
  });
});

test("buildClinicJsonLd：醫美用 HealthAndBeautyBusiness 且不列 medicalSpecialty；醫師、logo、座標、評分", () => {
  const clinic = transformClinicData({
    ...RAW,
    facility_type: "aesthetic",
    departments: ["aes_laser"],
    logo: "https://img/logo.png",
    latitude: 25.03,
    longitude: 121.56,
    rating: 4.5,
    review_count: 12,
    members: [
      { id: "d1", name: "王醫師", role: "doctor", main_specialties: ["雷射", "注射"] },
      { id: "d2", name: "林醫師", role: "doctor" },
      { id: "n1", name: "護理師", role: "nurse" },
    ],
  });
  const [business] = buildClinicJsonLd(clinic, ID, FALLBACK_TAXONOMY)["@graph"];
  const url = `https://cross.twinhao.com/clinic/${ID}`;
  assert.equal(business["@type"], "HealthAndBeautyBusiness");
  assert.equal(business.medicalSpecialty, undefined);
  assert.equal(business.image, "https://img/logo.png");
  assert.equal(business.logo, "https://img/logo.png");
  assert.deepEqual(business.geo, { "@type": "GeoCoordinates", latitude: 25.03, longitude: 121.56 });
  assert.deepEqual(business.employee, [
    { "@type": "Physician", name: "王醫師", medicalSpecialty: "雷射、注射", worksFor: { "@id": url } },
    { "@type": "Physician", name: "林醫師", worksFor: { "@id": url } },
  ]);
  assert.deepEqual(business.aggregateRating, { "@type": "AggregateRating", ratingValue: 4.5, reviewCount: 12 });
  // 沒有評論數就不輸出評分
  const [noReviews] = buildClinicJsonLd({ ...clinic, review_count: 0 }, ID, FALLBACK_TAXONOMY)["@graph"];
  assert.equal(noReviews.aggregateRating, undefined);
});

test("+page.server.ts load：找到院所且子請求全部成功 → 不快取舊價格並回傳頁面資料與 seo", async () => {
  const { load } = await import("../src/routes/clinic/[id]/+page.server.ts");
  const headers = [];
  const { fetch } = fakeFetch(okRoutes());
  const data = await load({
    params: { id: ID },
    fetch,
    url: new URL(`${ORIGIN}/clinic/${ID}`),
    setHeaders: (h) => headers.push(h),
  });
  assert.deepEqual(headers, [{ "cache-control": CLINIC_PAGE_CACHE }]);
  assert.equal(CLINIC_PAGE_CACHE, "private, no-store");
  assert.equal(data.clinic.clinic_name, "喬鋭德鶴");
  assert.equal(data.isDemo, false);
  assert.equal(data.seo.title, "喬鋭德鶴｜高雄市傳統整復推拿線上預約");
  // 請求來源是 preview（ORIGIN），分享圖仍用正式網域
  assert.equal(data.seo.image.url, `https://cross.twinhao.com/clinic/${ID}/og.png`);
});

test("+page.server.ts load：任一子請求失敗而降級 → private, no-store（不進 CDN），頁面照樣渲染", async () => {
  const { load } = await import("../src/routes/clinic/[id]/+page.server.ts");
  for (const path of [`${BASE}/${ID}/services`, `${BASE}/${ID}/schedule`, "/api/v1/service-categories"]) {
    const headers = [];
    const { fetch } = fakeFetch({ ...okRoutes(), [path]: () => json({ detail: "boom" }, 503) });
    const data = await load({
      params: { id: ID },
      fetch,
      url: new URL(`${ORIGIN}/clinic/${ID}`),
      setHeaders: (h) => headers.push(h),
    });
    assert.deepEqual(headers, [{ "cache-control": CLINIC_PAGE_DEGRADED_CACHE }], path);
    assert.equal(CLINIC_PAGE_DEGRADED_CACHE, "private, no-store");
    assert.equal(data.clinic.clinic_name, "喬鋭德鶴");
  }
});

test("+page.server.ts load：找不到院所 → error(404)，且不設快取", async () => {
  const { load } = await import("../src/routes/clinic/[id]/+page.server.ts");
  const headers = [];
  const { fetch } = fakeFetch({ [BASE]: () => json([]) });
  await assert.rejects(
    load({
      params: { id: "00000000-0000-0000-0000-000000000000" },
      fetch,
      url: new URL(`${ORIGIN}/clinic/00000000-0000-0000-0000-000000000000`),
      setHeaders: (h) => headers.push(h),
    }),
    (e) => isHttpError(e, 404),
  );
  assert.deepEqual(headers, []);
});

test('院所詳情保留公開 API 的價格顯示設定，隱藏服務不被還原為公開價格',async()=>{
 const routes=okRoutes();routes[`${BASE}/${ID}/services`]=()=>json([{id:'hidden-service',service_name:'虛構療程',price:0,show_price:false,duration_minutes:30}]);
 const {fetch}=fakeFetch(routes);const detail=await loadClinicDetail(fetch,ID);
 assert.equal(detail.clinic.services[0].show_price,false);
 assert.equal(detail.clinic.services[0].duration_minutes,30);
});

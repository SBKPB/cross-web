// 在地落地頁（/area、/specialty 及其子頁）的資料整理、metadata 與 JSON-LD，
// 移植自舊 Next 的 app/area/**、app/specialty/** 的 metadata / generateMetadata 與頁面內 jsonLd。
// 純 TS 模組：node --test 直接 import，內部一律相對路徑。
import { categoryLabel, serviceCategoriesApi, type ServiceTaxonomy } from "../api/service-categories.ts";
import type { SeoProps } from "../components/Seo.svelte";
import { getAllClinics, sortForListing, type LandingClinic } from "./landing-data.ts";

type Fetch = typeof globalThis.fetch;

const SITE_URL = "https://cross.twinhao.com";

const areaPath = (city: string) => `/area/${encodeURIComponent(city)}`;
const specialtyPath = (code: string) => `/specialty/${encodeURIComponent(code)}`;

/** 舊版 app/area/page.tsx 的 metadata */
export const AREA_INDEX_SEO: SeoProps = {
  title: "各縣市診所一覽｜線上預約掛號",
  description:
    "依縣市查找台灣各地可線上預約掛號的診所。涵蓋各科別門診，查看門診時間、醫師團隊與服務項目，直接線上預約。",
  canonical: "/area",
  openGraph: {
    type: "website",
    siteName: "Cross",
    url: `${SITE_URL}/area`,
    title: "各縣市診所一覽｜線上預約掛號 | Cross",
  },
};

/** 舊版 app/specialty/page.tsx 的 metadata */
export const SPECIALTY_INDEX_SEO: SeoProps = {
  title: "各科別診所一覽｜線上預約掛號",
  description:
    "依科別查找診所：內科、皮膚科、牙科、中醫、醫美、美容等。比較各科別診所的門診時間與服務，直接線上預約掛號。",
  canonical: "/specialty",
  openGraph: {
    type: "website",
    siteName: "Cross",
    url: `${SITE_URL}/specialty`,
    title: "各科別診所一覽｜線上預約掛號 | Cross",
  },
};

/** 平行取得所有公開診所（已排除示範院所）與服務分類字彙（同舊版頁面的 Promise.all） */
export async function loadLandingData(
  fetch: Fetch,
): Promise<{ clinics: LandingClinic[]; taxonomy: ServiceTaxonomy }> {
  const [clinics, taxonomy] = await Promise.all([getAllClinics({ fetch }), serviceCategoriesApi.get({ fetch })]);
  return { clinics, taxonomy };
}

/** 科別 code 清單加上中文名（列表與快捷 chip 顯示用） */
export function withLabels(
  categories: { code: string; count: number }[],
  taxonomy: ServiceTaxonomy,
): { code: string; count: number; label: string }[] {
  return categories.map((c) => ({ ...c, label: categoryLabel(taxonomy, c.code) }));
}

/** 落地頁共用的 JSON-LD：CollectionPage + ItemList（前 50 家）+ 麵包屑（同舊版頁面內的 jsonLd） */
function collectionJsonLd(opts: {
  url: string;
  name: string;
  description: string;
  crumb: { name: string; item: string };
  current: string;
  clinics: LandingClinic[];
}): object {
  const { url, name, description, crumb, current, clinics } = opts;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name,
        description,
      },
      {
        "@type": "ItemList",
        numberOfItems: clinics.length,
        itemListElement: clinics.slice(0, 50).map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_URL}/clinic/${c.id}`,
          name: c.name,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首頁", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: crumb.name, item: crumb.item },
          { "@type": "ListItem", position: 3, name: current, item: url },
        ],
      },
    ],
  };
}

/** 某縣市的院所（精選優先、名稱排序）；縣市比對用網址參數原值（SvelteKit 已解碼一次） */
export function cityClinics(all: LandingClinic[], city: string): LandingClinic[] {
  return sortForListing(all.filter((c) => c.city === city));
}

/** 某服務子類別的院所（精選優先、名稱排序） */
export function specialtyClinics(all: LandingClinic[], code: string): LandingClinic[] {
  return sortForListing(all.filter((c) => c.departments.includes(code)));
}

/** 舊版 app/area/[city]/page.tsx 的 generateMetadata + 頁面 jsonLd（只在有院所時呼叫） */
export function buildAreaSeo(city: string, clinics: LandingClinic[]): SeoProps {
  const title = `${city}診所推薦｜線上預約掛號`;
  const description =
    `${city}共 ${clinics.length} 家診所可線上預約掛號。` +
    `查詢${city}各科別門診時間、醫師團隊與服務項目，免打電話直接線上預約。`;
  const path = areaPath(city);
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    keywords: [`${city}診所`, `${city}門診`, `${city}線上預約`, "掛號"].join("、"),
    canonical: path,
    openGraph: {
      type: "website",
      siteName: "Cross",
      url,
      title: `${title} | Cross`,
      description,
    },
    jsonLd: collectionJsonLd({
      url,
      name: `${city}診所推薦`,
      description: `${city}可線上預約掛號的診所清單`,
      crumb: { name: "地區", item: `${SITE_URL}/area` },
      current: city,
      clinics,
    }),
  };
}

/** 舊版 app/specialty/[code]/page.tsx 的 generateMetadata + buildJsonLd（只在有院所時呼叫） */
export function buildSpecialtySeo(code: string, label: string, clinics: LandingClinic[]): SeoProps {
  const title = `${label}診所推薦｜線上預約掛號`;
  const description =
    `精選 ${clinics.length} 家${label}診所，皆可線上預約掛號。` +
    `比較各${label}診所的門診時間、醫師團隊與服務項目，免打電話直接線上預約。`;
  const path = specialtyPath(code);
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    keywords: [`${label}診所`, `${label}推薦`, `${label}線上預約`, "掛號"].join("、"),
    canonical: path,
    openGraph: {
      type: "website",
      siteName: "Cross",
      url,
      title: `${title} | Cross`,
      description,
    },
    jsonLd: collectionJsonLd({
      url,
      name: `${label}診所推薦`,
      description: `可線上預約掛號的${label}診所清單`,
      crumb: { name: "科別", item: `${SITE_URL}/specialty` },
      current: label,
      clinics,
    }),
  };
}

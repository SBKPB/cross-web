// sitemap.xml 與 robots.txt 的內容（移植自舊 Next 的 app/sitemap.ts、app/robots.ts）。
// 序列化照 Next 16.4.0 的 resolveSitemap / resolveRobots（next/dist/build/webpack/loaders/metadata/resolve-route-data.js），
// 輸出與舊版逐位元組相同。純 TS 模組：node --test 直接 import，內部一律相對路徑。
import { developerDocuments } from "../developers.ts";
import { categoriesWithCounts, citiesWithCounts, type LandingClinic } from "./landing-data.ts";

const SITE = "https://cross.twinhao.com";

export type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: ChangeFrequency;
  priority: number;
}

/** 靜態頁（首頁、開發者文件、搜尋、落地頁索引、方案、加入、法律頁），順序同舊版 */
export function staticSitemapEntries(now: Date): SitemapEntry[] {
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/developers`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...developerDocuments.map(({ slug }) => ({
      url: `${SITE}/developers/docs/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    { url: `${SITE}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/area`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/specialty`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/join`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/refund`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}

/** 動態頁：診所頁 + 各縣市 / 各科別在地落地頁（最具 SEO 價值的長尾），順序同舊版 */
export function dynamicSitemapEntries(clinics: LandingClinic[], now: Date): SitemapEntry[] {
  const clinicPages = clinics.map((c) => ({
    url: `${SITE}/clinic/${c.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  const cityPages = citiesWithCounts(clinics).map((c) => ({
    url: `${SITE}/area/${encodeURIComponent(c.city)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const specialtyPages = categoriesWithCounts(clinics).map((c) => ({
    url: `${SITE}/specialty/${encodeURIComponent(c.code)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  return [...clinicPages, ...cityPages, ...specialtyPages];
}

/** Next resolveSitemap 的輸出格式（本站沒有 alternates / images / videos，只需這個子集） */
export function renderSitemap(entries: SitemapEntry[]): string {
  let content = '<?xml version="1.0" encoding="UTF-8"?>\n';
  content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const item of entries) {
    content += "<url>\n";
    content += `<loc>${item.url}</loc>\n`;
    content += `<lastmod>${item.lastModified.toISOString()}</lastmod>\n`;
    content += `<changefreq>${item.changeFrequency}</changefreq>\n`;
    content += `<priority>${item.priority}</priority>\n`;
    content += "</url>\n";
  }
  content += "</urlset>\n";
  return content;
}

/**
 * robots.txt：允許爬公開頁，擋掉私人/後台/動作型路徑（無 SEO 價值或需登入）。
 * 即舊版 robots() 回傳值經 Next resolveRobots 序列化後的內容。
 */
export const ROBOTS_TXT = [
  "User-Agent: *",
  "Allow: /",
  ...["/api/", "/admin/", "/member/", "/auth/", "/booking/"].map((path) => `Disallow: ${path}`),
  "",
  `Host: ${SITE}`,
  `Sitemap: ${SITE}/sitemap.xml`,
  "",
].join("\n");

import type { MetadataRoute } from "next";

import {
  categoriesWithCounts,
  citiesWithCounts,
  getAllClinics,
} from "@/lib/seo/landing-data";

const SITE = "https://cross.twinhao.com";

// 每小時重建一次，避免每個請求都打後端
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/area`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/specialty`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/join`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // 動態頁：診所頁 + 各縣市 / 各科別 在地落地頁（最具 SEO 價值的長尾）
  const clinics = await getAllClinics();
  if (clinics.length === 0) {
    // getAllClinics 失敗或無資料時降級：至少輸出靜態頁，並留下訊號便於排查
    console.warn("[sitemap] 無診所資料，僅輸出靜態頁（檢查 BACKEND_URL 與後端）");
    return staticPages;
  }

  const clinicPages: MetadataRoute.Sitemap = clinics.map((c) => ({
    url: `${SITE}/clinic/${c.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const cityPages: MetadataRoute.Sitemap = citiesWithCounts(clinics).map((c) => ({
    url: `${SITE}/area/${encodeURIComponent(c.city)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const specialtyPages: MetadataRoute.Sitemap = categoriesWithCounts(clinics).map(
    (c) => ({
      url: `${SITE}/specialty/${encodeURIComponent(c.code)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }),
  );

  return [...staticPages, ...clinicPages, ...cityPages, ...specialtyPages];
}

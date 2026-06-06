import type { MetadataRoute } from "next";

const SITE = "https://cross.twinhao.com";
const API_BASE_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

// 每小時重建一次，避免每個請求都打後端
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/join`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // 動態列出所有診所 /clinic/{id}（最具 SEO 價值的長尾頁）
  let clinicPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/booking/clinics`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const clinics = (await res.json()) as { id: string }[];
      clinicPages = clinics.map((c) => ({
        url: `${SITE}/clinic/${c.id}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch {
    // 後端不可用時降級：至少輸出靜態頁，sitemap 不整包失敗
  }

  return [...staticPages, ...clinicPages];
}

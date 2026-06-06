import type { MetadataRoute } from "next";

const SITE = "https://cross.twinhao.com";

// 允許爬公開頁，擋掉私人/後台/動作型路徑（無 SEO 價值或需登入）
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/member/", "/bind/", "/auth/", "/booking/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}

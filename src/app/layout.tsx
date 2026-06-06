import type { Metadata } from "next";
import { Inter, Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

// 英數字使用 Inter（更現代的 sans-serif）
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// 繁中使用 Noto Sans TC（Google 官方繁中字體，醫療產品親和度高）
const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_NAME = "Cross";
const SITE_TITLE = "Cross | 線上預約看診";
const SITE_DESC = "搜尋全台診所，24 小時線上掛號，不用再打電話排隊。";

export const metadata: Metadata = {
  metadataBase: new URL("https://cross.twinhao.com"),
  title: {
    default: SITE_TITLE,
    template: "%s | Cross",
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: [
    "線上預約",
    "線上掛號",
    "看診預約",
    "診所預約",
    "醫美預約",
    "台灣診所",
    "Cross",
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "zh_TW",
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESC,
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESC,
  },
  // 在 Vercel 設環境變數 NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION 後自動填入 GSC 驗證碼
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

// 全站結構化資料：Organization + WebSite（@id 互相連結）
const SITE_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://cross.twinhao.com/#organization",
      name: SITE_NAME,
      url: "https://cross.twinhao.com",
    },
    {
      "@type": "WebSite",
      "@id": "https://cross.twinhao.com/#website",
      name: SITE_NAME,
      url: "https://cross.twinhao.com",
      inLanguage: "zh-Hant-TW",
      publisher: { "@id": "https://cross.twinhao.com/#organization" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant-TW" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${notoSansTC.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSONLD) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";

import { citiesWithCounts, getAllClinics } from "@/lib/seo/landing-data";

const SITE_URL = "https://cross.twinhao.com";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "各縣市診所一覽｜線上預約掛號",
  description:
    "依縣市查找台灣各地可線上預約掛號的診所。涵蓋各科別門診，查看門診時間、醫師團隊與服務項目，直接線上預約。",
  alternates: { canonical: "/area" },
  openGraph: {
    type: "website",
    siteName: "Cross",
    url: `${SITE_URL}/area`,
    title: "各縣市診所一覽｜線上預約掛號 | Cross",
  },
};

export default async function AreaIndexPage() {
  const clinics = await getAllClinics();
  const cities = citiesWithCounts(clinics);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="麵包屑">
        <Link href="/" className="hover:text-primary">
          首頁
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">地區</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          各縣市診所一覽
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          選擇你所在的縣市，查看該地區可線上預約掛號的診所與各科別門診資訊。
        </p>
      </header>

      {cities.length === 0 ? (
        <p className="text-muted-foreground">目前尚無診所資料。</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cities.map(({ city, count }) => (
            <li key={city}>
              <Link
                href={`/area/${encodeURIComponent(city)}`}
                className="flex items-center justify-between gap-2 rounded-2xl bg-card px-4 py-3 ring-1 ring-border/60 transition hover:ring-primary/40"
              >
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <MapPin className="size-4 text-primary" />
                  {city}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        想依科別查找？前往{" "}
        <Link href="/specialty" className="text-primary hover:underline">
          各科別診所一覽
        </Link>
        。
      </p>
    </div>
  );
}

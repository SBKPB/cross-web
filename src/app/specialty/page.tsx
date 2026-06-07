import type { Metadata } from "next";
import Link from "next/link";
import { Stethoscope } from "lucide-react";

import {
  categoryLabel,
  serviceCategoriesApi,
} from "@/lib/api/service-categories";
import { categoriesWithCounts, getAllClinics } from "@/lib/seo/landing-data";

const SITE_URL = "https://cross.twinhao.com";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "各科別診所一覽｜線上預約掛號",
  description:
    "依科別查找診所：內科、皮膚科、牙科、中醫、醫美、美容等。比較各科別診所的門診時間與服務，直接線上預約掛號。",
  alternates: { canonical: "/specialty" },
  openGraph: {
    type: "website",
    siteName: "Cross",
    url: `${SITE_URL}/specialty`,
    title: "各科別診所一覽｜線上預約掛號 | Cross",
  },
};

export default async function SpecialtyIndexPage() {
  const [clinics, taxonomy] = await Promise.all([
    getAllClinics(),
    serviceCategoriesApi.get(),
  ]);
  const categories = categoriesWithCounts(clinics);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="麵包屑">
        <Link href="/" className="hover:text-primary">
          首頁
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">科別</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          各科別診所一覽
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          選擇科別，查看可線上預約掛號的診所與門診資訊。
        </p>
      </header>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">目前尚無診所資料。</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map(({ code, count }) => (
            <li key={code}>
              <Link
                href={`/specialty/${encodeURIComponent(code)}`}
                className="flex items-center justify-between gap-2 rounded-2xl bg-card px-4 py-3 ring-1 ring-border/60 transition hover:ring-primary/40"
              >
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <Stethoscope className="size-4 text-primary" />
                  {categoryLabel(taxonomy, code)}
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
        想依地區查找？前往{" "}
        <Link href="/area" className="text-primary hover:underline">
          各縣市診所一覽
        </Link>
        。
      </p>
    </div>
  );
}

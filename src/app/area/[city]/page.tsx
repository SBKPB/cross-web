import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LandingClinicGrid } from "@/components/seo/landing-clinic-grid";
import {
  categoryLabel,
  serviceCategoriesApi,
} from "@/lib/api/service-categories";
import {
  categoriesWithCounts,
  getAllClinics,
  sortForListing,
  type LandingClinic,
} from "@/lib/seo/landing-data";

const SITE_URL = "https://cross.twinhao.com";

// 每小時重建，隨診所資料更新
export const revalidate = 3600;

interface AreaPageProps {
  params: Promise<{ city: string }>;
}

// 只為「真的有診所」的縣市產生靜態頁（避免空頁被當薄內容/doorway）
export async function generateStaticParams() {
  const clinics = await getAllClinics();
  const cities = new Set(
    clinics.map((c) => c.city).filter((c): c is string => !!c),
  );
  return [...cities].map((city) => ({ city: encodeURIComponent(city) }));
}

async function getCityClinics(
  cityParam: string,
): Promise<{ city: string; clinics: LandingClinic[] }> {
  const city = decodeURIComponent(cityParam);
  const all = await getAllClinics();
  return { city, clinics: sortForListing(all.filter((c) => c.city === city)) };
}

export async function generateMetadata({
  params,
}: AreaPageProps): Promise<Metadata> {
  const { city: cityParam } = await params;
  const { city, clinics } = await getCityClinics(cityParam);
  if (clinics.length === 0) return { title: "找不到此地區的診所" };

  const title = `${city}診所推薦｜線上預約掛號`;
  const description =
    `${city}共 ${clinics.length} 家診所可線上預約掛號。` +
    `查詢${city}各科別門診時間、醫師團隊與服務項目，免打電話直接線上預約。`;
  const path = `/area/${encodeURIComponent(city)}`;

  return {
    title,
    description,
    keywords: [`${city}診所`, `${city}門診`, `${city}線上預約`, "掛號"].join("、"),
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "Cross",
      url: `${SITE_URL}${path}`,
      title: `${title} | Cross`,
      description,
    },
  };
}

export default async function AreaPage({ params }: AreaPageProps) {
  const { city: cityParam } = await params;
  const [{ city, clinics }, taxonomy] = await Promise.all([
    getCityClinics(cityParam),
    serviceCategoriesApi.get(),
  ]);

  if (clinics.length === 0) notFound();

  // 此縣市實際有哪些科別（給內部連結 + 在地關鍵字脈絡）
  const cityCategories = categoriesWithCounts(clinics).slice(0, 12);
  const url = `${SITE_URL}/area/${encodeURIComponent(city)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: `${city}診所推薦`,
        description: `${city}可線上預約掛號的診所清單`,
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
          {
            "@type": "ListItem",
            position: 2,
            name: "地區",
            item: `${SITE_URL}/area`,
          },
          { "@type": "ListItem", position: 3, name: city, item: url },
        ],
      },
    ],
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 麵包屑 */}
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="麵包屑">
        <Link href="/" className="hover:text-primary">
          首頁
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/area" className="hover:text-primary">
          地區
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{city}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {city}診所推薦
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          {city}共有 <strong className="text-foreground">{clinics.length}</strong>{" "}
          家診所提供線上預約掛號服務。你可以在此查看
          {cityCategories.length > 0 && (
            <>
              {" "}
              {cityCategories
                .slice(0, 5)
                .map((c) => categoryLabel(taxonomy, c.code))
                .join("、")}
              {" "}等
            </>
          )}
          各科別的門診時間、醫師團隊與服務項目，免打電話即可直接線上預約，省去等候時間。
        </p>
      </header>

      {/* 此地區科別快捷（內部連結到科別落地頁） */}
      {cityCategories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {cityCategories.map((c) => (
            <Link
              key={c.code}
              href={`/specialty/${encodeURIComponent(c.code)}`}
              className="rounded-full bg-secondary/70 px-3 py-1.5 text-sm text-foreground ring-1 ring-border/60 transition hover:ring-primary/40"
            >
              {categoryLabel(taxonomy, c.code)}
              <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                {c.count}
              </span>
            </Link>
          ))}
        </div>
      )}

      <LandingClinicGrid clinics={clinics} taxonomy={taxonomy} />
    </div>
  );
}

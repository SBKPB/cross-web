import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LandingClinicGrid } from "@/components/seo/landing-clinic-grid";
import {
  categoryLabel,
  serviceCategoriesApi,
  type ServiceTaxonomy,
} from "@/lib/api/service-categories";
import {
  citiesWithCounts,
  getAllClinics,
  sortForListing,
  type LandingClinic,
} from "@/lib/seo/landing-data";

const SITE_URL = "https://cross.twinhao.com";
export const revalidate = 3600;

interface SpecialtyPageProps {
  params: Promise<{ code: string }>;
}

// 只為「真的有診所」的服務子類別產生靜態頁
export async function generateStaticParams() {
  const clinics = await getAllClinics();
  const codes = new Set<string>();
  for (const c of clinics) {
    for (const code of c.departments) {
      if (code && code !== "other") codes.add(code);
    }
  }
  return [...codes].map((code) => ({ code: encodeURIComponent(code) }));
}

async function getSpecialtyClinics(
  codeParam: string,
): Promise<{ code: string; clinics: LandingClinic[] }> {
  const code = decodeURIComponent(codeParam);
  const all = await getAllClinics();
  return {
    code,
    clinics: sortForListing(all.filter((c) => c.departments.includes(code))),
  };
}

export async function generateMetadata({
  params,
}: SpecialtyPageProps): Promise<Metadata> {
  const { code: codeParam } = await params;
  const [{ code, clinics }, tax] = await Promise.all([
    getSpecialtyClinics(codeParam),
    serviceCategoriesApi.get(),
  ]);
  if (clinics.length === 0) return { title: "找不到此科別的診所" };

  const label = categoryLabel(tax, code);
  const title = `${label}診所推薦｜線上預約掛號`;
  const description =
    `精選 ${clinics.length} 家${label}診所，皆可線上預約掛號。` +
    `比較各${label}診所的門診時間、醫師團隊與服務項目，免打電話直接線上預約。`;
  const path = `/specialty/${encodeURIComponent(code)}`;

  return {
    title,
    description,
    keywords: [`${label}診所`, `${label}推薦`, `${label}線上預約`, "掛號"].join(
      "、",
    ),
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

function buildJsonLd(
  code: string,
  label: string,
  clinics: LandingClinic[],
): object {
  const url = `${SITE_URL}/specialty/${encodeURIComponent(code)}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: `${label}診所推薦`,
        description: `可線上預約掛號的${label}診所清單`,
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
            name: "科別",
            item: `${SITE_URL}/specialty`,
          },
          { "@type": "ListItem", position: 3, name: label, item: url },
        ],
      },
    ],
  };
}

export default async function SpecialtyPage({ params }: SpecialtyPageProps) {
  const { code: codeParam } = await params;
  const [{ code, clinics }, taxonomy]: [
    { code: string; clinics: LandingClinic[] },
    ServiceTaxonomy,
  ] = await Promise.all([
    getSpecialtyClinics(codeParam),
    serviceCategoriesApi.get(),
  ]);

  if (clinics.length === 0) notFound();

  const label = categoryLabel(taxonomy, code);
  const cities = citiesWithCounts(clinics).slice(0, 12);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildJsonLd(code, label, clinics)),
        }}
      />

      <nav className="mb-4 text-sm text-muted-foreground" aria-label="麵包屑">
        <Link href="/" className="hover:text-primary">
          首頁
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/specialty" className="hover:text-primary">
          科別
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{label}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {label}診所推薦
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          共 <strong className="text-foreground">{clinics.length}</strong> 家
          {label}診所可線上預約掛號。比較各院所的門診時間、醫師團隊與服務項目，
          挑選最適合你的{label}診所並直接線上預約。
        </p>
      </header>

      {/* 依縣市快捷（內部連結到地區落地頁） */}
      {cities.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {cities.map((c) => (
            <Link
              key={c.city}
              href={`/area/${encodeURIComponent(c.city)}`}
              className="rounded-full bg-secondary/70 px-3 py-1.5 text-sm text-foreground ring-1 ring-border/60 transition hover:ring-primary/40"
            >
              {c.city}
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

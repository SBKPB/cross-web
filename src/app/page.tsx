import { FaqSection } from "@/components/home/faq-section";
import { FeaturesSection } from "@/components/home/features-section";
import { HomeHero } from "@/components/home/home-hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { PopularClinics } from "@/components/home/popular-clinics";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { clinicsApi } from "@/lib/api/clinics";
import type { Clinic } from "@/types/clinic";

// 首頁資料每 5 分鐘重新驗證一次
export const revalidate = 300;

export default async function Home() {
  let popularClinics: Clinic[] = [];
  let totalClinics = 0;
  let cityCount = 0;
  let departmentCount = 0;

  try {
    const [popular, all] = await Promise.all([
      clinicsApi.getPopularClinics(6),
      clinicsApi.getClinics(),
    ]);
    popularClinics = popular;
    totalClinics = all.length;
    cityCount = new Set(all.map((c) => c.city).filter(Boolean)).size;
    departmentCount = new Set(all.flatMap((c) => c.departments)).size;
  } catch (error) {
    console.error("[Home] Failed to load clinics:", error);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <HomeHero
          stats={
            totalClinics > 0
              ? {
                  clinicCount: totalClinics,
                  departmentCount,
                  cityCount,
                }
              : undefined
          }
        />
        <PopularClinics clinics={popularClinics} />
        <HowItWorks />
        <FeaturesSection />
        <FaqSection />
      </main>

      <SiteFooter />
    </div>
  );
}

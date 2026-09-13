import { AppDownload } from "@/components/home/app-download";
import { FaqSection } from "@/components/home/faq-section";
import { FeaturesSection } from "@/components/home/features-section";
import { HomeHero } from "@/components/home/home-hero";
import { PartnerSection } from "@/components/home/partner-section";
import { PopularClinics } from "@/components/home/popular-clinics";
import { ServiceExplore } from "@/components/home/service-explore";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { clinicsApi } from "@/lib/api/clinics";
import { getAllClinics } from "@/lib/seo/landing-data";

// 首頁資料每 5 分鐘重新驗證一次
export const revalidate = 300;

export default async function Home() {
  const [allClinics, popularClinics] = await Promise.all([
    getAllClinics(),
    clinicsApi.getPopularClinics(6).catch((error) => {
      console.error("[Home] Failed to load clinics:", error);
      return [];
    }),
  ]);

  return (
    <div className="home-page flex min-h-screen flex-col bg-card text-foreground">
      <a href="#main-content" className="sr-only z-[100] rounded-lg bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3">跳到主要內容</a>
      <SiteHeader home />
      <main id="main-content" className="flex-1">
        <HomeHero clinics={allClinics} />
        <ServiceExplore clinics={allClinics} />
        <PopularClinics clinics={popularClinics} allClinics={allClinics} />
        <FeaturesSection />
        <AppDownload />
        <FaqSection />
        <PartnerSection />
      </main>
      <SiteFooter home />
    </div>
  );
}

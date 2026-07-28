import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppDownload } from "@/components/home/app-download";
import { CityBrowse } from "@/components/home/city-browse";
import { FaqSection } from "@/components/home/faq-section";
import { FeaturesSection } from "@/components/home/features-section";
import { HomeHero } from "@/components/home/home-hero";
import { PopularClinics } from "@/components/home/popular-clinics";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { clinicsApi } from "@/lib/api/clinics";
import type { Clinic } from "@/types/clinic";

// 首頁資料每 5 分鐘重新驗證一次
export const revalidate = 300;

export default async function Home() {
  let popularClinics: Clinic[] = [];

  try {
    popularClinics = await clinicsApi.getPopularClinics(6);
  } catch (error) {
    console.error("[Home] Failed to load clinics:", error);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <HomeHero />
        <CityBrowse />
        <PopularClinics clinics={popularClinics} />
        <FeaturesSection />
        <FaqSection />

        {/* 民眾向結尾 CTA：下載 App */}
        <AppDownload />

        {/* 醫療院所招商（輕量 band，次要） */}
        <section className="container mx-auto px-4 pb-20">
          <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-border bg-card px-6 py-6 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-semibold text-foreground">
                你是診所、醫美或美業嗎？
              </p>
              <p className="text-sm text-muted-foreground">
                加入 Cross，線上接受預約、讓更多人找到你。
              </p>
            </div>
            <Button asChild variant="outline" className="group/cta shrink-0">
              <Link href="/join">
                夥伴加入
                <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

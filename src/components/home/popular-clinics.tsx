import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categoryLabel, facilityTypeLabel, paymentLabel, serviceCategoriesApi } from "@/lib/api/service-categories";
import { citiesWithCounts, type LandingClinic } from "@/lib/seo/landing-data";
import type { Clinic } from "@/types/clinic";

export async function PopularClinics({ clinics, allClinics }: { clinics: Clinic[]; allClinics: LandingClinic[] }) {
  const taxonomy = await serviceCategoriesApi.get();
  const cities = citiesWithCounts(allClinics);

  return (
    <section id="partners" className="home-container pb-16 sm:pb-24 scroll-mt-24" aria-labelledby="clinics-title">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.7fr] lg:gap-16">
        <div>
          <p className="home-eyebrow">NEAR YOU / 認識合作店家</p>
          <h2 id="clinics-title" className="home-heading mt-3">下一站，<br className="hidden lg:block" />你的健康日常。</h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">先認識服務與團隊，再決定適不適合自己。從目前加入 Cross 的店家開始探索。</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {cities.map((city) => <Link key={city.city} href={`/area/${encodeURIComponent(city.city)}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-colors hover:border-primary hover:text-primary"><MapPin className="size-3.5" />{city.city}<span className="text-muted-foreground">{city.count} 間</span></Link>)}
          </div>
          <Link href="/search" className="mt-5 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-primary hover:underline">查看全部店家 <ArrowRight className="size-4" /></Link>
        </div>
        <div className="space-y-4">
          {clinics.length ? clinics.map((clinic) => (
            <Card key={clinic.id} className="rounded-3xl border border-border/80 py-0 shadow-none ring-0 transition-colors hover:border-primary/40">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-5">
                  <div aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#eff4fa] text-2xl font-medium text-primary dark:bg-blue-950/50 sm:size-20 sm:text-3xl">{clinic.clinic_name.slice(0, 1)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {clinic.facility_type && <Badge variant="secondary" className="rounded-full font-normal">{facilityTypeLabel(taxonomy, clinic.facility_type)}</Badge>}
                      {clinic.payment_type && <Badge variant="outline" className="rounded-full font-normal">{paymentLabel(taxonomy, clinic.payment_type)}</Badge>}
                    </div>
                    <h3 className="text-xl font-semibold sm:text-2xl"><Link href={`/clinic/${clinic.id}`} className="hover:text-primary">{clinic.clinic_name}</Link></h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{clinic.departments.map((code) => categoryLabel(taxonomy, code)).join("・") || "服務內容請見店家介紹"}</p>
                  </div>
                </div>
                {clinic.description && <p className="mt-5 line-clamp-2 text-sm leading-7 text-muted-foreground">{clinic.description}</p>}
                <div className="mt-6 flex flex-col justify-between gap-5 border-t border-border/70 pt-5 sm:flex-row sm:items-center">
                  <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground"><MapPin className="mt-1 size-4 shrink-0" />{clinic.address || "地址請見店家資訊"}</p>
                  <Button asChild variant="outline" className="h-11 shrink-0 rounded-full border-primary/20 px-5 text-primary"><Link href={`/clinic/${clinic.id}`}>認識店家 <ArrowUpRight className="size-4" /></Link></Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="rounded-3xl border border-dashed border-border bg-transparent p-8 shadow-none ring-0"><Store className="size-9 text-primary" /><div><h3 className="text-xl font-semibold">更多服務，持續加入中</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">目前暫無可顯示的合作店家。你可以先體驗預約流程，或前往搜尋頁查看最新資訊。</p><Link href="/search" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">前往搜尋 <ArrowRight className="size-4" /></Link></div></Card>
          )}
        </div>
      </div>
    </section>
  );
}

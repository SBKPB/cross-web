import Link from "next/link";
import { CheckCircle2, MapPin, ArrowUpRight } from "lucide-react";
import { HomeSearchCard } from "./home-search-card";
import { citiesWithCounts, getAllClinics } from "@/lib/seo/landing-data";
import { DEMO_CLINIC_ID } from "@/lib/clinic-discovery";

export async function HomeHero() {
  const clinics = await getAllClinics();
  const cities = citiesWithCounts(clinics);
  return (
    <section className="relative overflow-hidden border-b border-primary/10 bg-gradient-to-b from-sky-50 to-background dark:from-sky-950/40">
      <div className="pointer-events-none absolute -top-48 right-0 size-[600px] rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/10" />
      <div className="container relative mx-auto px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold tracking-wide text-primary">CROSS · 看診／醫美／美容／健康服務</p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.25] tracking-tight text-foreground sm:text-5xl lg:text-6xl">找到合適的服務，<br /><span className="text-primary">再選你的時間。</span></h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">查詢店家、團隊與服務費用。先查看可約時段，確認後再登入預約。</p>
          <div className="mt-7"><HomeSearchCard availableClinics={clinics} /></div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {["平台免費使用", "先看時段再登入", "費用由店家公開"].map((text) => <span key={text} className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" />{text}</span>)}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-5 text-sm">
            <div className="flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-1.5 text-muted-foreground"><MapPin className="size-4" />目前合作地區</span>{cities.length ? cities.map((city) => <Link key={city.city} href={`/area/${encodeURIComponent(city.city)}`} className="font-medium underline-offset-4 hover:underline">{city.city} <span className="text-muted-foreground">{city.count} 間</span></Link>) : <Link href="/search" className="text-primary">查看合作店家</Link>}</div>
            <Link href={`/booking/${DEMO_CLINIC_ID}`} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">先體驗預約流程 <ArrowUpRight className="size-4" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

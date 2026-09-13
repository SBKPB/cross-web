import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, MoveDown } from "lucide-react";
import { HomeSearchCard } from "./home-search-card";
import type { LandingClinic } from "@/lib/seo/landing-data";
import { DEMO_CLINIC_ID } from "@/lib/clinic-discovery";

export function HomeHero({ clinics }: { clinics: LandingClinic[] }) {
  return (
    <section className="relative bg-[#eff4fa] dark:bg-[#142238]" aria-labelledby="home-title">
      <div className="home-container pt-8 pb-8 sm:pt-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.12fr_1fr] lg:gap-14">
          <div className="relative z-10 py-2">
            <p className="home-eyebrow flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />你的健康生活，從這裡開始
            </p>
            <h1 id="home-title" className="mt-5 text-[clamp(2rem,10vw,2.5rem)] font-semibold leading-[1.24] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-[4.25rem]">
              留點時間，<br /><span className="text-primary">好好照顧自己。</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-8 text-muted-foreground sm:text-lg">
              從看診、醫美到日常保養，<br className="hidden sm:block" />找到合適的服務，預約剛剛好的時間。
            </p>
            <Link href={`/booking/${DEMO_CLINIC_ID}`} className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline">
              第一次使用？體驗預約流程 <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="relative hidden lg:block">
            <div className="relative aspect-[1.2] overflow-hidden rounded-[2rem_6rem_2rem_2rem]">
              <Image src="/images/cross-care-hero.webp" alt="在陽光與綠意中，為自己安排健康生活的品牌插畫" fill priority sizes="(min-width: 1024px) 520px, 100vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-4 -left-7 flex items-center gap-3 rounded-2xl border border-white/60 bg-card px-5 py-4 shadow-lg shadow-slate-900/5">
              <span className="flex size-10 items-center justify-center rounded-full bg-[#eaf2dc] text-[#405329]"><Check className="size-5" /></span>
              <div><p className="text-sm font-semibold">讓預約，配合你的生活</p><p className="mt-1 text-xs text-muted-foreground">先查看時段，確認後再登入</p></div>
            </div>
          </div>
        </div>
        <div id="find-service" className="relative z-20 mt-6 scroll-mt-28 lg:mt-10">
          <HomeSearchCard availableClinics={clinics} />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 px-1">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground sm:text-sm">
            {["搜尋與預約免平台費", "先看時段再登入", "服務費用依店家規定"].map((text) => (
              <span key={text} className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-primary" />{text}</span>
            ))}
          </div>
          <a href="#explore" className="hidden min-h-10 items-center gap-2 text-xs font-medium text-muted-foreground lg:inline-flex">往下探索 <MoveDown className="size-3.5" /></a>
        </div>
        <div className="relative mt-7 aspect-[16/7] overflow-hidden rounded-3xl lg:hidden">
          <Image src="/images/cross-care-hero.webp" alt="陽光、綠意與健康生活的 Cross 品牌插畫" fill sizes="(min-width: 1024px) 1px, 100vw" className="object-cover object-[center_45%]" />
        </div>
      </div>
    </section>
  );
}

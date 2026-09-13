import Link from "next/link";
import { ArrowUpRight, Flower2, HeartHandshake, Sparkles, Stethoscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LandingClinic } from "@/lib/seo/landing-data";

const SERVICES = [
  { type: "healthcare", title: "看診", caption: "照顧身體的每個需要", description: "各科門診・健保與自費", icon: Stethoscope, color: "bg-[#edf3ff] text-[#2758b3] dark:bg-blue-950/50 dark:text-blue-200" },
  { type: "aesthetic", title: "醫美", caption: "從專業諮詢開始", description: "醫學美容・療程諮詢", icon: Sparkles, color: "bg-[#f8eeee] text-[#9a5264] dark:bg-rose-950/40 dark:text-rose-200" },
  { type: "beauty", title: "美容", caption: "留一段時間給自己", description: "日常保養・美容護理", icon: Flower2, color: "bg-[#faf4e4] text-[#8c6a25] dark:bg-amber-950/40 dark:text-amber-200" },
  { type: "other", title: "其他健康服務", caption: "找到生活裡的好狀態", description: "傳統整復推拿等服務", icon: HeartHandshake, color: "bg-[#edf3e8] text-[#4b6840] dark:bg-green-950/40 dark:text-green-200" },
] as const;

export function ServiceExplore({ clinics }: { clinics: LandingClinic[] }) {
  return (
    <section id="explore" className="home-container home-section scroll-mt-20" aria-labelledby="explore-title">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="home-eyebrow">EXPLORE / 探索服務</p><h2 id="explore-title" className="home-heading mt-3">今天，想照顧哪一面的自己？</h2></div>
        <p className="max-w-xs text-sm leading-6 text-muted-foreground">從你的需求出發，<br className="hidden sm:block" />慢慢找到適合的選擇。</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {SERVICES.map((service) => {
          const count = clinics.filter((clinic) => clinic.facility_type === service.type).length;
          return (
            <Link key={service.type} href={`/search?type=${service.type}`} className="group rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              <Card className={`h-full gap-0 rounded-3xl py-0 shadow-none ring-0 transition-transform motion-safe:group-hover:-translate-y-1 ${service.color}`}>
                <CardContent className="flex h-full flex-col p-5 sm:p-7">
                  <div className="mb-8 flex items-start justify-between sm:mb-12"><service.icon className="size-10 stroke-[1.3] sm:size-12" aria-hidden="true" /><ArrowUpRight className="size-5 transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" /></div>
                  <p className="hidden text-xs sm:block">{service.caption}</p>
                  <h3 className="mt-2 text-lg font-semibold sm:text-2xl">{service.title}</h3>
                  <p className="mt-2 text-xs leading-6 sm:text-sm">{service.description}</p>
                  <p className="mt-6 border-t border-current/15 pt-4 text-xs font-medium">{count > 0 ? `${count} 間合作店家 · 查看店家` : "合作店家招募中"}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

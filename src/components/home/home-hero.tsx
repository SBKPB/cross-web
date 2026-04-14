import { HeroIllustration } from "./hero-illustration";
import { HomeSearchCard } from "./home-search-card";

interface HomeHeroProps {
  stats?: {
    clinicCount: number;
    departmentCount: number;
    cityCount: number;
  };
}

export function HomeHero({ stats }: HomeHeroProps) {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-accent/50 via-background to-background">
      {/* 裝飾插畫：桌機右側，手機隱藏 */}
      <div className="pointer-events-none absolute right-0 top-0 hidden lg:block w-[520px] h-[520px] -mr-20 -mt-10 opacity-90">
        <HeroIllustration />
      </div>

      <div className="container relative mx-auto px-4 pt-16 sm:pt-24 pb-12">
        {/* 標題 */}
        <div
          className="max-w-2xl mb-10 text-center lg:text-left"
          style={{ animation: "fadeInUp 0.5s ease-out both" }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight leading-[1.1] mb-5">
            看診、醫美、自費
            <br />
            <span className="text-primary">一站預約</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
            搜尋全台診所，不論是健保看診、醫美諮詢還是自費專科，24 小時都能約
          </p>
        </div>

        {/* 搜尋大卡 */}
        <div
          className="max-w-4xl mx-auto lg:mx-0"
          style={{ animation: "fadeInUp 0.5s ease-out 0.1s both" }}
        >
          <HomeSearchCard />
        </div>

        {/* 社會證明小字 */}
        {stats && stats.clinicCount > 0 && (
          <div className="mt-8 max-w-4xl mx-auto lg:mx-0 text-center lg:text-left">
            <p className="text-xs text-muted-foreground">
              ⭐ 已收錄 {stats.clinicCount} 間診所 · 涵蓋 {stats.departmentCount} 個科別 · 遍及 {stats.cityCount} 個縣市
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

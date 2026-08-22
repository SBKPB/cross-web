import { CheckCircle2, Sparkles } from "lucide-react";

import { HomeSearchCard } from "./home-search-card";

// 信任訊號（取代「數量統計」，避免店家數少時露餡）
// 註：看診・醫美・美容為服務大類；健保/自費屬付款方式，不並列為大類。
const TRUST = ["平台免費使用", "24 小時線上預約", "看診・醫美・美容"];

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-background to-background dark:from-sky-950/50">
      {/* 柔和淺色光暈（暖、可信賴、airy）。深色模式需大幅降透明度，
          否則淺色光暈疊在深底上會變成一片灰綠霧。 */}
      {/* 光暈：不只是裝飾，是玻璃搜尋卡「透出來的東西」。原本三顆全擠在上半部，
          搜尋卡背後一片空白，玻璃在淺色模式下就完全看不出來。所以刻意讓其中
          兩顆下移到卡片高度，並在淺色模式加深一階——玻璃本身維持克制不加濃，
          改成讓背景值得一看。 */}
      <div className="pointer-events-none absolute -top-24 left-[15%] size-[480px] rounded-full bg-sky-300/50 blur-3xl dark:bg-sky-500/10" />
      <div className="pointer-events-none absolute top-[22rem] left-[18%] size-[420px] rounded-full bg-primary/20 blur-3xl dark:bg-primary/12" />
      <div className="pointer-events-none absolute top-[26rem] right-[16%] size-[400px] rounded-full bg-teal-300/40 blur-3xl dark:bg-teal-500/12" />
      <div className="pointer-events-none absolute -top-10 right-[12%] size-[420px] rounded-full bg-violet-200/35 blur-3xl dark:bg-violet-500/10" />
      {/* 極淡點陣 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in srgb, var(--primary) 18%, transparent) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "linear-gradient(to bottom, black, transparent 70%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 70%)",
        }}
      />

      <div className="container relative mx-auto px-4 pt-16 pb-16 text-center sm:pt-24 sm:pb-20">
        <div
          className="mx-auto max-w-3xl"
          style={{ animation: "fadeInUp 0.5s ease-out both" }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1.5 text-xs font-medium text-primary shadow-sm ring-1 ring-primary/15">
            <Sparkles className="size-3.5" />
            全台醫療・美容線上預約
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            看診、醫美、美容
            <br />
            <span className="text-primary">一站預約</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            搜尋全台合作店家，不論是看診掛號、醫美療程還是美容諮詢，24 小時都能約。
          </p>
        </div>

        {/* 搜尋大卡 */}
        <div
          className="mx-auto mt-8 max-w-3xl"
          style={{ animation: "fadeInUp 0.5s ease-out 0.1s both" }}
        >
          <HomeSearchCard />
        </div>

        {/* 信任 chips */}
        <div
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          style={{ animation: "fadeInUp 0.5s ease-out 0.2s both" }}
        >
          {TRUST.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <CheckCircle2 className="size-4 text-primary" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { PricingTable } from "@/components/pricing/pricing-table";

export const metadata: Metadata = {
  title: "方案與定價",
  description:
    "Cross 診所方案與定價：免費建立院所資訊頁，標準方案開通線上預約與提醒，專業方案再加客戶分析與爽約風險評分，付費方案皆享 90 天免費試用。",
};

const FAQS = [
  {
    q: "可以先試用嗎？",
    a: "可以。新加入的診所都享 90 天免費全功能試用，由專人協助上架，確認合適再選擇付費方案。",
  },
  {
    q: "方案可以隨時調整嗎？",
    a: "可以。隨著營運規模成長，方案可彈性升級或調整，聯繫營運團隊即可協助處理。",
  },
  {
    q: "費用怎麼計算？",
    a: "標示價格為每月訂閱費用，且已含稅。實際開通與計費方式會在專人聯繫時為您說明清楚。",
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-linear-to-b from-accent/50 via-background to-background">
          <div className="pointer-events-none absolute -top-32 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="container relative mx-auto px-4 pt-16 pb-12 text-center sm:pt-24 sm:pb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1.5 text-xs font-medium text-primary shadow-sm ring-1 ring-primary/15">
              <Sparkles className="size-3.5" />
              方案與定價
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              選擇適合你的方案
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              所有方案都享 90 天免費試用，依診所規模彈性選擇，隨時可升級。
            </p>
          </div>
        </section>

        {/* 方案卡 */}
        <section className="container mx-auto px-4 pb-8">
          <PricingTable />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            以上為每月訂閱費用（已含稅）；新加入享 90 天免費試用，實際開通與計費方式由專人聯繫時說明。
          </p>
        </section>

        {/* FAQ */}
        <section className="container mx-auto max-w-3xl px-4 py-16 sm:py-20">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            關於方案的常見問題
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5"
              >
                <h3 className="font-semibold text-foreground">{faq.q}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 pb-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-center text-primary-foreground sm:py-16">
            <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-3xl" />
            <h2 className="relative text-2xl font-bold tracking-tight sm:text-3xl">
              準備好讓更多人找到你了嗎？
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-primary-foreground/80">
              填寫加入申請，營運團隊將在 1–2 個工作天內與您聯繫。
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="group/cta relative mt-7"
            >
              <Link href="/join">
                立即申請加入
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

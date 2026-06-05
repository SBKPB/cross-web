import type { Metadata } from "next";
import {
  Activity,
  ArrowRight,
  BellRing,
  CalendarClock,
  ClipboardList,
  Eye,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { JoinForm } from "@/components/join/join-form";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { PricingTable } from "@/components/pricing/pricing-table";

export const metadata: Metadata = {
  title: "夥伴加入",
  description:
    "診所、醫美診所、美業店家加入 Cross 預約平台：線上 24 小時預約、排程班表管理、LINE 自動提醒、人員與服務管理，觸及全台尋找醫療與美容服務的民眾。",
};

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: CalendarClock,
    title: "24 小時線上預約",
    description: "民眾隨時線上預約，不再漏接電話、不佔用櫃檯人力。",
  },
  {
    icon: ClipboardList,
    title: "排程與班表管理",
    description: "人員班表、休假與預約時段間隔，後台一站設定。",
  },
  {
    icon: BellRing,
    title: "LINE 自動提醒",
    description: "隔日預約自動發送 LINE 提醒，有效降低爽約率。",
  },
  {
    icon: Users,
    title: "人員與服務管理",
    description: "醫師、美容師、服務項目與價格集中維護。",
  },
  {
    icon: Activity,
    title: "爽約風險分析",
    description: "系統預測高風險預約，提前提醒、減少空檔損失。",
  },
  {
    icon: Eye,
    title: "分眾精準曝光",
    description: "健保 / 自費 / 醫美 / 美容分流，被對的客群看見。",
  },
];

const STEPS = [
  { title: "填寫加入申請", description: "送出下方表單，約需 2 分鐘。" },
  { title: "專人聯繫", description: "1–2 個工作天內以電話或 Email 與您確認。" },
  { title: "開通上架", description: "協助完成設定，正式於 Cross 接受預約。" },
];

const FAQS = [
  {
    q: "加入 Cross 需要費用嗎？",
    a: "民眾端使用免費；診所端依方案訂閱，月費 NT$3,000 起，且新加入享 90 天免費全功能試用。完整方案可參考上方「方案與定價」，營運團隊也會在聯繫時為您說明最適合的選擇。",
  },
  {
    q: "診所、醫美、美業都能加入嗎？",
    a: "都可以。Cross 同時收錄健保看診、自費門診、醫美與美容 / 美業（及其他健康服務），會依類型分流曝光給對應的民眾。",
  },
  {
    q: "需要更換現有的看診 / 管理系統嗎？",
    a: "不需要。Cross 主要負責「線上預約與排程曝光」，可與您現有的院內作業並行使用。",
  },
  {
    q: "上架要多久？",
    a: "送出申請後 1–2 個工作天內會有專人聯繫，確認資料並協助開通，通常數個工作天即可正式上架。",
  },
];

export default function JoinPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* ===== Hero ===== */}
        <section className="relative overflow-hidden bg-linear-to-b from-accent/50 via-background to-background">
          <div className="pointer-events-none absolute -top-32 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage:
                "radial-gradient(circle, color-mix(in srgb, var(--primary) 22%, transparent) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              maskImage: "linear-gradient(to bottom, black, transparent 70%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black, transparent 70%)",
            }}
          />

          <div className="container relative mx-auto px-4 pt-16 pb-14 text-center sm:pt-24 sm:pb-20">
            <div
              className="mx-auto max-w-3xl"
              style={{ animation: "fadeInUp 0.5s ease-out both" }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1.5 text-xs font-medium text-primary shadow-sm ring-1 ring-primary/15">
                <Sparkles className="size-3.5" />
                前 90 天免費試用
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-5xl">
                讓更多人，
                <br className="hidden sm:block" />
                <span className="text-primary">找到你的診所與門市</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                診所、醫美、美業店家都歡迎加入 Cross。線上接受預約、管理排程，
                被正在尋找服務的民眾看見。
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="group/cta w-full sm:w-auto">
                  <a href="#apply">
                    立即申請加入
                    <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-0.5" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <a href="#pricing">查看方案</a>
                </Button>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">
                90 天免費全功能試用 · 專人協助上架 · 無需綁約
              </p>
            </div>
          </div>
        </section>

        {/* ===== 功能介紹 ===== */}
        <section id="features" className="container mx-auto px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Cross 為診所做什麼
            </h2>
            <p className="mt-3 text-muted-foreground">
              把預約、排程與提醒都搬到線上，讓你專注在服務本身。
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/15"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 方案與定價 ===== */}
        <section
          id="pricing"
          className="scroll-mt-20 border-t border-border"
        >
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                透明方案，先免費試用 90 天
              </h2>
              <p className="mt-3 text-muted-foreground">
                所有方案都享 90 天免費全功能試用，確認合適再付費，隨時可升級。
              </p>
            </div>
            <div className="mt-12">
              <PricingTable ctaHref="#apply" />
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              以上為每月訂閱費用（已含稅）；新加入享 90 天免費試用，實際開通與計費方式由專人聯繫時說明。
            </p>
          </div>
        </section>

        {/* ===== 申請區：流程 + 表單 ===== */}
        <section
          id="apply"
          className="scroll-mt-20 border-t border-border bg-muted/30"
        >
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,540px)] lg:justify-center lg:gap-12">
              {/* 左：流程 */}
              <div className="space-y-8 lg:sticky lg:top-28">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    三步驟，正式加入
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    填表後由專人協助，過程簡單、無壓力。
                  </p>
                </div>
                <ol className="relative space-y-6 pl-2">
                  <span className="absolute left-[18px] top-2 bottom-2 w-px bg-border" />
                  {STEPS.map((step, i) => (
                    <li key={step.title} className="relative flex gap-4">
                      <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
                        {i + 1}
                      </span>
                      <div className="pt-1">
                        <h3 className="font-semibold text-foreground">
                          {step.title}
                        </h3>
                        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 右：表單 */}
              <div className="lg:pt-1">
                <JoinForm />
              </div>
            </div>
          </div>
        </section>

        {/* ===== 診所常見問題 ===== */}
        <section className="container mx-auto max-w-3xl px-4 py-16 sm:py-20">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              診所常見問題
            </h2>
          </div>
          <Accordion type="single" collapsible className="bg-card">
            {FAQS.map((faq, i) => (
              <AccordionItem key={faq.q} value={`item-${i}`}>
                <AccordionTrigger className="px-6 text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-6">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

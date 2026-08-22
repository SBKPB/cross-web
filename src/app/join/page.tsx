import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  BookingDemo,
  ExposureDemo,
  ReminderDemo,
  RiskDemo,
  ScheduleDemo,
  StaffDemo,
} from "@/components/join/feature-demos";
import { PatientView } from "@/components/join/patient-view";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { PricingTable } from "@/components/pricing/pricing-table";

export const metadata: Metadata = {
  title: "夥伴加入",
  description:
    "診所、醫美診所、美業店家加入 Cross 預約平台：線上 24 小時預約、排程班表管理、App 推播提醒、人員與服務管理，觸及全台尋找醫療與美容服務的民眾。",
};

const FEATURES: {
  demo: () => React.JSX.Element;
  title: string;
  description: string;
}[] = [
  {
    demo: BookingDemo,
    title: "24 小時線上預約",
    description: "櫃檯下班了預約還在進來，不再漏接電話、不佔用人力。",
  },
  {
    demo: ScheduleDemo,
    title: "排程與班表管理",
    description: "只標休假，其餘自動視為看診；要精細排診也排得出來。",
  },
  {
    demo: ReminderDemo,
    title: "App 自動提醒",
    description: "看診前一天自動推播，病人記得來，你少一個空檔。",
  },
  {
    demo: StaffDemo,
    title: "人員與服務管理",
    description: "醫師、美容師、服務項目與價格集中維護，改一次全站同步。",
  },
  {
    demo: RiskDemo,
    title: "爽約風險分析",
    description: "系統挑出高風險的那幾筆，讓你提前一通電話補回來。",
  },
  {
    demo: ExposureDemo,
    title: "分眾精準曝光",
    description: "看診 / 醫美 / 美容 / 其他分流，被正在找你的客群看見。",
  },
];

const STEPS = [
  { title: "填寫申請", description: "分三段填寫商家資料，約需 2 分鐘。" },
  {
    title: "收信驗證",
    description: "點信中連結設定後台密碼，完成信箱驗證。",
  },
  {
    title: "審核開通",
    description: "我們確認資料後開通後台，即可上架接受預約。",
  },
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
    a: "送出申請後會立刻收到驗證信，點連結設定密碼即完成申請；我們審核通過後開通後台，通常數個工作天即可正式上架。",
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
                  <Link href="/join/apply">
                    立即申請加入
                    <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-0.5" />
                  </Link>
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
                className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/15"
              >
                <f.demo />
                <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 民眾眼中的你（用真的 ClinicCard 當證據） ===== */}
        <PatientView />

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
              <PricingTable ctaHref="/join/apply" />
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              價格已含稅；年繳一次支付、等於付 10 個月。新加入享 90 天免費試用，實際開通與計費方式由專人聯繫時說明。
            </p>
          </div>
        </section>

        {/* ===== 申請區：說明流程，表單在 /join/apply ===== */}
        <section
          id="apply"
          className="scroll-mt-20 border-t border-border bg-muted/30"
        >
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                三步驟，正式加入
              </h2>
              <p className="mt-3 text-muted-foreground">
                填表約 2 分鐘，接著只要收信驗證，通過審核就能登入後台。
              </p>
            </div>
            <ol className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-col items-center gap-3">
              <Button size="lg" className="group/apply h-12 px-8 text-base" asChild>
                <Link href="/join/apply">
                  開始申請
                  <ArrowRight className="size-4 transition-transform group-hover/apply:translate-x-0.5" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                免費方案不需信用卡，隨時可升級。
              </p>
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

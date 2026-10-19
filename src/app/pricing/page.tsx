import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Braces, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/home/site-header";
import { SiteFooter } from "@/components/home/site-footer";
import { partnerContact } from "@/lib/developers";

export const metadata: Metadata = {
  title: "Cross 方案與合作",
  description:
    "Cross 預約工作流程單一方案 NT$3,000／月，設備、HIS 與客製整合依範圍報價。Design Partner 共同驗證實際流程。",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="home-container py-14 sm:py-20">
          <p className="home-eyebrow">CROSS / PLANS & COLLABORATION</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            先選流程，再確認範圍。
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
            預約工作流程使用單一 Cross
            方案。API、設備與既有系統整合，依實際接入需求共同確認。
          </p>
          <div className="mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
            <Card className="gap-0 py-0">
              <CardContent className="p-8">
                <p className="text-lg font-semibold">Cross</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  預約參考應用與日常工作流程
                </p>
                <p className="mt-7 text-4xl font-semibold tracking-tight">
                  NT$3,000
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ／月
                  </span>
                </p>
                <ul className="mt-7 space-y-4">
                  {[
                    "Web 預約與院所服務頁",
                    "排程、人員與服務管理",
                    "預約紀錄與既有提醒流程",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check
                        className="size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8 w-full">
                  <Link href="/join/apply">
                    院所預約申請 <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <p className="mt-4 text-xs leading-6 text-muted-foreground">
                  開通與計費內容由團隊確認；本頁不提供直接付款。
                </p>
              </CardContent>
            </Card>
            <Card className="gap-0 bg-accent/20 py-0 shadow-sm">
              <CardContent className="p-8">
                <Braces className="size-6 text-primary" aria-hidden="true" />
                <h2 className="mt-5 text-xl font-semibold">
                  API／HIS／設備整合
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  依機型、接收規格與工作流程另外報價。本機開發者沙盒可先驗證事件接收與原生讀回，不代表所有正式整合已提供。
                </p>
                <Button asChild variant="outline" className="mt-7">
                  <a href={partnerContact}>
                    討論整合需求 <ArrowRight aria-hidden="true" />
                  </a>
                </Button>
                <h2 className="mt-9 border-t border-border pt-6 text-lg font-semibold">
                  Design Partner Program
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  募集 3–5
                  家共同開發夥伴，免費導入試點並一起驗證成果。範圍、期間與額外整合先共同確認。
                </p>
                <Link
                  href="/join"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary"
                >
                  了解合作計畫{" "}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            既有訂閱的取消與退款，請參閱
            <Link
              href="/refund"
              className="ml-1 text-primary underline underline-offset-4"
            >
              退款政策
            </Link>
            。
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

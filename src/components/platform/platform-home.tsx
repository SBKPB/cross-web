import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  CalendarDays,
  Check,
  Cpu,
  Layers,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformFlow } from "./platform-flow";

const capabilities = [
  {
    icon: Braces,
    number: "01",
    title: "清楚的資料契約",
    description: "從來源識別、量測時間到單位，把一筆資料需要的資訊先定義清楚。",
    detail: "原生 REST API · OpenAPI",
    status: "本機沙盒可用",
  },
  {
    icon: Smartphone,
    number: "02",
    title: "共用原生 App",
    description: "先保存，再補傳。原生 App 已驗證心率與合成 ECG 的離線流程。",
    detail: "iOS · Android · 加密佇列",
    status: "開發版本已驗證",
  },
  {
    icon: Layers,
    number: "03",
    title: "保留既有系統",
    description: "從第一個機型與工作流程開始，依廠商與接收方規格逐步接入。",
    detail: "機型 adapter · HIS · FHIR",
    status: "依合作需求開發",
  },
];

export function PlatformHome() {
  return (
    <>
      <section className="relative overflow-hidden bg-background">
        <div
          className="pointer-events-none absolute -right-30 -top-24 size-150 rounded-full bg-primary/5 blur-3xl"
          aria-hidden="true"
        />
        <div className="home-container relative grid items-center gap-12 py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-24">
          <div>
            <p className="home-eyebrow">HEALTHCARE CONNECTIVITY / AIoT</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.3] tracking-tight sm:text-5xl lg:text-6xl">
              讓設備、系統與
              <br />
              <span className="text-primary">健康資料相連。</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">
              Cross 是為醫療與健康服務打造的資料連接平台。從量測接收、原生 App
              到資料交換，一起把接入流程變得更簡單。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/developers">
                  開始串接 <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/join">
                  共同設計工作流程 <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-xs leading-6 text-muted-foreground">
              Developer Preview · 先用合成資料與本機沙盒開始
            </p>
          </div>
          <PlatformFlow />
        </div>
      </section>
      <section
        id="platform"
        className="home-section scroll-mt-20 border-y border-border/60 bg-card"
      >
        <div className="home-container">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="home-eyebrow">BUILD ON CROSS</p>
              <h2 className="home-heading mt-3">你的專業，接上共同的基礎。</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-muted-foreground">
              保留原來的設備與系統，先把一個流程接好，再逐步擴展。
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {capabilities.map((item) => (
              <Card key={item.title} className="gap-0 py-0 shadow-sm">
                <CardContent className="p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/50 text-primary">
                      <item.icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.number}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-3 min-h-21 text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-5 border-t border-border pt-5 font-mono text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                  <p className="mt-3 text-xs font-medium text-primary">
                    {item.status}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="home-section bg-background">
        <div className="home-container grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <p className="home-eyebrow">ONE FLOW, END TO END</p>
            <h2 className="home-heading mt-3">
              第一筆資料，
              <br />
              從接收走到讀回。
            </h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              不用先提供設備，就能驗證一條完整路徑。文件與範例直接對應目前的沙盒契約。
            </p>
            <Button asChild variant="link" className="mt-5 px-0">
              <Link href="/developers/docs/quickstart">
                查看快速開始 <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "登錄來源",
                text: "病人與設備各有來源命名空間，保留外部識別。",
              },
              {
                title: "保存事件",
                text: "固定事件 id、時間與完整內容，離線補傳沿用原事件。",
              },
              {
                title: "接收與去重",
                text: "同一事件重送保留同一筆紀錄，內容衝突明確回報。",
              },
              {
                title: "原生讀回",
                text: "核對完整資料與波形，一致後才確認同步。",
              },
            ].map((item, index) => (
              <li
                key={item.title}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <span className="font-mono text-xs text-primary">
                  0{index + 1}
                </span>
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="border-y border-border bg-card">
        <div className="home-container grid gap-10 py-14 md:grid-cols-2 md:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-primary">
              <CalendarDays className="size-4" aria-hidden="true" />
              第一個參考應用
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              預約，也是連接的一部分。
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              既有的 Web
              預約流程繼續使用。院所頁與搜尋是附加能力，使用者可以直接在網頁完成預約。
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/search">
                前往預約服務 <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="rounded-3xl bg-muted/50 p-7">
            <Cpu className="size-6 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">
              先選一個機型，一起驗證。
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              機型連線、校正與解析依廠商規格開發。正式多租戶、Webhook 與 FHIR
              交換會按合作需求逐步交付。
            </p>
            <Link
              href="/developers/docs/vendor-onboarding"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              準備接入資料 <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <section className="home-section">
        <div className="home-container">
          <div className="rounded-4xl border border-border bg-accent/25 p-8 sm:p-12">
            <p className="home-eyebrow">CROSS DESIGN PARTNER PROGRAM</p>
            <div className="mt-4 flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <h2 className="home-heading">把下一個流程，做在一起。</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                  募集 3–5
                  家醫療院所、健康服務機構與設備夥伴，從實際需求共同設計，量化驗證能減少多少工作。
                </p>
                <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="size-4 text-primary" aria-hidden="true" />
                  範圍與驗收方式在合作前共同確認
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/join">
                  了解合作計畫 <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function JoinIntro() {
  return (
    <section className="bg-[#edf1e8] dark:bg-[#202d24]">
      <div className="home-container grid items-center gap-10 py-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20 lg:py-20">
        <div>
          <p className="home-eyebrow">FOR PARTNERS / 讓專業被看見</p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.3] tracking-tight sm:text-5xl">專業由你，<br /><span className="text-primary">預約交給 Cross。</span></h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">診所、醫美與美業店家都歡迎加入。用一個專屬頁面介紹你的服務，讓需要你的人更容易找到你。</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/join/apply">申請加入 Cross <ArrowUpRight className="size-4" /></Link></Button><Button asChild size="lg" variant="outline"><a href="#pricing">了解方案</a></Button></div>
          <p className="mt-5 text-sm text-muted-foreground">前 90 天免費試用 · 專人協助上架</p>
        </div>
        <Card className="gap-0 bg-card/90 py-0">
          <CardContent className="p-7 sm:p-9">
            <p className="home-eyebrow">準備好你的專屬店家頁</p>
            <div className="mt-6 divide-y divide-border/70">
              {[{ icon: Store, title: "介紹你的店家", text: "讓顧客知道你在哪裡、提供什麼服務" }, { icon: Users, title: "呈現服務與團隊", text: "整理專業介紹、服務內容與費用" }, { icon: CalendarDays, title: "安排預約時段", text: "依方案開通線上預約，管理日常排程" }].map((item, index) => <div key={item.title} className="flex gap-4 py-5 first:pt-0 last:pb-0"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/50 text-primary"><item.icon className="size-5" /></span><div><p className="text-xs text-muted-foreground">0{index + 1}</p><h2 className="mt-1 font-semibold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p></div></div>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

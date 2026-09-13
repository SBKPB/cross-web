import Link from "next/link";
import { ArrowUpRight, CalendarDays, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_CLINIC_ID } from "@/lib/clinic-discovery";

const STEPS = [
  { title: "找到適合的服務", description: "依地區與服務分類搜尋，先了解店家、專業團隊和服務費用。", icon: Search, detail: "不用登入，就能開始探索" },
  { title: "選一個方便的時間", description: "開通線上預約的店家，可直接查看服務、人員與目前開放的時段。", icon: CalendarDays, detail: "依店家即時開放的時段選擇" },
  { title: "登入，確認預約", description: "選好時段後再登入，確認預約對象與資料，送出後到「我的預約」查看。", icon: Check, detail: "預約資訊，隨時回來查看" },
];

export function FeaturesSection() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-[#eef3f8] dark:bg-[#142238]" aria-labelledby="steps-title">
      <div className="home-container home-section">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div><p className="home-eyebrow">HOW IT WORKS / 預約很簡單</p><h2 id="steps-title" className="home-heading mt-3">把時間留給生活，<br />把預約交給 Cross。</h2></div>
          <Button asChild variant="outline" className="h-12 w-fit rounded-full border-primary/20 bg-transparent px-6 text-primary"><Link href={`/booking/${DEMO_CLINIC_ID}`}>試走一次預約流程 <ArrowUpRight className="size-4" /></Link></Button>
        </div>
        <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative border-t border-primary/20 pt-6">
              <div className="flex items-center justify-between"><span className="text-5xl font-light tracking-tight text-primary/65">0{index + 1}</span><step.icon className="size-7 stroke-[1.4] text-primary" /></div>
              <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">{step.description}</p>
              <p className="mt-5 flex items-center gap-2 text-xs font-medium text-primary"><span className="size-1 rounded-full bg-primary" />{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

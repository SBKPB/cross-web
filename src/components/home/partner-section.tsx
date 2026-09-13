import Link from "next/link";
import { ArrowUpRight, CalendarCheck, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PartnerSection() {
  return (
    <section className="home-container pb-16 sm:pb-24" aria-labelledby="partner-title">
      <div className="grid gap-10 rounded-[2rem] bg-[#edf1e8] p-7 dark:bg-[#202d24] sm:p-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#4b6840] dark:text-green-200">FOR PARTNERS / 給專業的你</p>
          <h2 id="partner-title" className="home-heading mt-4">讓需要你的人，<br />更容易找到你。</h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">你是診所、醫美或美業店家嗎？把服務介紹、團隊與預約放在一起，讓顧客更認識你，也讓日常管理更有條理。</p>
          <div className="mt-7 flex flex-wrap gap-3"><Button asChild className="h-12 rounded-full px-6"><Link href="/join">成為 Cross 合作夥伴 <ArrowUpRight className="size-4" /></Link></Button><Button asChild variant="ghost" className="h-12 rounded-full"><Link href="/pricing">查看方案</Link></Button></div>
        </div>
        <div className="flex flex-col justify-center divide-y divide-[#4b6840]/15">
          {[{ icon: Store, title: "一個專屬的店家頁面", text: "展示服務、費用與專業團隊" }, { icon: CalendarCheck, title: "接住每一個預約需求", text: "依方案開通線上預約與排班功能" }, { icon: Users, title: "讓櫃檯管理更有條理", text: "整合預約資訊與日常作業" }].map((item) => (
            <div key={item.title} className="flex items-center gap-5 py-5 first:pt-0 last:pb-0"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/65 text-[#4b6840]"><item.icon className="size-5 stroke-[1.5]" /></span><div><h3 className="text-sm font-semibold">{item.title}</h3><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{item.text}</p></div></div>
          ))}
        </div>
      </div>
    </section>
  );
}

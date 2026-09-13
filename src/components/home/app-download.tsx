import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Heart, Search } from "lucide-react";

const APP_STORE_URL = "https://apps.apple.com/tw/app/cross/id6762545417";
const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.twinhao.cross";

export function AppDownload() {
  return (
    <section id="get-app" className="home-container home-section scroll-mt-16" aria-labelledby="app-title">
      <div className="relative grid overflow-hidden rounded-[2rem] bg-[#163b85] text-white lg:grid-cols-2">
        <div className="relative z-10 p-7 sm:p-12 lg:py-16 lg:pr-0 lg:pl-14">
          <p className="text-xs font-semibold tracking-[0.16em] text-blue-200">CROSS, ON THE GO / 行動版</p>
          <h2 id="app-title" className="mt-4 text-3xl font-semibold leading-[1.35] tracking-tight sm:text-[2.5rem]">把預約放進口袋，<br />把生活留在手上。</h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">找店家、選時間、查看預約。下載 Cross App，讓健康與美好的日常，隨時都在身邊。</p>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" aria-label="從 App Store 下載" className="rounded-lg transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><Image src="/badge-app-store.svg" alt="下載於 App Store" width={109} height={40} unoptimized className="h-12 w-auto" /></a>
            <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" aria-label="從 Google Play 下載" className="rounded-lg transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><Image src="/badge-google-play.png" alt="在 Google Play 取得" width={646} height={250} sizes="150px" className="h-[58px] w-auto" /></a>
          </div>
          <Link href="/search" className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs text-blue-100 underline-offset-4 hover:underline">也可以直接使用網頁版 <ArrowUpRight className="size-3.5" /></Link>
        </div>
        <div className="relative flex min-h-[350px] items-end justify-center overflow-hidden px-5 pt-5 lg:pt-12" aria-label="Cross App 功能示意">
          <div className="absolute bottom-[-100px] size-[440px] rounded-full border border-white/15 bg-white/5" />
          <div className="absolute bottom-[-50px] size-[340px] rounded-full border border-white/15" />
          <div className="relative w-60 translate-y-6 rotate-[8deg] rounded-[2.5rem] border-[7px] border-[#102a61] bg-[#f7f9fc] px-5 pt-6 pb-14 text-[#142238] shadow-2xl sm:w-64">
            <div className="mx-auto mb-6 h-1.5 w-14 rounded-full bg-slate-300" />
            <Image src="/cross-icon.png" alt="" width={48} height={48} className="mx-auto rounded-xl" />
            <p className="mt-3 text-center text-xl font-semibold">Cross</p>
            <p className="mt-1 text-center text-xs text-slate-500">為自己，安排美好日常</p>
            <div className="mt-7 space-y-3">
              {[{ icon: Search, title: "探索身邊的服務", sub: "從需求出發" }, { icon: CalendarDays, title: "選擇合適的時段", sub: "配合你的生活" }, { icon: Heart, title: "隨時查看我的預約", sub: "每次安排，都在手上" }].map((item) => <div key={item.title} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"><item.icon className="size-4 text-[#1d4ed8]" /><div><p className="text-xs font-semibold">{item.title}</p><p className="mt-1 text-[10px] text-slate-500">{item.sub}</p></div></div>)}
            </div>
            <p className="mt-6 text-center text-[10px] text-slate-500">功能示意 · 實際畫面以 App 為準</p>
          </div>
        </div>
      </div>
    </section>
  );
}

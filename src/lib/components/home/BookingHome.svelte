<script lang="ts">
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import CalendarDays from '@lucide/svelte/icons/calendar-days';
  import ClipboardList from '@lucide/svelte/icons/clipboard-list';
  import Clock from '@lucide/svelte/icons/clock';
  import Hospital from '@lucide/svelte/icons/hospital';
  import Search from '@lucide/svelte/icons/search';
  import Users from '@lucide/svelte/icons/users';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';

  const categories = [
    { label: '看診諮詢', type: 'healthcare' }, { label: '醫美療程', type: 'aesthetic' },
    { label: '美容美業', type: 'beauty' }, { label: '其他服務', type: 'other' },
  ];
  const steps = [
    { title: '找到適合的院所', text: '依地區或服務搜尋，先了解院所資訊、服務內容與專業人員。' },
    { title: '選擇服務與時段', text: '看診、諮詢或療程，依院所開放的服務與可預約時段安排。' },
    { title: '確認並管理預約', text: '核對資料後送出預約，之後可在「我的預約」查看與管理。' },
  ];
  const features = [
    { icon: CalendarDays, title: '諮詢與療程預約', text: '依服務設定預約時長，讓諮詢與療程各自有合適的時間安排。' },
    { icon: Users, title: '人員與排班', text: '管理服務人員、班表與休假，讓線上可預約時段配合實際排程。' },
    { icon: ClipboardList, title: '預約集中管理', text: '在同一個後台查看預約、調整安排，追蹤每一筆預約的處理狀態。' },
    { icon: Clock, title: '候診與叫號', text: '搭配院所的現場流程管理候診與叫號，公開看板使用遮罩姓名。' },
    { icon: Hospital, title: '專屬院所服務頁', text: '呈現院所介紹、服務與專業人員，讓民眾從了解院所接著完成預約。' },
    { icon: Search, title: '預約與營運統計', text: '檢視預約狀態與服務紀錄，協助院所了解日常安排。' },
  ];
</script>

<section class="overflow-hidden border-b border-border/60 bg-background">
  <div class="home-container grid items-center gap-10 py-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-20">
    <div class="min-w-0">
      <p class="home-eyebrow">CROSS / 線上預約・院所管理</p>
      <h1 class="mt-5 text-4xl font-semibold leading-[1.3] tracking-tight sm:text-5xl lg:text-6xl">把預約安排好，<br /><span class="text-primary">把時間留給照顧。</span></h1>
      <p class="mt-6 max-w-xl text-base leading-8 text-muted-foreground">從看診、醫美諮詢到療程預約，先找到適合的院所，再選擇服務與時段。讓每一次安排，都更從容。</p>
      <form action="/search" method="GET" role="search" class="mt-8 rounded-3xl border border-border bg-card p-3 shadow-sm">
        <label for="home-clinic-search" class="sr-only">搜尋院所或服務</label>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="flex min-w-0 flex-1 items-center gap-3 px-3">
            <Search class="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input id="home-clinic-search" name="q" type="search" placeholder="搜尋院所名稱、地區或服務" class="h-12 min-w-0 w-full bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" />
          </div>
          <Button type="submit" size="lg" class="shrink-0">搜尋院所 <ArrowRight aria-hidden="true" /></Button>
        </div>
      </form>
      <div class="mt-4 flex flex-wrap gap-2" aria-label="依服務類型找院所">
        {#each categories as category (category.type)}<a href={`/search?type=${category.type}`} class="rounded-full border border-border px-3.5 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary">{category.label}</a>{/each}
      </div>
      <div class="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
        <a href="/search" class="inline-flex items-center gap-2 font-medium text-primary">瀏覽所有院所 <ArrowRight class="size-4" aria-hidden="true" /></a>
        <a href="/join" class="text-muted-foreground underline-offset-4 hover:text-primary hover:underline">我是院所，了解如何導入</a>
      </div>
    </div>
    <div class="relative min-w-0 overflow-hidden rounded-4xl bg-muted">
      <img src="/images/cross-care-hero.webp" alt="使用手機安排預約，從容走進服務空間" width="1200" height="1200" fetchpriority="high" class="aspect-[1.1] w-full object-cover sm:aspect-square" />
      <div class="absolute inset-x-4 bottom-4 rounded-2xl border border-white/60 bg-white/95 p-5 text-[#102647] shadow-sm sm:inset-x-6 sm:bottom-6">
        <p class="text-xs font-medium text-[#102647]/65">你的下一次預約</p>
        <p class="mt-2 text-base font-semibold">找到院所 → 選擇時段 → 完成預約</p>
      </div>
    </div>
  </div>
</section>
<section id="how-it-works" class="home-section scroll-mt-24 bg-card">
  <div class="home-container">
    <p class="home-eyebrow">如何預約</p><h2 class="home-heading mt-3">三個步驟，安排你的下一次到訪。</h2>
    <ol class="mt-9 grid gap-5 md:grid-cols-3">{#each steps as step, index (step.title)}<li class="rounded-3xl border border-border bg-background p-7"><span class="font-mono text-sm text-primary">0{index + 1}</span><h3 class="mt-4 text-lg font-semibold">{step.title}</h3><p class="mt-3 text-sm leading-7 text-muted-foreground">{step.text}</p></li>{/each}</ol>
    <Button href="/search" class="mt-8">開始線上預約 <ArrowRight aria-hidden="true" /></Button>
  </div>
</section>
<section id="for-clinics" class="home-section scroll-mt-24 border-y border-border/60">
  <div class="home-container">
    <div class="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p class="home-eyebrow">給醫療院所與服務團隊</p><h2 class="home-heading mt-3">從接收預約，到安排每一天。</h2></div><p class="max-w-md text-sm leading-7 text-muted-foreground">把線上預約、人員排班與現場流程放在一起，讓團隊更清楚每一個安排。</p></div>
    <div class="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{#each features as feature (feature.title)}<Card class="gap-0 py-0 shadow-sm"><CardContent class="p-7"><feature.icon class="size-6 text-primary" aria-hidden="true" /><h3 class="mt-5 text-lg font-semibold">{feature.title}</h3><p class="mt-3 text-sm leading-7 text-muted-foreground">{feature.text}</p></CardContent></Card>{/each}</div>
    <p class="mt-5 text-xs leading-6 text-muted-foreground">實際開通功能依院所方案與設定提供。</p>
  </div>
</section>
<section class="home-section bg-card">
  <div class="home-container"><div class="flex flex-col justify-between gap-8 rounded-4xl border border-border bg-accent/25 p-8 sm:p-12 lg:flex-row lg:items-center"><div class="max-w-2xl"><p class="home-eyebrow">院所導入</p><h2 class="home-heading mt-4">讓下一筆預約，從 Cross 開始。</h2><p class="mt-4 text-sm leading-7 text-muted-foreground">先確認你的服務、人員與排程需求，再設定院所頁面及預約時段。看診、醫美諮詢與療程，都從實際流程開始。</p></div><div class="flex shrink-0 flex-col gap-3"><Button href="/join/apply" size="lg">申請院所導入 <ArrowRight aria-hidden="true" /></Button><Button href="/pricing" variant="outline" size="lg">查看方案與費用</Button></div></div></div>
</section>

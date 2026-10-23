<script lang="ts">
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import CalendarDays from '@lucide/svelte/icons/calendar-days';
  import Check from '@lucide/svelte/icons/check';
  import Hospital from '@lucide/svelte/icons/hospital';
  import Users from '@lucide/svelte/icons/users';
  import Seo from '$lib/components/Seo.svelte';
  import PublicFrame from '$lib/components/public/PublicFrame.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { partnerEmail } from '$lib/developers';
  let { data } = $props();
  const contact = `mailto:${partnerEmail}?subject=${encodeURIComponent('Cross 院所預約導入諮詢')}`;
  const capabilities = [
    { icon: CalendarDays, title: '諮詢與療程都能安排', text: '依服務設定預約時長，確認專業人員與可預約時段，配合院所實際作業。' },
    { icon: Users, title: '人員排班集中管理', text: '管理服務人員、班表與休假，減少分散確認排程的時間。' },
    { icon: Hospital, title: '建立院所預約入口', text: '呈現院所介紹與服務內容，讓民眾直接從網頁查看並預約。' },
  ];
  const steps = [
    { title: '填寫院所資料', text: '提供院所類型、聯絡方式與基本資訊，送出導入申請。' },
    { title: '確認服務與排程', text: '與團隊確認諮詢、療程、人員、預約時長及適合的方案。' },
    { title: '設定並開放預約', text: '完成院所頁面、服務與時段設定，確認流程後開放民眾預約。' },
  ];
</script>

<Seo {...data.seo} />
<PublicFrame>
  <section class="border-b border-border bg-card">
    <div class="home-container grid items-center gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:py-20">
      <div class="min-w-0"><p class="home-eyebrow">CROSS / 院所導入</p><h1 class="mt-5 text-4xl font-semibold leading-[1.3] tracking-tight sm:text-5xl">讓預約更有條理，<br /><span class="text-primary">讓團隊更好安排。</span></h1><p class="mt-6 max-w-xl text-base leading-8 text-muted-foreground">從看診、醫美諮詢到療程預約，Cross 協助院所建立線上預約入口，集中管理服務、人員與排班。</p><div class="mt-7 flex flex-wrap gap-3"><Button href="/join/apply" size="lg">申請院所導入 <ArrowRight aria-hidden="true" /></Button><Button href="/pricing" size="lg" variant="outline">查看方案與費用</Button></div><p class="mt-4 text-xs leading-6 text-muted-foreground">已有帳號？<a href="/admin/login" class="text-primary underline underline-offset-4">登入院所後台</a></p></div>
      <Card class="gap-0 py-0 shadow-sm"><CardContent class="p-7"><p class="home-eyebrow">從實際預約需求開始</p><h2 class="mt-4 text-xl font-semibold">先把日常流程安排好。</h2><ul class="mt-5 space-y-4">{#each ['諮詢與療程分別設定服務及時長', '依專業人員的排班開放可預約時段', '集中查看預約與處理狀態'] as text (text)}<li class="flex gap-2 text-sm leading-7"><Check class="mt-1.5 size-4 shrink-0 text-primary" aria-hidden="true" />{text}</li>{/each}</ul><p class="mt-5 border-t border-border pt-5 text-xs leading-6 text-muted-foreground">實際功能、導入範圍與費用會在開通前確認。</p></CardContent></Card>
    </div>
  </section>
  <section class="home-container py-14 sm:py-20"><p class="home-eyebrow">院所日常管理</p><h2 class="home-heading mt-3">從接收預約，到服務每一次到訪。</h2><div class="mt-8 grid gap-5 md:grid-cols-3">{#each capabilities as item (item.title)}<Card class="gap-0 py-0 shadow-sm"><CardContent class="p-7"><item.icon class="size-6 text-primary" aria-hidden="true" /><h3 class="mt-5 font-semibold">{item.title}</h3><p class="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p></CardContent></Card>{/each}</div></section>
  <section class="border-y border-border bg-card"><div class="home-container py-14"><p class="home-eyebrow">導入流程</p><h2 class="home-heading mt-3">先確認需求，再開放預約。</h2><ol class="mt-8 grid gap-6 md:grid-cols-3">{#each steps as step, index (step.title)}<li><span class="font-mono text-sm text-primary">0{index + 1}</span><h3 class="mt-3 font-semibold">{step.title}</h3><p class="mt-3 text-sm leading-7 text-muted-foreground">{step.text}</p></li>{/each}</ol></div></section>
  <section class="home-container py-14"><div class="flex flex-col justify-between gap-6 rounded-3xl bg-accent/30 p-7 sm:p-10 md:flex-row md:items-center"><div><h2 class="text-xl font-semibold">一起確認適合你的預約流程。</h2><p class="mt-3 text-sm leading-7 text-muted-foreground">告訴我們院所類型、服務內容與排程方式，從最需要的預約場景開始。</p><a href={contact} class="mt-3 inline-block text-sm text-primary underline underline-offset-4">{partnerEmail}</a></div><Button href="/join/apply" size="lg">申請院所導入 <ArrowRight aria-hidden="true" /></Button></div></section>
</PublicFrame>

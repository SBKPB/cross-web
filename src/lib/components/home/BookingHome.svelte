<script lang="ts">
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import CalendarDays from "@lucide/svelte/icons/calendar-days";
  import ClipboardList from "@lucide/svelte/icons/clipboard-list";
  import Flower2 from "@lucide/svelte/icons/flower-2";
  import Search from "@lucide/svelte/icons/search";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import Stethoscope from "@lucide/svelte/icons/stethoscope";
  import Users from "@lucide/svelte/icons/users";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { Card, CardContent } from "#lib/components/ui/card/index.ts";

  const categories = [
    { label: "看診諮詢", type: "healthcare", icon: Stethoscope },
    { label: "醫美療程", type: "aesthetic", icon: Sparkles },
    { label: "美容美業", type: "beauty", icon: Flower2 },
    { label: "其他服務", type: "other", icon: CalendarDays },
  ];
  const steps = [
    {
      icon: Search,
      title: "找到合適的院所",
      text: "搜尋地區、院所或服務，先了解再選擇。",
    },
    {
      icon: CalendarDays,
      title: "選擇服務與時間",
      text: "依院所開放的時段，安排諮詢、看診或療程。",
    },
    {
      icon: ClipboardList,
      title: "確認你的預約",
      text: "核對資料後送出，隨時到「我的預約」查看狀態。",
    },
  ];
  const clinicBenefits = [
    {
      icon: CalendarDays,
      title: "線上接收預約",
      text: "諮詢與療程，各有合適的預約時長。",
    },
    {
      icon: Users,
      title: "安排人員班表",
      text: "讓可預約時間，配合團隊實際排班。",
    },
    {
      icon: ClipboardList,
      title: "集中管理預約",
      text: "在同一個後台，掌握每一筆安排。",
    },
  ];
</script>

<section
  aria-labelledby="home-title"
  class="overflow-hidden border-b border-border/60"
>
  <div
    class="home-container grid items-center gap-8 py-9 sm:gap-10 sm:py-14 lg:grid-cols-[1.08fr_1fr] lg:gap-14 lg:py-16"
  >
    <div class="min-w-0">
      <p class="home-eyebrow">看診・醫美諮詢・療程預約</p>
      <h1
        id="home-title"
        class="mt-4 text-[clamp(2.1rem,4.2vw,3.75rem)] font-semibold leading-[1.35] tracking-tight"
      >
        預約好時間，
        <br />
        <span class="text-primary">好好照顧自己。</span>
      </h1>
      <p class="mt-5 max-w-md text-base leading-8 text-muted-foreground">
        找到合適的院所，選一個適合你的時間。
        <br class="hidden sm:block" />
        從看診到療程，下一次預約從這裡開始。
      </p>

      <form
        action="/search"
        method="GET"
        role="search"
        aria-label="搜尋預約院所"
        class="mt-7"
      >
        <label for="home-clinic-search" class="mb-2 block text-sm font-medium">
          想找哪間院所或哪種服務？
        </label>
        <div
          class="flex flex-col gap-2 rounded-3xl border border-border bg-card p-2 shadow-sm transition focus-within:border-primary/60 focus-within:ring-3 focus-within:ring-primary/10 sm:flex-row sm:items-center"
        >
          <div class="flex min-w-0 flex-1 items-center gap-2 px-3">
            <Search
              class="size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="home-clinic-search"
              name="q"
              type="search"
              enterkeyhint="search"
              placeholder="輸入院所、地區或服務"
              class="h-12 min-w-0 w-full rounded-lg bg-transparent px-1 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" size="lg" class="h-12 shrink-0 px-6">
            搜尋院所 <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </form>

      <nav
        aria-label="依服務類型找院所"
        class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {#each categories as category (category.type)}
          <a
            href={`/search?type=${category.type}`}
            class="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-transparent bg-muted/70 px-2 text-sm font-medium transition-colors hover:border-primary/25 hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <category.icon
              class="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />{category.label}
          </a>
        {/each}
      </nav>
      <div class="mt-4 flex flex-wrap items-center gap-x-3 text-sm">
        <span class="text-muted-foreground">已經有預約？</span>
        <Button href="/member" variant="link" class="min-h-11 px-0">
          查看我的預約 <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </div>

    <div
      class="relative min-w-0 overflow-hidden rounded-[2rem] bg-muted lg:rounded-[2.5rem]"
    >
      <img
        src="/images/cross-care-hero.webp"
        alt="在明亮的院所外，使用手機安排下一次預約"
        width="1200"
        height="1200"
        fetchpriority="high"
        class="aspect-[3/2] w-full object-cover object-[center_44%] sm:aspect-[4/3] lg:aspect-[1/1.08]"
      />
      <div
        class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#102647]/85 to-transparent px-6 pt-16 pb-6 text-white sm:px-8 sm:pb-8"
      >
        <p class="text-xs font-medium tracking-[0.16em] text-white/85">
          CROSS / 線上預約
        </p>
        <p class="mt-2 text-xl font-medium tracking-wide sm:text-2xl">
          留一點時間，給自己。
        </p>
      </div>
    </div>
  </div>
</section>

<section
  id="how-it-works"
  aria-labelledby="booking-steps-title"
  class="home-section scroll-mt-24 bg-card"
>
  <div class="home-container">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="home-eyebrow">如何預約</p>
        <h2 id="booking-steps-title" class="home-heading mt-2">
          三步驟，安排下一次到訪。
        </h2>
      </div>
      <Button href="/search" variant="link" class="min-h-11 px-0">
        瀏覽所有院所 <ArrowRight aria-hidden="true" />
      </Button>
    </div>
    <ol class="mt-8 grid gap-6 md:grid-cols-3 md:gap-8">
      {#each steps as step, index (step.title)}
        <li class="flex items-start gap-4 border-t border-border pt-6">
          <span
            class="relative inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary"
          >
            <step.icon class="size-5" aria-hidden="true" />
            <span
              class="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
            >
              {index + 1}
            </span>
          </span>
          <div class="min-w-0">
            <h3 class="text-base font-semibold">{step.title}</h3>
            <p class="mt-2 text-sm leading-7 text-muted-foreground">
              {step.text}
            </p>
          </div>
        </li>
      {/each}
    </ol>
    <p class="mt-6 text-xs leading-6 text-muted-foreground">
      服務項目、可預約時段與預約規則，依各院所公告為準。
    </p>
  </div>
</section>

<section
  id="for-clinics"
  aria-labelledby="clinic-intro-title"
  class="home-section scroll-mt-24 border-t border-border/60"
>
  <div class="home-container">
    <Card
      class="gap-0 rounded-[2rem] border border-border bg-card py-0 shadow-none ring-0"
    >
      <CardContent
        class="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:p-12"
      >
        <div>
          <p class="home-eyebrow">給院所與服務團隊</p>
          <h2 id="clinic-intro-title" class="home-heading mt-3">
            讓預約更有條理，
            <br />
            讓團隊更從容。
          </h2>
          <p class="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
            從專屬院所頁面到日常排班，把接收預約和團隊安排放在一起。
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <Button href="/join" size="lg">
              了解院所導入 <ArrowRight aria-hidden="true" />
            </Button>
            <Button href="/pricing" variant="outline" size="lg">
              查看方案與費用
            </Button>
          </div>
          <p class="mt-4 text-xs leading-6 text-muted-foreground">
            實際開通功能依院所方案與設定提供。
          </p>
        </div>
        <ul
          class="grid content-center gap-6 lg:border-l lg:border-border lg:pl-10"
        >
          {#each clinicBenefits as benefit (benefit.title)}
            <li class="flex items-start gap-4">
              <span
                class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"
              >
                <benefit.icon class="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3
                  class="inline-flex items-center gap-2 text-sm font-semibold"
                >
                  {benefit.title}
                </h3>
                <p class="mt-1 text-sm leading-6 text-muted-foreground">
                  {benefit.text}
                </p>
              </div>
            </li>
          {/each}
        </ul>
      </CardContent>
    </Card>
  </div>
</section>

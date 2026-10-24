<script lang="ts">
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import ArrowUpRight from "@lucide/svelte/icons/arrow-up-right";
  import MessageCircle from "@lucide/svelte/icons/message-circle";
  import CalendarDays from "@lucide/svelte/icons/calendar-days";
  import Check from "@lucide/svelte/icons/check";
  import Seo from "#lib/components/Seo.svelte";
  import SiteFooter from "#lib/components/layout/SiteFooter.svelte";
  import SiteHeader from "#lib/components/layout/SiteHeader.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Card, CardContent } from "#lib/components/ui/card/index.js";
  import { clinicLineContact } from "#lib/contact.ts";
  import { PRICING_PLANS } from "#lib/constants/pricing-constants.ts";
  import { PLAN_LABELS } from "#lib/feature-access.ts";

  let { data } = $props();
</script>

<Seo {...data.seo} />

<div class="flex min-h-screen flex-col bg-background">
  <SiteHeader />
  <main class="flex-1">
    <section class="home-container py-14 sm:py-20">
      <p class="home-eyebrow">CROSS / 院所預約方案</p>
      <h1 class="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
        用一套預約流程，安排院所日常。
      </h1>
      <p class="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
        從諮詢、療程到人員排班，先了解院所的實際需求，再確認適合的開通功能與導入安排。
      </p>
      <div class="mt-10 grid gap-6 lg:grid-cols-3">
        {#each PRICING_PLANS as plan (plan.id)}
          <Card
            class={plan.id === "standard"
              ? "relative gap-0 border-primary bg-accent/10 py-0 shadow-sm ring-1 ring-primary/20"
              : "gap-0 py-0"}
          >
            <CardContent class="flex h-full flex-col p-6 sm:p-8">
              <div class="flex min-h-7 items-center justify-between gap-3">
                <h2 class="text-xl font-semibold">{PLAN_LABELS[plan.id]}版</h2>
                {#if plan.id === "standard"}<span
                    class="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                  >
                    線上預約首選
                  </span>{/if}
              </div>
              <p class="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
                {plan.description}
              </p>
              <p class="mt-6 text-4xl font-semibold tracking-tight">
                {#if plan.monthlyPrice === 0}免費{:else}NT${plan.monthlyPrice.toLocaleString(
                    "zh-TW",
                  )}
                  <span class="ml-2 text-sm font-normal text-muted-foreground">
                    ／月
                  </span>{/if}
              </p>
              <ul class="mt-7 flex-1 space-y-4">
                {#each plan.features as feature (feature)}
                  <li class="flex items-start gap-2 text-sm leading-6">
                    <Check
                      class="mt-1 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />{feature}
                  </li>
                {/each}
              </ul>
              <Button
                href={`/join/apply?plan=${plan.id}`}
                variant={plan.id === "standard" ? "default" : "outline"}
                class="mt-8 min-h-11 w-full"
              >
                申請院所導入 <ArrowRight aria-hidden="true" />
                <span class="sr-only">（{PLAN_LABELS[plan.id]}版）</span>
              </Button>
            </CardContent>
          </Card>
        {/each}
      </div>
      <p class="mt-5 text-sm leading-7 text-muted-foreground">
        免費版可建立公開門面，管理現場與電話代訂；民眾自行選時段的線上預約，由標準版起提供。付費方案採月費計價，開通前確認方案、功能與上線安排。
      </p>
      <div class="mt-10 max-w-5xl">
        <Card class="gap-0 bg-accent/20 py-0 shadow-sm">
          <CardContent class="p-8">
            <CalendarDays class="size-6 text-primary" aria-hidden="true" />
            <h2 class="mt-5 text-xl font-semibold">先確認院所的預約需求</h2>
            <p class="mt-4 text-sm leading-7 text-muted-foreground">
              看診、醫美諮詢與療程可能有不同的時長及人員安排。導入前先確認服務、排班與院所流程，再設定線上預約入口。
            </p>
            <ul class="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>確認服務內容與預約時長</li>
              <li>整理人員、班表與休假設定</li>
              <li>確認開通功能、費用與上線安排</li>
            </ul>
            <Button
              href={clinicLineContact}
              target="_blank"
              rel="noopener noreferrer"
              class="mt-7 min-h-11 bg-[#007a35] text-white hover:bg-[#00652c]"
            >
              <MessageCircle aria-hidden="true" />LINE 導入諮詢 <ArrowUpRight
                aria-hidden="true"
              />
              <span class="sr-only">（另開視窗）</span>
            </Button>
            <a
              href="/join"
              class="mt-6 flex items-center gap-2 text-sm font-medium text-primary"
            >
              了解院所導入流程 <ArrowRight class="size-4" aria-hidden="true" />
            </a>
          </CardContent>
        </Card>
      </div>
      <p class="mt-8 text-sm text-muted-foreground">
        既有訂閱的取消與退款，請參閱
        <a
          href="/refund"
          class="ml-1 text-primary underline underline-offset-4"
        >
          退款政策
        </a>
        。
      </p>
    </section>
  </main>
  <SiteFooter />
</div>

<script lang="ts">
	import ArrowRight from "@lucide/svelte/icons/arrow-right";
	import CalendarDays from "@lucide/svelte/icons/calendar-days";
	import Check from "@lucide/svelte/icons/check";
	import Seo from "#lib/components/Seo.svelte";
	import SiteFooter from "#lib/components/layout/SiteFooter.svelte";
	import SiteHeader from "#lib/components/layout/SiteHeader.svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Card, CardContent } from "#lib/components/ui/card/index.js";
	import { partnerEmail } from "#lib/developers.ts";
	const contact = `mailto:${partnerEmail}?subject=${encodeURIComponent("Cross 院所預約方案諮詢")}`;

	let { data } = $props();

	const FEATURES = ["線上預約與專屬院所服務頁", "諮詢、療程與預約時長設定", "排程、人員與服務管理", "預約紀錄與狀態管理"];
</script>

<Seo {...data.seo} />

<div class="flex min-h-screen flex-col bg-background">
	<SiteHeader />
	<main class="flex-1">
		<section class="home-container py-14 sm:py-20">
			<p class="home-eyebrow">CROSS / 院所預約方案</p>
			<h1 class="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">用一套預約流程，安排院所日常。</h1>
			<p class="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
				從諮詢、療程到人員排班，先了解院所的實際需求，再確認適合的開通功能與導入安排。
			</p>
			<div class="mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
				<Card class="gap-0 py-0">
					<CardContent class="p-8">
						<p class="text-lg font-semibold">Cross</p>
						<p class="mt-2 text-sm text-muted-foreground">院所線上預約與日常管理</p>
						<!-- 價格與單位之間不留空白，與舊版 JSX 輸出相同 -->
						<p class="mt-7 text-4xl font-semibold tracking-tight">
							NT$3,000<span class="ml-2 text-sm font-normal text-muted-foreground">／月</span>
						</p>
						<ul class="mt-7 space-y-4">
							{#each FEATURES as feature (feature)}
								<li class="flex items-start gap-2 text-sm">
									<Check class="size-4 shrink-0 text-primary" aria-hidden="true" />{feature}
								</li>
							{/each}
						</ul>
						<Button href="/join/apply" class="mt-8 w-full">
							申請院所導入 <ArrowRight aria-hidden="true" />
						</Button>
						<p class="mt-4 text-xs leading-6 text-muted-foreground">
							開通與計費內容由團隊確認；本頁不提供直接付款。
						</p>
					</CardContent>
				</Card>
				<Card class="gap-0 bg-accent/20 py-0 shadow-sm">
					<CardContent class="p-8">
						<CalendarDays class="size-6 text-primary" aria-hidden="true" />
						<h2 class="mt-5 text-xl font-semibold">先確認院所的預約需求</h2>
						<p class="mt-4 text-sm leading-7 text-muted-foreground">看診、醫美諮詢與療程可能有不同的時長及人員安排。導入前先確認服務、排班與院所流程，再設定線上預約入口。</p>
						<ul class="mt-6 space-y-3 text-sm text-muted-foreground"><li>確認服務內容與預約時長</li><li>整理人員、班表與休假設定</li><li>確認開通功能、費用與上線安排</li></ul>
						<Button href={contact} variant="outline" class="mt-7">聯絡導入諮詢 <ArrowRight aria-hidden="true" /></Button>
						<a href="/join" class="mt-6 flex items-center gap-2 text-sm font-medium text-primary">了解院所導入流程 <ArrowRight class="size-4" aria-hidden="true" /></a>

					</CardContent>
				</Card>
			</div>
			<p class="mt-8 text-sm text-muted-foreground">
				既有訂閱的取消與退款，請參閱<a
					href="/refund"
					class="ml-1 text-primary underline underline-offset-4">退款政策</a
				>。
			</p>
		</section>
	</main>
	<SiteFooter />
</div>

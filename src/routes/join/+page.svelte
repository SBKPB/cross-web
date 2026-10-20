<script lang="ts">
	import ArrowRight from "@lucide/svelte/icons/arrow-right";
	import ArrowUpRight from "@lucide/svelte/icons/arrow-up-right";
	import Check from "@lucide/svelte/icons/check";
	import Cpu from "@lucide/svelte/icons/cpu";
	import Hospital from "@lucide/svelte/icons/hospital";
	import Workflow from "@lucide/svelte/icons/workflow";
	import Seo from "$lib/components/Seo.svelte";
	import SiteFooter from "$lib/components/layout/SiteFooter.svelte";
	import SiteHeader from "$lib/components/layout/SiteHeader.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Card, CardContent } from "$lib/components/ui/card/index.js";
	import { partnerContact, partnerEmail } from "$lib/developers";

	// 移植自舊版 app/join/page.tsx（Design Partner 招募頁）
	let { data } = $props();

	const PILOT_STEPS = ["先記錄目前流程與成本", "以合成資料驗證接入方式", "比較導入後的實際改善"];
	const PARTNERS = [
		{ icon: Hospital, title: "醫療與健康服務機構", text: "減少預約、資料轉抄或人工處理，保留既有作業系統。" },
		{ icon: Cpu, title: "設備與硬體廠商", text: "提供機型、封包或 SDK 規格，先把一條量測路徑接起來。" },
		{ icon: Workflow, title: "醫療軟體夥伴", text: "從明確的接收流程開始，依需求建立 API 或交換 adapter。" },
	];
</script>

<Seo {...data.seo} />

<div class="flex min-h-screen flex-col bg-background">
	<SiteHeader />
	<main class="flex-1">
		<section class="border-b border-border bg-card">
			<div class="home-container grid gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:py-20">
				<div>
					<p class="home-eyebrow">CROSS DESIGN PARTNER PROGRAM</p>
					<h1 class="mt-5 text-4xl font-semibold leading-[1.3] tracking-tight sm:text-5xl">
						從你的工作流程，<br /><span class="text-primary">一起把連接做好。</span>
					</h1>
					<p class="mt-6 max-w-xl text-base leading-8 text-muted-foreground">
						募集 3–5
						家醫療院所、健康服務機構與設備夥伴。先選一個場景，共同導入、驗證與調整，讓實際改善決定產品的下一步。
					</p>
					<div class="mt-7 flex flex-wrap gap-3">
						<Button href={partnerContact} size="lg">聯絡合作 <ArrowUpRight aria-hidden="true" /></Button>
						<Button href="/developers" size="lg" variant="outline"
							>先試開發者沙盒 <ArrowRight aria-hidden="true" /></Button
						>
					</div>
					<p class="mt-4 text-xs leading-6 text-muted-foreground">{partnerEmail} · 點擊聯絡合作會開啟你的郵件程式</p>
				</div>
				<Card class="gap-0 self-center py-0 shadow-sm">
					<CardContent class="p-7">
						<p class="home-eyebrow">以成果共同驗證</p>
						<h2 class="mt-4 text-xl font-semibold">免費共同導入試點</h2>
						<p class="mt-3 text-sm leading-7 text-muted-foreground">
							工作範圍、設備串接與試點期間，在合作前共同確認。額外硬體或客製整合需求另議。
						</p>
						<ul class="mt-5 space-y-3">
							{#each PILOT_STEPS as text (text)}
								<li class="flex gap-2 text-sm">
									<Check class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
									{text}
								</li>
							{/each}
						</ul>
					</CardContent>
				</Card>
			</div>
		</section>
		<section class="home-container py-14 sm:py-20">
			<p class="home-eyebrow">WHO WE BUILD WITH</p>
			<h2 class="mt-3 text-2xl font-semibold tracking-tight">從一個場景開始。</h2>
			<div class="mt-8 grid gap-5 md:grid-cols-3">
				{#each PARTNERS as item (item.title)}
					<Card class="gap-0 py-0 shadow-sm">
						<CardContent class="p-7">
							<item.icon class="size-6 text-primary" aria-hidden="true" />
							<h3 class="mt-5 font-semibold">{item.title}</h3>
							<p class="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
						</CardContent>
					</Card>
				{/each}
			</div>
		</section>
		<section class="border-y border-border bg-card">
			<div class="home-container grid gap-10 py-14 md:grid-cols-2">
				<div>
					<h2 class="text-2xl font-semibold tracking-tight">先有基線，再看改善。</h2>
					<p class="mt-4 text-sm leading-7 text-muted-foreground">
						每個試點定義相同的觀測方式與期間。若沒有明確改善，就繼續調整產品與流程。
					</p>
				</div>
				<div class="space-y-5">
					<div>
						<h3 class="text-sm font-semibold text-primary">設備與資料流程</h3>
						<p class="mt-2 text-sm leading-7 text-muted-foreground">
							接入時間、接收與補傳結果、資料衝突、人工處理次數。
						</p>
					</div>
					<div>
						<h3 class="text-sm font-semibold text-primary">預約流程</h3>
						<p class="mt-2 text-sm leading-7 text-muted-foreground">
							預約完成率、No-show rate、行政工時、人工處理次數。
						</p>
					</div>
				</div>
			</div>
		</section>
		<section class="home-container py-14">
			<div
				class="flex flex-col justify-between gap-6 rounded-3xl bg-accent/30 p-7 sm:p-10 md:flex-row md:items-center"
			>
				<div>
					<h2 class="text-xl font-semibold">已經有預約服務需求？</h2>
					<p class="mt-3 text-sm leading-7 text-muted-foreground">
						現有院所申請與 Web
						預約流程仍可使用。設備廠商請從上方合作聯絡開始。
					</p>
				</div>
				<Button href="/join/apply" variant="outline">院所預約申請 <ArrowRight aria-hidden="true" /></Button>
			</div>
		</section>
	</main>
	<SiteFooter />
</div>

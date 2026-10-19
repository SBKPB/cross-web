<script lang="ts">
	import ArrowRight from "@lucide/svelte/icons/arrow-right";
	import Braces from "@lucide/svelte/icons/braces";
	import Check from "@lucide/svelte/icons/check";
	import Seo from "$lib/components/Seo.svelte";
	import SiteFooter from "$lib/components/layout/SiteFooter.svelte";
	import SiteHeader from "$lib/components/layout/SiteHeader.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Card, CardContent } from "$lib/components/ui/card/index.js";
	import { partnerContact } from "$lib/developers";

	let { data } = $props();

	const FEATURES = ["Web 預約與院所服務頁", "排程、人員與服務管理", "預約紀錄與既有提醒流程"];
</script>

<Seo {...data.seo} />

<div class="flex min-h-screen flex-col bg-background">
	<SiteHeader />
	<main class="flex-1">
		<section class="home-container py-14 sm:py-20">
			<p class="home-eyebrow">CROSS / PLANS & COLLABORATION</p>
			<h1 class="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">先選流程，再確認範圍。</h1>
			<p class="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
				預約工作流程使用單一 Cross
				方案。API、設備與既有系統整合，依實際接入需求共同確認。
			</p>
			<div class="mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
				<Card class="gap-0 py-0">
					<CardContent class="p-8">
						<p class="text-lg font-semibold">Cross</p>
						<p class="mt-2 text-sm text-muted-foreground">預約參考應用與日常工作流程</p>
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
							院所預約申請 <ArrowRight aria-hidden="true" />
						</Button>
						<p class="mt-4 text-xs leading-6 text-muted-foreground">
							開通與計費內容由團隊確認；本頁不提供直接付款。
						</p>
					</CardContent>
				</Card>
				<Card class="gap-0 bg-accent/20 py-0 shadow-sm">
					<CardContent class="p-8">
						<Braces class="size-6 text-primary" aria-hidden="true" />
						<h2 class="mt-5 text-xl font-semibold">API／HIS／設備整合</h2>
						<p class="mt-4 text-sm leading-7 text-muted-foreground">
							依機型、接收規格與工作流程另外報價。本機開發者沙盒可先驗證事件接收與原生讀回，不代表所有正式整合已提供。
						</p>
						<Button href={partnerContact} variant="outline" class="mt-7">
							討論整合需求 <ArrowRight aria-hidden="true" />
						</Button>
						<h2 class="mt-9 border-t border-border pt-6 text-lg font-semibold">
							Design Partner Program
						</h2>
						<p class="mt-3 text-sm leading-7 text-muted-foreground">
							募集 3–5
							家共同開發夥伴，免費導入試點並一起驗證成果。範圍、期間與額外整合先共同確認。
						</p>
						<a href="/join" class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
							了解合作計畫 <ArrowRight class="size-4" aria-hidden="true" />
						</a>
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

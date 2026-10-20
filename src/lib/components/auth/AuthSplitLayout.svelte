<script lang="ts">
	import Check from "@lucide/svelte/icons/check";
	import type { Snippet } from "svelte";

	/**
	 * 登入頁共用 split-screen 版型（移植自舊版 components/auth/auth-split-layout.tsx）
	 * - 桌機（lg+）：左品牌側欄 + 右表單
	 * - 手機：僅置中表單（品牌側欄隱藏）
	 * consumer：民眾端 /auth；console：院所後台登入
	 */
	let { variant, children }: { variant: "consumer" | "console"; children: Snippet } = $props();

	const COPY = {
		consumer: {
			headline: "預約看診，從此簡單",
			subtitle: "健保、自費、醫美，一站搞定。",
			bullets: ["一站搜尋全台合作店家", "24 小時線上預約掛號", "預約紀錄一目了然"],
		},
		console: {
			headline: "院所管理 Console",
			subtitle: "線上接收預約，管理排程與人員。",
			bullets: ["24 小時線上接收預約", "排程班表與人員管理", "LINE 自動提醒，降低爽約"],
		},
	} as const;

	const copy = $derived(COPY[variant]);
	const year = new Date().getFullYear();
</script>

{#if variant === "consumer"}
	<div class="public-page grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
		<aside
			class="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#102647] p-12 text-white lg:flex"
		>
			<!-- 舊版 next/image fill + priority 的輸出 -->
			<img
				src="/images/cross-care-hero.webp"
				alt=""
				fetchpriority="high"
				decoding="async"
				class="object-cover"
				style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent"
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-[#102647] via-[#102647]/15 to-[#102647]/35"></div>
			<a href="/" class="relative flex w-fit items-center gap-3 text-xl font-semibold"
				><img
					src="/cross-icon.png"
					alt=""
					width="36"
					height="36"
					loading="lazy"
					decoding="async"
					class="rounded-xl"
				/>Cross</a
			>
			<div class="relative max-w-md pb-3">
				<p class="text-xs font-medium tracking-[0.16em] text-blue-100">YOUR EVERYDAY CARE</p>
				<h2 class="mt-4 text-4xl font-semibold leading-snug tracking-tight">留點時間，<br />好好照顧自己。</h2>
				<p class="mt-5 text-base leading-8 text-blue-100">從找到服務到管理預約，<br />每一次安排，都更從容。</p>
			</div>
		</aside>
		<main class="relative flex min-h-screen flex-col items-center justify-center px-5 py-20 sm:px-10">
			<a
				href="/"
				class="absolute top-7 left-6 inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground hover:text-primary"
				>← 返回 Cross 首頁</a
			>
			{@render children()}
			<p class="mt-7 text-xs text-muted-foreground">Cross · 你的健康日常</p>
		</main>
	</div>
{:else}
	<div class="grid min-h-screen lg:grid-cols-2">
		<!-- 左：品牌側欄 -->
		<aside
			class="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between"
		>
			<!-- 光暈 -->
			<div class="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-white/10 blur-3xl"></div>
			<div class="pointer-events-none absolute -bottom-32 -left-16 size-[360px] rounded-full bg-white/10 blur-3xl"></div>
			<!-- 點陣紋理 -->
			<div
				class="pointer-events-none absolute inset-0 opacity-[0.15]"
				style="background-image:radial-gradient(circle, white 1px, transparent 1px);background-size:24px 24px;mask-image:radial-gradient(ellipse at 30% 20%, black, transparent 75%);-webkit-mask-image:radial-gradient(ellipse at 30% 20%, black, transparent 75%)"
			></div>

			<!-- logo -->
			<a href="/" class="relative inline-flex items-center gap-2.5" aria-label="返回首頁">
				<span class="flex size-9 items-center justify-center rounded-xl bg-white/95 p-1">
					<img
						src="/cross-icon.png"
						alt="Cross"
						width="28"
						height="28"
						fetchpriority="high"
						decoding="async"
						class="size-7 rounded-md"
					/>
				</span>
				<span class="text-lg font-semibold tracking-tight">Cross</span>
			</a>

			<!-- 標語 + 賣點 -->
			<div class="relative max-w-sm">
				<h2 class="text-3xl font-bold leading-tight tracking-tight">{copy.headline}</h2>
				<p class="mt-3 text-base text-primary-foreground/80">{copy.subtitle}</p>
				<ul class="mt-8 space-y-3.5">
					{#each copy.bullets as b (b)}
						<li class="flex items-center gap-3">
							<span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/15">
								<Check class="size-3.5" strokeWidth={3} />
							</span>
							<span class="text-sm text-primary-foreground/90">{b}</span>
						</li>
					{/each}
				</ul>
			</div>

			<p class="relative text-xs text-primary-foreground/60">&copy; {year} Cross Healthcare by Twinhao</p>
		</aside>

		<!-- 右：表單 -->
		<main class="flex items-center justify-center bg-background p-4 sm:p-8">
			{@render children()}
		</main>
	</div>
{/if}

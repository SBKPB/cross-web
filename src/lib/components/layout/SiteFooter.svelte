<script lang="ts">
	import ArrowUpRight from "@lucide/svelte/icons/arrow-up-right";
	import Heart from "@lucide/svelte/icons/heart";

	type FooterLink = {
		label: string;
		href: string;
		external?: boolean;
	};

	const LINK_GROUPS: { title: string; links: FooterLink[] }[] = [
		{
			title: "預約服務",
			links: [
				{ label: "找診所", href: "/search" },
				{ label: "各縣市診所", href: "/area" },
				{ label: "各科別診所", href: "/specialty" },
				{ label: "我的預約", href: "/member" },
			],
		},
		{
			title: "醫療院所",
			links: [
				{ label: "診所登入", href: "/admin" },
				{ label: "院所導入", href: "/join" },
				{ label: "方案與定價", href: "/pricing" },
				{ label: "申請加入", href: "/join/apply" },
			],
		},
		{
			title: "關於 Cross",
			links: [
				{
					label: "隱私權政策",
					href: "https://blog.twinhao.com/5nilhs02DalcM7",
					external: true,
				},
				{ label: "服務條款", href: "/terms" },
				{ label: "退款政策", href: "/refund" },
				{ label: "開發者文件", href: "/developers" },
			],
		},
	];

	let { home = true }: { home?: boolean } = $props();

	const year = new Date().getFullYear();
	const linkClass = $derived(
		`group inline-flex min-h-8 items-center gap-1 transition-colors ${home ? "text-blue-100/75 hover:text-white" : "text-muted-foreground hover:text-primary"}`,
	);
</script>

<footer
	class={`relative overflow-hidden border-t ${home ? "border-transparent bg-[#102647] text-white" : "border-border bg-white dark:bg-card"}`}
>
	<!-- 頂部品牌色漸層細線，呼應 Cross 視覺語言 -->
	<div
		class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
	></div>

	<div class={`${home ? "home-container" : "container mx-auto px-4"} py-14`}>
		<div class="grid gap-10 lg:grid-cols-[1.4fr_2fr] lg:gap-16">
			<!-- 品牌欄 -->
			<div class="space-y-5">
				<a href="/" class="inline-flex items-center gap-2.5">
					<img
						src="/cross-icon.png"
						alt="Cross"
						width="36"
						height="36"
						loading="lazy"
						class="h-9 w-9 rounded-lg"
					/>
					<span
						class={`font-semibold tracking-tight ${home ? "text-3xl text-white" : "text-lg text-foreground"}`}
					>
						Cross
					</span>
				</a>
				<p
					class={`max-w-xs text-sm leading-7 ${home ? "text-blue-100/75" : "text-muted-foreground"}`}
				>
					從線上預約到院所日常管理，讓每一次安排更清楚，把時間留給照顧。
				</p>
			</div>

			<!-- 連結欄 -->
			<nav aria-label="頁尾導覽" class="grid grid-cols-2 gap-8 sm:grid-cols-3">
				{#each LINK_GROUPS as group (group.title)}
					<div class="space-y-3.5">
						<h4
							class={`text-xs font-semibold uppercase tracking-wider ${home ? "text-white" : "text-foreground"}`}
						>
							{group.title}
						</h4>
						<ul class="space-y-2.5 text-sm">
							{#each group.links as link (link.label)}
								<li>
									{#if link.external}
										<a href={link.href} target="_blank" rel="noopener noreferrer" class={linkClass}>
											{link.label}
											<ArrowUpRight
												class="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
											/>
										</a>
									{:else}
										<a href={link.href} class={linkClass}>
											{home && link.href === "/search" ? "探索服務" : link.label}
										</a>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</nav>
		</div>

		<!-- 底部列 -->
		<div
			class={`mt-12 flex flex-col items-center gap-3 border-t pt-6 sm:flex-row sm:justify-between ${home ? "border-white/15" : "border-border"}`}
		>
			<p class={`text-xs ${home ? "text-blue-100/65" : "text-muted-foreground"}`}>
				&copy; {year} Cross Healthcare by Twinhao. All rights reserved.
			</p>
			<p
				class={`inline-flex items-center gap-1.5 text-xs ${home ? "text-blue-100/65" : "text-muted-foreground"}`}
			>
				Made with
				<Heart class="h-3.5 w-3.5 fill-primary/80 text-primary" />
				in Taiwan
			</p>
		</div>
	</div>
</footer>

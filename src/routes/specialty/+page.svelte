<script lang="ts">
	import Stethoscope from "@lucide/svelte/icons/stethoscope";
	import Seo from "$lib/components/Seo.svelte";

	// 移植自舊 Next 的 app/specialty/page.tsx。
	// 行內元素彼此緊貼書寫：舊版 JSX 換行不產生空白，Svelte 換行會變成一個空格。
	let { data } = $props();
</script>

<Seo {...data.seo} />

<div class="home-container py-10 sm:py-14">
	<nav class="mb-4 text-sm text-muted-foreground" aria-label="麵包屑">
		<a href="/" class="hover:text-primary">首頁</a><span class="mx-1.5">/</span><span class="text-foreground"
			>科別</span
		>
	</nav>

	<header class="mb-8 rounded-3xl bg-[#eff4fa] p-6 dark:bg-[#142238] sm:p-10">
		<h1 class="text-3xl font-semibold leading-snug tracking-tight text-foreground sm:text-4xl">各科別診所一覽</h1>
		<p class="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
			選擇科別，查看可線上預約掛號的診所與門診資訊。
		</p>
	</header>

	{#if data.categories.length === 0}
		<p class="text-muted-foreground">目前尚無診所資料。</p>
	{:else}
		<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{#each data.categories as { code, count, label } (code)}
				<li>
					<a
						href={`/specialty/${encodeURIComponent(code)}`}
						class="flex items-center justify-between gap-2 rounded-3xl border border-border/80 bg-card px-5 py-6 transition hover:border-primary/40 hover:bg-accent/20"
					>
						<span class="flex items-center gap-2 font-medium text-foreground"
							><Stethoscope class="size-4 text-primary" />{label}</span
						>
						<span class="text-sm text-muted-foreground tabular-nums">{count}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<p class="mt-8 text-sm text-muted-foreground">
		想依地區查找？前往 <a href="/area" class="text-primary hover:underline">各縣市診所一覽</a>。
	</p>
</div>

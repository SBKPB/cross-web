<script lang="ts">
	import MapPin from "@lucide/svelte/icons/map-pin";
	import Seo from "$lib/components/Seo.svelte";

	// 移植自舊 Next 的 app/area/page.tsx。
	// 行內元素彼此緊貼書寫：舊版 JSX 換行不產生空白，Svelte 換行會變成一個空格。
	let { data } = $props();
</script>

<Seo {...data.seo} />

<div class="home-container py-10 sm:py-14">
	<nav class="mb-4 text-sm text-muted-foreground" aria-label="麵包屑">
		<a href="/" class="hover:text-primary">首頁</a><span class="mx-1.5">/</span><span class="text-foreground"
			>地區</span
		>
	</nav>

	<header class="mb-8 rounded-3xl bg-[#eff4fa] p-6 dark:bg-[#142238] sm:p-10">
		<h1 class="text-3xl font-semibold leading-snug tracking-tight text-foreground sm:text-4xl">各縣市診所一覽</h1>
		<p class="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
			選擇你所在的縣市，查看該地區可線上預約掛號的診所與各科別門診資訊。
		</p>
	</header>

	{#if data.cities.length === 0}
		<p class="text-muted-foreground">目前尚無診所資料。</p>
	{:else}
		<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{#each data.cities as { city, count } (city)}
				<li>
					<a
						href={`/area/${encodeURIComponent(city)}`}
						class="flex items-center justify-between gap-2 rounded-3xl border border-border/80 bg-card px-5 py-6 transition hover:border-primary/40 hover:bg-accent/20"
					>
						<span class="flex items-center gap-2 font-medium text-foreground"
							><MapPin class="size-4 text-primary" />{city}</span
						>
						<span class="text-sm text-muted-foreground tabular-nums">{count}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<p class="mt-8 text-sm text-muted-foreground">
		想依科別查找？前往 <a href="/specialty" class="text-primary hover:underline">各科別診所一覽</a>。
	</p>
</div>

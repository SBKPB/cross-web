<script lang="ts">
	import Seo from "#lib/components/Seo.svelte";
	import LandingClinicGrid from "#lib/components/seo/LandingClinicGrid.svelte";

	// 移植自舊 Next 的 app/specialty/[code]/page.tsx。
	// 行內元素與文字彼此緊貼書寫：舊版 JSX 換行不產生空白，Svelte 換行會變成一個空格。
	// 介紹文舊版跨兩行的文字，JSX 會在換行處留一個空格（「服務項目， 挑選」），照樣保留。
	let { data } = $props();
</script>

<!-- metadata 與 JSON-LD 由 Seo 放進 <head>；舊版 JSON-LD 在 body，爬蟲讀到的內容相同 -->
<Seo {...data.seo} />

<div class="home-container py-10 sm:py-14">
	<nav class="mb-4 text-sm text-muted-foreground" aria-label="麵包屑">
		<a href="/" class="hover:text-primary">首頁</a><span class="mx-1.5">/</span><a
			href="/specialty"
			class="hover:text-primary">科別</a
		><span class="mx-1.5">/</span><span class="text-foreground">{data.label}</span>
	</nav>

	<header class="mb-8 rounded-3xl bg-[#eff4fa] p-6 dark:bg-[#142238] sm:p-10">
		<h1 class="text-3xl font-semibold leading-snug tracking-tight text-foreground sm:text-4xl">{data.label}診所推薦</h1>
		<p class="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
			共 <strong class="text-foreground">{data.clinics.length}</strong> 家{data.label}診所可線上預約掛號。比較各院所的門診時間、醫師團隊與服務項目， 挑選最適合你的{data.label}診所並直接線上預約。
		</p>
	</header>

	<!-- 依縣市快捷（內部連結到地區落地頁） -->
	{#if data.cities.length > 0}
		<div class="mb-8 flex flex-wrap gap-2">
			{#each data.cities as c (c.city)}
				<a
					href={`/area/${encodeURIComponent(c.city)}`}
					class="rounded-full bg-secondary/70 px-3 py-1.5 text-sm text-foreground ring-1 ring-border/60 transition hover:ring-primary/40"
					>{c.city}<span class="ml-1 text-xs text-muted-foreground tabular-nums">{c.count}</span></a
				>
			{/each}
		</div>
	{/if}

	<LandingClinicGrid clinics={data.clinics} taxonomy={data.taxonomy} />
</div>

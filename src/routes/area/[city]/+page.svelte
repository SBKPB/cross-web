<script lang="ts">
	import Seo from "#lib/components/Seo.svelte";
	import LandingClinicGrid from "#lib/components/seo/LandingClinicGrid.svelte";

	// 移植自舊 Next 的 app/area/[city]/page.tsx。
	// 行內元素與文字彼此緊貼書寫：舊版 JSX 換行不產生空白，Svelte 換行會變成一個空格。
	// 「… 等」整段放在一個運算式裡：Svelte 會修剪區塊開頭的空白，寫成 {#if} 會吃掉前導空格。
	let { data } = $props();
</script>

<!-- metadata 與 JSON-LD 由 Seo 放進 <head>；舊版 JSON-LD 在 body，爬蟲讀到的內容相同 -->
<Seo {...data.seo} />

<div class="home-container py-10 sm:py-14">
	<!-- 麵包屑 -->
	<nav class="mb-4 text-sm text-muted-foreground" aria-label="麵包屑">
		<a href="/" class="hover:text-primary">首頁</a><span class="mx-1.5">/</span><a
			href="/area"
			class="hover:text-primary">地區</a
		><span class="mx-1.5">/</span><span class="text-foreground">{data.city}</span>
	</nav>

	<header class="mb-8 rounded-3xl bg-[#eff4fa] p-6 dark:bg-[#142238] sm:p-10">
		<h1 class="text-3xl font-semibold leading-snug tracking-tight text-foreground sm:text-4xl">{data.city}診所推薦</h1>
		<p class="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
			{data.city}共有 <strong class="text-foreground">{data.clinics.length}</strong> 家診所提供線上預約掛號服務。你可以在此查看{data.cityCategories.length > 0 ? ` ${data.intro} 等` : ""}各科別的門診時間、醫師團隊與服務項目，免打電話即可直接線上預約，省去等候時間。
		</p>
	</header>

	<!-- 此地區科別快捷（內部連結到科別落地頁） -->
	{#if data.cityCategories.length > 0}
		<div class="mb-8 flex flex-wrap gap-2">
			{#each data.cityCategories as c (c.code)}
				<a
					href={`/specialty/${encodeURIComponent(c.code)}`}
					class="rounded-full bg-secondary/70 px-3 py-1.5 text-sm text-foreground ring-1 ring-border/60 transition hover:ring-primary/40"
					>{c.label}<span class="ml-1 text-xs text-muted-foreground tabular-nums">{c.count}</span></a
				>
			{/each}
		</div>
	{/if}

	<LandingClinicGrid clinics={data.clinics} taxonomy={data.taxonomy} />
</div>

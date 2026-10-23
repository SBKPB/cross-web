<script lang="ts">
	import SiteFooter from "#lib/components/layout/SiteFooter.svelte";
	import SiteHeader from "#lib/components/layout/SiteHeader.svelte";

	// 對應舊版 app/area/layout.tsx：在地落地頁原本是沒有 header / footer 的裸頁，只靠麵包屑回上層；
	// 首頁的縣市入口把落地頁變成主要導覽目的地後補上站台外框。
	// 外框標記照舊版（main 沒有 PublicFrame 的 id 與 min-w-0），不共用 PublicFrame。
	let { children } = $props();
</script>

<div class="public-page flex min-h-screen flex-col bg-background">
	<SiteHeader />
	<main class="flex-1">{@render children()}</main>
	<SiteFooter />
</div>

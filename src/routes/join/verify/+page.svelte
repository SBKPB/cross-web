<script lang="ts">
	import { onMount } from "svelte";
	import Seo from "#lib/components/Seo.svelte";
	import VerifyForm from "#lib/components/join/VerifyForm.svelte";
	import SiteFooter from "#lib/components/layout/SiteFooter.svelte";
	import SiteHeader from "#lib/components/layout/SiteHeader.svelte";
	import PageIntro from "#lib/components/public/PageIntro.svelte";

	// 移植自舊版 app/join/verify/page.tsx：VerifyForm 讀 ?token=，舊版包在 Suspense 裡，伺服器端只輸出「載入中…」。
	// 這裡同樣在掛載後才渲染表單（伺服器 HTML 與 token 無關，可安全進 CDN 快取）。
	let { data } = $props();
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});
</script>

<Seo {...data.seo} />

<div class="public-page flex min-h-screen flex-col bg-background">
	<SiteHeader />
	<main class="flex-1">
		<PageIntro
			compact
			eyebrow="CROSS PARTNERS / 信箱驗證"
			title="完成信箱驗證"
			description="驗證信箱後，設定你的後台登入密碼。"
		/>
		<div class="flex items-center justify-center px-4 py-12 sm:py-16">
			{#if mounted}
				<VerifyForm />
			{:else}
				<div class="text-sm text-muted-foreground">載入中…</div>
			{/if}
		</div>
	</main>
	<SiteFooter />
</div>

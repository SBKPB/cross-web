<script lang="ts">
	import "../app.css";
	import { onMount } from "svelte";
	import { ModeWatcher } from "mode-watcher";
	import { beforeNavigate } from "$app/navigation";
	import { page } from "$app/state";
	import { env } from "$env/dynamic/public";
	import { setAuth } from "$lib/auth/auth.svelte";
	import SessionExpiredDialog from "$lib/components/auth/SessionExpiredDialog.svelte";
	import Seo, { SITE_NAME, SITE_URL } from "$lib/components/Seo.svelte";
	import { createSmoothScrollPause } from "$lib/navigation/smooth-scroll";
	import { jsonLdScript } from "$lib/seo/serialize-json-ld";

	let { children } = $props();

	const auth = setAuth();
	onMount(() => auth.init());

	// 對應舊版 <html data-scroll-behavior="smooth">：除了同 path + search 的純 hash 導航外，換頁期間暫停 CSS 平滑捲動，
	// 新頁面直接回到頂端，不會從上一頁的位置慢慢滑上去；navigation.complete settle 時還原（含被取消或中止）。
	beforeNavigate(createSmoothScrollPause(() => document.documentElement));

	// 全站結構化資料：Organization + WebSite（@id 互相連結）
	const SITE_JSONLD = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "Organization",
				"@id": `${SITE_URL}/#organization`,
				name: SITE_NAME,
				url: SITE_URL,
			},
			{
				"@type": "WebSite",
				"@id": `${SITE_URL}/#website`,
				name: SITE_NAME,
				url: SITE_URL,
				inLanguage: "zh-Hant-TW",
				publisher: { "@id": `${SITE_URL}/#organization` },
			},
		],
	};
</script>

<svelte:head>
	<meta name="application-name" content={SITE_NAME} />
	<!-- keywords 由 Seo 輸出（頁面可覆寫，預設為全站值） -->
	<!-- 在 Vercel 設環境變數 NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION 後自動填入 GSC 驗證碼 -->
	{#if env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
		<meta name="google-site-verification" content={env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />
	{/if}
	<link rel="icon" href="/favicon.ico" sizes="64x64" type="image/x-icon" />
	<link rel="icon" href="/icon.png" sizes="512x512" type="image/png" />
	<link rel="apple-touch-icon" href="/apple-icon.png" sizes="180x180" type="image/png" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html jsonLdScript(SITE_JSONLD)}
</svelte:head>

<!-- 主題：亮 / 暗 / 跟隨系統，以 <html class="dark"> 套用；首屏初始化腳本在 app.html，這裡不重複注入 -->
<ModeWatcher modeStorageKey="theme" defaultMode="system" disableTransitions disableHeadScriptInjection />

<!-- 頁面沒有提供 seo（例如需登入的頁面）時輸出全站預設 metadata，與舊版 root layout 相同 -->
{#if !page.data.seo}
	<Seo canonical="/" />
{/if}

{@render children()}

<SessionExpiredDialog open={auth.showSessionExpiredDialog} onConfirm={auth.confirmSessionExpired} />

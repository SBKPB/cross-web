<script lang="ts">
	import "../app.css";
	import { onMount } from "svelte";
	import { ModeWatcher } from "mode-watcher";
	import { browser } from "$app/environment";
	import { beforeNavigate } from "$app/navigation";
	import { page } from "$app/state";
	import { env } from "$env/dynamic/public";
	import { setAuth } from "$lib/auth/auth.svelte";
	import SessionExpiredDialog from "$lib/components/auth/SessionExpiredDialog.svelte";
	import Seo, { SITE_NAME, SITE_URL } from "$lib/components/Seo.svelte";
	import { resetFavoritesOnUserChange } from "$lib/hooks/favorites.svelte";
	import { createSmoothScrollPause } from "$lib/navigation/smooth-scroll";
	import { jsonLdScript } from "$lib/seo/serialize-json-ld";

	let { children } = $props();

	const auth = setAuth();
	onMount(() => auth.init());

	// 使用者身分變動（登入 / 登出 / 換帳號）即重置模組級收藏快取，
	// 避免上一位使用者的收藏狀態殘留到下一位（跨帳號資料外洩）。對應舊版 AuthProvider 的 useEffect [user?.id]。
	resetFavoritesOnUserChange(() => auth.user?.id);

	// 對應舊版 <html data-scroll-behavior="smooth">：除了同 path + search 的純 hash 導航外，換頁期間暫停 CSS 平滑捲動，
	// 新頁面直接回到頂端，不會從上一頁的位置慢慢滑上去；navigation.complete settle 時還原（含被取消或中止），
	// 從 bfcache 還原（pageshow persisted）時重置。SSR 期間沒有 window，不註冊 pageshow（beforeNavigate 也只在瀏覽器端觸發）。
	beforeNavigate(createSmoothScrollPause(() => document.documentElement, browser ? window : undefined));

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
	<!-- 頁面 load 丟出的錯誤（如找不到院所的 404）不輸出：舊版 notFound() 回應的伺服器 HTML 沒有這段；
	     找不到路由（route.id 為 null）的 404 舊版有輸出，照舊 -->
	<!-- 舊版文件設定 dynamicParams=false，未知 slug 等同找不到路由，仍保留全站結構化資料。 -->
	{#if !page.error || page.route.id === null || (page.status === 404 && page.route.id === '/developers/docs/[slug]')}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html jsonLdScript(SITE_JSONLD)}
	{/if}
</svelte:head>

<!-- 主題：亮 / 暗 / 跟隨系統，以 <html class="dark"> 套用；首屏初始化腳本在 app.html，這裡不重複注入 -->
<ModeWatcher modeStorageKey="theme" defaultMode="system" disableTransitions disableHeadScriptInjection />

<!-- 頁面沒有提供 seo（例如需登入的頁面）時輸出全站預設 metadata，與舊版 root layout 相同 -->
{#if !page.data.seo}
	<Seo canonical="/" />
{/if}

{@render children()}

<SessionExpiredDialog open={auth.showSessionExpiredDialog} onConfirm={auth.confirmSessionExpired} />

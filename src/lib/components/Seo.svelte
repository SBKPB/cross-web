<script lang="ts" module>
	export const SITE_URL = "https://cross.twinhao.com";
	export const SITE_NAME = "Cross";
	export const SITE_TITLE = "Cross | AIoT 健康資料連接平台";
	export const SITE_DESC =
		"讓設備、醫療軟體與健康資料更容易連接。探索 Cross 的原生 App、資料 API 與開發者沙盒。";

	export interface SeoProps {
		/** 頁面標題，套用 "%s | Cross" 模板；未給則用全站預設標題 */
		title?: string;
		description?: string;
		/** 站內路徑（如 "/pricing"）或完整網址 */
		canonical: string;
		/** og:image / twitter:image；未給則用全站預設分享圖 */
		image?: string;
		/** 頁面專屬結構化資料（全站 Organization/WebSite 由 root layout 輸出） */
		jsonLd?: unknown;
		noindex?: boolean;
	}
</script>

<script lang="ts">
	import { page } from "$app/state";
	import { jsonLdScript } from "$lib/seo/serialize-json-ld";

	/**
	 * 每頁可覆寫的 <head> 標籤（對應舊 Next metadata 合併後的輸出）。
	 * 公開頁在 load 回傳 `seo` 並放 <Seo {...data.seo} />；沒有 `seo` 的頁面由 root layout 輸出預設值，
	 * 所以同一頁只會有一組 title / description / canonical / robots / og / twitter。
	 *
	 * og:title / og:description / og:url 與 twitter:title / twitter:description 固定為全站值：
	 * 舊版頁面只設 title、description 而沒設 openGraph / twitter 時，Next 會沿用 root 的值（不是頁面標題）。
	 * 需要頁面專屬 openGraph / twitter 的頁面（舊版有覆寫者）要另外擴充。
	 */
	let { title, description, canonical, image, jsonLd, noindex = false }: SeoProps = $props();

	const absolute = (path: string) =>
		/^https?:\/\//.test(path) ? path : path === "/" ? SITE_URL : `${SITE_URL}${path}`;
	// 預設分享圖用目前來源的網址，preview 部署上也能取得（正式站即 https://cross.twinhao.com/og.png）
	const ogImage = $derived(image ?? `${page.url.origin}/og.png`);
	const OG_IMAGE_ALT = "Cross — AIoT 健康資料連接平台";
</script>

<svelte:head>
	<title>{title ? `${title} | ${SITE_NAME}` : SITE_TITLE}</title>
	<meta name="description" content={description ?? SITE_DESC} />
	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		<meta name="robots" content="index, follow" />
		<meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1" />
	{/if}
	<link rel="canonical" href={absolute(canonical)} />
	<meta property="og:title" content={SITE_TITLE} />
	<meta property="og:description" content={SITE_DESC} />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:locale" content="zh_TW" />
	<meta property="og:image" content={ogImage} />
	{#if !image}
		<meta property="og:image:type" content="image/png" />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta property="og:image:alt" content={OG_IMAGE_ALT} />
	{/if}
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={SITE_TITLE} />
	<meta name="twitter:description" content={SITE_DESC} />
	<meta name="twitter:image" content={ogImage} />
	{#if !image}
		<meta name="twitter:image:alt" content={OG_IMAGE_ALT} />
		<meta name="twitter:image:type" content="image/png" />
		<meta name="twitter:image:width" content="1200" />
		<meta name="twitter:image:height" content="630" />
	{/if}
	{#if jsonLd}
		<!-- serializeJsonLd 會跳脫 <，資料中的 </script> 無法提前結束標籤 -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html jsonLdScript(jsonLd as object)}
	{/if}
</svelte:head>

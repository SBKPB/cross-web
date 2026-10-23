<script lang="ts" module>
	export const SITE_URL = "https://cross.twinhao.com";
	export const SITE_NAME = "Cross";
	export const SITE_TITLE = "Cross | AIoT 健康資料連接平台";
	export const SITE_DESC =
		"讓設備、醫療軟體與健康資料更容易連接。探索 Cross 的原生 App、資料 API 與開發者沙盒。";
	export const SITE_KEYWORDS =
		"AIoT,健康資料,醫療設備串接,開發者 API,線上預約,線上掛號,看診預約,診所預約,醫美預約,台灣診所,Cross";

	/** 分享圖：字串只輸出網址；物件可附 alt / type / 尺寸（對應舊版 opengraph-image 檔的 alt、contentType、size） */
	export type SeoImage =
		| string
		| { url: string; alt?: string; type?: string; width?: number; height?: number };

	export interface SeoProps {
		/** 頁面標題，套用 "%s | Cross" 模板；未給則用全站預設標題 */
		title?: string;
		description?: string;
		/** 站內路徑（如 "/pricing"）或完整網址 */
		canonical: string;
		/**
		 * 頁面專屬分享圖（對應舊版該路由的 opengraph-image 檔），og:image 與 twitter:image 共用。
		 * 未給時：沒覆寫 openGraph 用全站預設分享圖；有覆寫 openGraph 則不輸出分享圖（同舊版）。
		 */
		image?: SeoImage;
		/** 頁面專屬結構化資料（全站 Organization/WebSite 由 root layout 輸出） */
		jsonLd?: unknown;
		noindex?: boolean;
		/** 覆寫全站 keywords（舊版頁面 metadata.keywords，字串原樣輸出） */
		keywords?: string;
		/**
		 * 對應舊版頁面 metadata.openGraph。給了就「整組取代」全站 og（Next 的合併語意）：
		 * 只輸出有給的欄位，全站的 og:image / site_name / locale / type 都不沿用；
		 * title、description 沒給時退回頁面標題、描述；url 可給站內路徑。
		 */
		openGraph?: {
			title?: string;
			description?: string;
			url?: string;
			type?: string;
			siteName?: string;
			locale?: string;
		};
		/** 對應舊版頁面 metadata.twitter：給了就整組取代全站 twitter；card 預設 summary，title、description 退回 og 的值 */
		twitter?: { card?: string; title?: string; description?: string };
	}
</script>

<script lang="ts">
	import { jsonLdScript } from "$lib/seo/serialize-json-ld";

	/**
	 * 每頁可覆寫的 <head> 標籤（對應舊 Next metadata 合併後的輸出）。
	 * 公開頁在 load 回傳 `seo` 並放 <Seo {...data.seo} />；沒有 `seo` 的頁面由 root layout 輸出預設值，
	 * 所以同一頁只會有一組 title / description / keywords / canonical / robots / og / twitter。
	 *
	 * 沒給 openGraph / twitter 時，og、twitter 的 title / description / url 沿用全站值（不是頁面標題），
	 * 與舊版頁面只設 title、description 時相同。
	 */
	let {
		title,
		description,
		canonical,
		image,
		jsonLd,
		noindex = false,
		keywords = SITE_KEYWORDS,
		openGraph,
		twitter,
	}: SeoProps = $props();

	const absolute = (path: string) =>
		/^https?:\/\//.test(path) ? path : path === "/" ? SITE_URL : `${SITE_URL}${path}`;
	const pageTitle = $derived(title ? `${title} | ${SITE_NAME}` : SITE_TITLE);
	const pageDesc = $derived(description ?? SITE_DESC);

	// og 群組：沒覆寫用全站值；有覆寫只取頁面給的欄位
	const og = $derived(
		openGraph
			? {
					...openGraph,
					title: openGraph.title ?? pageTitle,
					description: openGraph.description ?? pageDesc,
					url: openGraph.url && absolute(openGraph.url),
				}
			: {
					title: SITE_TITLE,
					description: SITE_DESC,
					url: SITE_URL,
					siteName: SITE_NAME,
					locale: "zh_TW",
					type: "website",
				},
	);
	const tw = $derived({
		card: twitter?.card ?? "summary",
		title: twitter ? (twitter.title ?? og.title) : SITE_TITLE,
		description: twitter ? (twitter.description ?? og.description) : SITE_DESC,
	});
	// 預設分享圖一律用正式網域的絕對網址（舊版 metadataBase = SITE_URL，preview 與本機也一樣），不隨請求來源變
	const img = $derived(
		typeof image === "string"
			? { url: image }
			: (image ??
					(openGraph
						? undefined
						: {
								url: `${SITE_URL}/og.png`,
								alt: "Cross — AIoT 健康資料連接平台",
								type: "image/png",
								width: 1200,
								height: 630,
							})),
	);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDesc} />
	<meta name="keywords" content={keywords} />
	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		<meta name="robots" content="index, follow" />
		<meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1" />
	{/if}
	<link rel="canonical" href={absolute(canonical)} />
	<meta property="og:title" content={og.title} />
	<meta property="og:description" content={og.description} />
	{#if og.url}<meta property="og:url" content={og.url} />{/if}
	{#if og.siteName}<meta property="og:site_name" content={og.siteName} />{/if}
	{#if og.locale}<meta property="og:locale" content={og.locale} />{/if}
	{#if img}
		<meta property="og:image" content={img.url} />
		{#if img.type}<meta property="og:image:type" content={img.type} />{/if}
		{#if img.width}<meta property="og:image:width" content={String(img.width)} />{/if}
		{#if img.height}<meta property="og:image:height" content={String(img.height)} />{/if}
		{#if img.alt}<meta property="og:image:alt" content={img.alt} />{/if}
	{/if}
	{#if og.type}<meta property="og:type" content={og.type} />{/if}
	<meta name="twitter:card" content={tw.card} />
	<meta name="twitter:title" content={tw.title} />
	<meta name="twitter:description" content={tw.description} />
	{#if img}
		<!-- 舊版 twitter 圖一律沿用 og 圖（Next 自動帶入） -->
		<meta name="twitter:image" content={img.url} />
		{#if img.alt}<meta name="twitter:image:alt" content={img.alt} />{/if}
		{#if img.type}<meta name="twitter:image:type" content={img.type} />{/if}
		{#if img.width}<meta name="twitter:image:width" content={String(img.width)} />{/if}
		{#if img.height}<meta name="twitter:image:height" content={String(img.height)} />{/if}
	{/if}
	{#if jsonLd}
		<!-- serializeJsonLd 會跳脫 <，資料中的 </script> 無法提前結束標籤 -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html jsonLdScript(jsonLd as object)}
	{/if}
</svelte:head>

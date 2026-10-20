<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";

	// 重現舊版 Next 預設的錯誤頁（沒有自訂 not-found.tsx，notFound() 與找不到路由都渲染這個）：
	// 只在 root layout 內、沒有 header / footer，版面與 inline 樣式照 next/dist/client/components/
	// http-access-fallback/error-fallback.js 與 styles/access-error-styles.js。
	// <head> 照舊版：全站預設 metadata（root layout 輸出）再加 robots noindex；分頁標題由瀏覽器端改成「404: …」。
	const message = $derived(page.status === 404 ? "This page could not be found." : (page.error?.message ?? "Error"));

	// 舊版的 <title> 由 React 在瀏覽器端提升到 <head>（伺服器輸出的 <head> 仍是全站標題），這裡同樣只在瀏覽器端設定
	onMount(() => {
		document.title = `${page.status}: ${message}`;
	});

	// Next 以 <style> 放在頁面內：深淺色依系統 prefers-color-scheme（不是網站主題）。離開本頁時隨元件移除。
	const STYLE =
		"<style>body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}</style>";
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<div
	style="font-family:system-ui,&quot;Segoe UI&quot;,Roboto,Helvetica,Arial,sans-serif,&quot;Apple Color Emoji&quot;,&quot;Segoe UI Emoji&quot;;height:100vh;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center"
>
	<div>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- 固定字串，非使用者資料 -->
		{@html STYLE}<h1
			class="next-error-h1"
			style="display:inline-block;margin:0 20px 0 0;padding:0 23px 0 0;font-size:24px;font-weight:500;vertical-align:top;line-height:49px"
		>
			{page.status}
		</h1><div style="display:inline-block">
			<h2 style="font-size:14px;font-weight:400;line-height:49px;margin:0">{message}</h2>
		</div>
	</div>
</div>

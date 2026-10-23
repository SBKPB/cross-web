<script lang="ts">
	import { page } from "$app/state";
	import NextErrorFallback from "$lib/components/NextErrorFallback.svelte";

	// 舊版 Next 預設的錯誤頁（版面、<head> 與 <title> 規則見 NextErrorFallback）
	const message = $derived(page.status === 404 ? "This page could not be found." : (page.error?.message ?? "Error"));
</script>

<!-- 舊版文件的 dynamicParams=false 會將未知 slug 視為路由不存在。 -->
<NextErrorFallback status={page.status} {message} routeMiss={page.route.id === null || (page.status === 404 && page.route.id === '/developers/docs/[slug]')} />

<script lang="ts">
	import { page } from "$app/state";
	import NextErrorFallback from "$lib/components/NextErrorFallback.svelte";

	// 舊版 Next 預設的錯誤頁（版面、<head> 與 <title> 規則見 NextErrorFallback）
	const message = $derived(page.status === 404 ? "This page could not be found." : (page.error?.message ?? "Error"));
</script>

<NextErrorFallback status={page.status} {message} routeMiss={page.route.id === null} />

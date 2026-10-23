<script lang="ts">
	import PublicFrame from "#lib/components/public/PublicFrame.svelte";

	// 對應舊版 app/clinic/layout.tsx：診所頁包在民眾端外框（header + footer）
	let { children } = $props();
</script>

<PublicFrame>{@render children()}</PublicFrame>

<script lang="ts">
	import SiteFooter from "$lib/components/layout/SiteFooter.svelte";
	import SiteHeader from "$lib/components/layout/SiteHeader.svelte";
</script>

<!-- 暫時佔位（首頁於後續 task 移植）；先放版頭版尾以便比對 -->
<div class="flex min-h-screen flex-col bg-background">
	<SiteHeader home />
	<main class="home-container flex-1 py-20">
		<h1 class="home-heading">遷移中</h1>
	</main>
	<SiteFooter />
</div>

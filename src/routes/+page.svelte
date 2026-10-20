<script lang="ts">
	import Seo from "$lib/components/Seo.svelte";
	import SiteFooter from "$lib/components/layout/SiteFooter.svelte";
	import SiteHeader from "$lib/components/layout/SiteHeader.svelte";
	import PlatformHome from "$lib/components/platform/PlatformHome.svelte";

	let { data } = $props();
</script>

<Seo {...data.seo} />

<div class="flex min-h-screen flex-col bg-background text-foreground">
	<a
		href="#main-content"
		class="sr-only z-[100] rounded-lg bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
	>
		跳到主要內容
	</a>
	<SiteHeader home />
	<main id="main-content" class="flex-1">
		<PlatformHome />
	</main>
	<SiteFooter />
</div>

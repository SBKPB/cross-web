<script lang="ts">
	import type { Snippet } from "svelte";
	import SiteFooter from "#lib/components/layout/SiteFooter.svelte";
	import SiteHeader from "#lib/components/layout/SiteHeader.svelte";

	let { children, footer = true }: { children: Snippet; footer?: boolean } = $props();
</script>

<div class="public-page flex min-h-screen flex-col bg-background">
	<SiteHeader />
	<main id="public-content" class="min-w-0 flex-1">{@render children()}</main>
	{#if footer}<SiteFooter />{/if}
</div>

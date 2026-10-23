<script lang="ts">
	import { Button } from "#lib/components/ui/button/index.js";
	import ThemeToggle from "#lib/components/ThemeToggle.svelte";
	import AuthButton from "./AuthButton.svelte";

	let { home = false }: { home?: boolean } = $props();
</script>

<header class="glass-bar sticky top-0 z-50 border-b border-border/70">
	<div
		class="home-container flex min-h-16 flex-wrap items-center justify-between gap-2 py-3 sm:h-20 sm:flex-nowrap sm:py-0"
	>
		<a href="/" class="flex shrink-0 items-center gap-2.5" aria-label="Cross 首頁">
			<img src="/cross-icon.png" alt="" width="32" height="32" class="size-8 rounded-lg" />
			<span class="text-lg font-semibold tracking-tight">Cross</span>
		</a>
		<nav aria-label="主要導覽" class="flex items-center gap-1 sm:gap-2">
			<Button
				href={`${home ? "" : "/"}#how-it-works`}
				variant="ghost"
				size="sm"
				class="hidden lg:inline-flex"
			>
				如何預約
			</Button>
			<Button href="/search" size="sm" class={home ? "min-h-11" : undefined}>線上預約</Button>
			<Button href="/member" variant="ghost" size="sm" class={home ? "min-h-11" : undefined}>我的預約</Button>
			<Button href="/join" variant="ghost" size="sm" class="hidden sm:inline-flex">院所導入</Button>
			<span class="hidden min-[400px]:inline-flex">
				<ThemeToggle class={home ? "size-11" : undefined} />
			</span>
			<span class="hidden md:inline-flex">
				<AuthButton />
			</span>
		</nav>
	</div>
</header>

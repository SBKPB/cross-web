<script lang="ts">
	import { onMount } from "svelte";
	import { mode, setMode, userPrefersMode } from "mode-watcher";
	import Check from "@lucide/svelte/icons/check";
	import Monitor from "@lucide/svelte/icons/monitor";
	import Moon from "@lucide/svelte/icons/moon";
	import Sun from "@lucide/svelte/icons/sun";
	import { cn } from "$lib/utils";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";

	let { class: className }: { class?: string } = $props();

	// 三態主題：亮 / 暗 / 跟隨系統
	const THEME_OPTIONS = [
		{ value: "light", label: "亮色", icon: Sun },
		{ value: "dark", label: "暗色", icon: Moon },
		{ value: "system", label: "跟隨系統", icon: Monitor },
	] as const;

	// 以 mounted 守衛避免 server/client 不一致：掛載前先渲染中性佔位，layout 不跳動且不洩漏錯誤主題
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});
</script>

<!-- 主題切換入口（Popover 下拉，三態） -->
{#if !mounted}
	<Button
		variant="ghost"
		size="icon-sm"
		aria-label="切換主題"
		class={cn("text-foreground", className)}
		disabled
	>
		<Sun class="size-4" />
	</Button>
{:else}
	<Popover.Root>
		<Popover.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="ghost"
					size="icon-sm"
					aria-label="切換主題"
					class={cn("text-foreground hover:text-primary", className)}
				>
					<!-- 按鈕圖示反映「實際呈現」的主題（system 會解析成 light/dark） -->
					{#if mode.current === "dark"}
						<Moon class="size-4" />
					{:else}
						<Sun class="size-4" />
					{/if}
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content align="end" class="w-44 p-1.5">
			<div class="flex flex-col">
				{#each THEME_OPTIONS as opt (opt.value)}
					{@const active = userPrefersMode.current === opt.value}
					<button
						type="button"
						onclick={() => setMode(opt.value)}
						class={cn(
							"flex items-center gap-2.5 rounded-2xl px-3 py-2 text-sm transition-colors",
							active ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-secondary",
						)}
					>
						<opt.icon class="size-4 shrink-0" />
						<span class="flex-1 text-left">{opt.label}</span>
						{#if active}
							<Check class="size-4 shrink-0 text-primary" />
						{/if}
					</button>
				{/each}
			</div>
		</Popover.Content>
	</Popover.Root>
{/if}

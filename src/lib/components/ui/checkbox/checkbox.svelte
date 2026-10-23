<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import CheckIcon from '@lucide/svelte/icons/check';
	import { cn, type WithoutChildrenOrChild } from "#lib/utils.js";

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();
</script>

<!--
	未勾選狀態刻意偏離 Luma registry 預設（原為 border-transparent + bg-input/90）：
	無邊框的填色方塊在白卡上讀起來像 skeleton／停用狀態，看不出是可勾選的框。
	改成 bg-card + 可見邊框，維持「空框 → 打勾」的一般認知。

	邊框用 foreground/50 而非更淡的值：實測在 card/background/muted 三種底色上，
	/20 只有 1.5:1、/40 是 2.5:1，都低於 WCAG 1.4.11 對 UI 元件邊界的 3:1；
	/50 是亮暗兩色皆過關的最低值（亮色最差 3.34、暗色 4.49）。
-->

<CheckboxPrimitive.Root
	bind:ref
	data-slot="checkbox"
	class={cn(
		"peer relative flex size-4 shrink-0 items-center justify-center rounded-[5px] border border-foreground/50 bg-card transition-shadow outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
		className
	)}
	bind:checked
	bind:indeterminate
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div
			data-slot="checkbox-indicator"
			class="grid place-content-center text-current transition-none [&>svg]:size-3.5"
		>
			<!-- 與舊版 Radix Indicator 相同：勾選與不確定狀態都顯示打勾 -->
			{#if checked || indeterminate}
				<CheckIcon />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>

<script lang="ts">
	import Check from "@lucide/svelte/icons/check";
	import Clock from "@lucide/svelte/icons/clock";
	import { inkOn } from "#lib/color-contrast.ts";
	import { getServicePriceBadge } from "#lib/service-price.ts";
	import type { ServiceOption } from "#lib/types/booking.ts";
	import type { PaymentType } from "#lib/types/clinic.ts";
	import { cn } from "#lib/utils.ts";

	// 移植自舊版 components/booking/service-card.tsx
	let {
		service,
		isSelected,
		onSelect,
		primaryColor = "#1d4ed8",
		paymentType,
	}: {
		service: ServiceOption;
		isSelected: boolean;
		onSelect: (service: ServiceOption) => void;
		primaryColor?: string;
		/** 院所付款方式（健保 / 自費 / 兩者）；0 元服務是否標「健保給付」依此 gating */
		paymentType?: PaymentType;
	} = $props();

	// 價格 badge 統一規則（依 payment_type gating，三端一致）
	const priceBadge = $derived(getServicePriceBadge(service.price, paymentType, service.show_price));
</script>

<button
	type="button"
	aria-pressed={isSelected}
	onclick={() => onSelect(service)}
	class={cn(
		"group w-full rounded-3xl bg-card p-5 text-left transition-all",
		"border border-border/80",
		"hover:border-primary/40",
		"active:translate-y-0",
		isSelected && "shadow-md",
	)}
	style:box-shadow={isSelected ? `0 0 0 2px ${primaryColor}, 0 10px 15px -3px rgb(0 0 0 / 0.08)` : undefined}
>
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0 flex-1">
			<h3 class="font-semibold text-foreground">{service.name}</h3>
			{#if service.description}
				<p class="mt-1 line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
			{/if}
		</div>

		<!-- Selection Indicator -->
		<div
			class={cn(
				"flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
				isSelected ? "border-transparent" : "border-border",
			)}
			style:background-color={isSelected ? primaryColor : undefined}
			style:color={isSelected ? inkOn(primaryColor) : undefined}
		>
			{#if isSelected}<Check class="size-3.5" strokeWidth={3} />{/if}
		</div>
	</div>

	<div class="mt-4 flex items-center justify-between">
		<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
			<Clock class="size-4" />
			<span>{service.duration_minutes} 分鐘</span>
		</div>

		{#if priceBadge}
			{#if priceBadge.kind === "price"}
				<div class="rounded-xl bg-accent px-3 py-1.5 text-sm font-bold tabular-nums text-accent-foreground">
					{priceBadge.label}
				</div>
			{:else}
				<div
					class="rounded-xl bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
				>
					{priceBadge.label}
				</div>
			{/if}
		{/if}
	</div>
</button>

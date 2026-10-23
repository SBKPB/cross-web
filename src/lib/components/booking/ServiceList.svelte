<script lang="ts">
	import Sparkles from "@lucide/svelte/icons/sparkles";
	import { groupServicesByCategory } from "#lib/booking/booking-flow.ts";
	import type { ServiceOption } from "#lib/types/booking.ts";
	import type { PaymentType } from "#lib/types/clinic.ts";
	import ServiceCard from "./ServiceCard.svelte";

	// 移植自舊版 components/booking/service-list.tsx
	let {
		services,
		selectedService,
		onSelectService,
		primaryColor,
		paymentType,
	}: {
		services: ServiceOption[];
		selectedService: ServiceOption | null;
		onSelectService: (service: ServiceOption) => void;
		primaryColor?: string;
		/** 院所付款方式（健保 / 自費 / 兩者）；傳給 ServiceCard 做健保 badge gating */
		paymentType?: PaymentType;
	} = $props();

	const groupedServices = $derived(groupServicesByCategory(services));
</script>

{#if services.length === 0}
	<div class="px-4">
		<div class="flex flex-col items-center gap-3 rounded-3xl bg-card p-10 text-center border border-border/80">
			<span class="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
				<Sparkles class="size-6" />
			</span>
			<p class="text-sm text-muted-foreground">目前尚無可預約的服務項目</p>
		</div>
	</div>
{:else}
	<div class="space-y-7 px-4">
		<div class="space-y-1">
			<h2 class="text-2xl font-semibold tracking-tight text-foreground">選擇服務項目</h2>
			<p class="text-sm text-muted-foreground">請選擇您本次想預約的服務</p>
		</div>

		<!-- 分類名稱不重複（物件鍵）；服務清單來自後端，不以 id 當 key（重複 id 時 keyed each 會丟錯，舊版 React 只警告） -->
		{#each groupedServices as [category, list] (category)}
			<div class="space-y-3">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</h2>
				<div class="space-y-3">
					{#each list as service, i (i)}
						<ServiceCard
							{service}
							isSelected={selectedService?.id === service.id}
							onSelect={onSelectService}
							{primaryColor}
							{paymentType}
						/>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{/if}

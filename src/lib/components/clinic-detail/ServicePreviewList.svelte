<script lang="ts">
	import Clock from "@lucide/svelte/icons/clock";
	import Sparkles from "@lucide/svelte/icons/sparkles";
	import { getServicePriceBadge } from "$lib/service-price";
	import type { PaymentType, Service } from "$lib/types/clinic";
	import SectionCard from "./SectionCard.svelte";

	let {
		services,
		paymentType,
		class: className,
	}: {
		services: Service[];
		/** 院所付款方式（健保 / 自費 / 兩者）；0 元服務是否標「健保給付」依此 gating */
		paymentType?: PaymentType;
		class?: string;
	} = $props();

	const grouped = $derived.by(() => {
		const groups: Record<string, Service[]> = {};
		for (const service of services) {
			const category = service.category || "其他";
			if (!groups[category]) groups[category] = [];
			groups[category].push(service);
		}
		return Object.entries(groups);
	});
</script>

{#if services.length > 0}
	<SectionCard icon={Sparkles} title="服務項目" class={className}>
		<div class="space-y-6">
			{#each grouped as [category, categoryServices] (category)}
				<div>
					<h3 class="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						{category}
					</h3>
					<div class="space-y-2">
						<!-- 後端資料可能有重複 id：以索引為 key（同舊版 React 只警告、照樣渲染） -->
						{#each categoryServices as service, i (i)}
							<!-- 價格 badge 統一規則（依 payment_type gating，三端一致） -->
							{@const priceBadge = getServicePriceBadge(service.price, paymentType)}
							<div
								class="flex items-start justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3 transition-colors hover:bg-accent/40"
							>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-semibold text-foreground">{service.name}</p>
									{#if service.description}
										<p class="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
											{service.description}
										</p>
									{/if}
									<div class="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
										<Clock class="size-3" />
										<span>{service.duration_minutes} 分鐘</span>
									</div>
								</div>
								{#if priceBadge}
									{#if priceBadge.kind === "price"}
										<div
											class="shrink-0 rounded-xl bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground tabular-nums"
										>
											{priceBadge.label}
										</div>
									{:else}
										<div
											class="shrink-0 rounded-xl bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
										>
											{priceBadge.label}
										</div>
									{/if}
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</SectionCard>
{/if}

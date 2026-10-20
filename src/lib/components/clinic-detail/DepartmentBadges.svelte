<script lang="ts">
	import Stethoscope from "@lucide/svelte/icons/stethoscope";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { categoryLabel } from "$lib/api/service-categories";
	import { DEPARTMENT_COLORS } from "$lib/constants/clinic-constants";
	import { useServiceTaxonomy } from "$lib/hooks/service-taxonomy.svelte";
	import type { FacilityType } from "$lib/types/clinic";
	import { cn } from "$lib/utils";
	import SectionCard from "./SectionCard.svelte";

	let {
		departments,
		facilityType,
		class: className,
	}: {
		departments: string[];
		// 大類；只有「看診」顯示診療科別。醫美/美容/其他的子類別與大類 badge、
		// 服務項目重疊，不另立區塊（單一子類別會顯得多餘）。
		facilityType?: FacilityType;
		class?: string;
	} = $props();

	const tax = useServiceTaxonomy();
</script>

<!-- 只在看診大類顯示「診療科別」；非看診不顯示（undefined 視為看診） -->
{#if departments.length > 0 && !(facilityType && facilityType !== "healthcare")}
	<SectionCard icon={Stethoscope} title="診療科別" class={className}>
		<div class="flex flex-wrap gap-2">
			<!-- 後端資料可能有重複 code：以索引為 key（同舊版 React 只警告、照樣渲染） -->
			{#each departments as dept, i (i)}
				<Badge
					class={cn(
						"border-0 px-3 py-1 text-sm",
						// 顏色僅看診 18 科別 code 有定義，其餘 code 用中性底色
						DEPARTMENT_COLORS[dept as keyof typeof DEPARTMENT_COLORS] ?? "bg-muted text-muted-foreground",
					)}
				>
					{categoryLabel(tax.current, dept)}
				</Badge>
			{/each}
		</div>
	</SectionCard>
{/if}

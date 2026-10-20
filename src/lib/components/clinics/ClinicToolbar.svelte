<script lang="ts" module>
	import Flower2 from "@lucide/svelte/icons/flower-2";
	import LayoutGrid from "@lucide/svelte/icons/layout-grid";
	import Sparkles from "@lucide/svelte/icons/sparkles";
	import Stethoscope from "@lucide/svelte/icons/stethoscope";
	import Store from "@lucide/svelte/icons/store";

	const TABS = [
		{ value: "all", label: "全部", icon: LayoutGrid },
		{ value: "healthcare", icon: Stethoscope },
		{ value: "aesthetic", icon: Sparkles },
		{ value: "beauty", icon: Flower2 },
		{ value: "other", icon: Store },
	] as const;

	const PAYMENT_FILTERS = ["all", "nhi", "self_pay"] as const;
</script>

<script lang="ts">
	import Search from "@lucide/svelte/icons/search";
	import SlidersHorizontal from "@lucide/svelte/icons/sliders-horizontal";
	import X from "@lucide/svelte/icons/x";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select/index.js";
	import {
		Sheet,
		SheetClose,
		SheetContent,
		SheetDescription,
		SheetFooter,
		SheetHeader,
		SheetTitle,
		SheetTrigger,
	} from "$lib/components/ui/sheet/index.js";
	import { categoriesFor, categoryLabel, facilityTypeLabel } from "$lib/api/service-categories";
	import {
		CITY_OPTIONS,
		HOSPITAL_LEVEL_OPTIONS,
		HOSPITAL_LEVELS,
		PAYMENT_TYPES,
	} from "$lib/constants/clinic-constants";
	import { useServiceTaxonomy } from "$lib/hooks/service-taxonomy.svelte";
	import type { ClinicFilters } from "$lib/types/clinic";
	import { cn } from "$lib/utils";

	let {
		filters,
		onFiltersChange,
		resultCount,
		class: className,
	}: {
		filters: ClinicFilters;
		onFiltersChange: (filters: ClinicFilters) => void;
		resultCount: number;
		class?: string;
	} = $props();

	const taxonomy = useServiceTaxonomy();
	let open = $state(false);

	// Select 收合時也要顯示目前選項的文字（Bits UI 的 Select.Value 由 items 查 label）
	const levelItems = HOSPITAL_LEVEL_OPTIONS.map(({ value, label }) => ({ value, label }));
	const cityItems = CITY_OPTIONS.map(({ value, label }) => ({ value, label }));

	const showLevel = $derived(filters.facilityType === "all" || filters.facilityType === "healthcare");
	const showPayment = $derived(filters.facilityType === "healthcare");
	const subcategories = $derived(
		filters.facilityType === "all"
			? taxonomy.current.facility_types.flatMap((type) => type.categories)
			: categoriesFor(taxonomy.current, filters.facilityType),
	);
	const advancedCount = $derived(
		filters.serviceCategories.length +
			Number(showLevel && filters.hospitalLevel !== "all") +
			Number(showPayment && filters.paymentType !== "all"),
	);
	const update = (patch: Partial<ClinicFilters>) => onFiltersChange({ ...filters, ...patch });
	const clearAdvanced = () => update({ hospitalLevel: "all", paymentType: "all", serviceCategories: [] });
	const toggleCategory = (code: string) =>
		update({
			serviceCategories: filters.serviceCategories.includes(code)
				? filters.serviceCategories.filter((item) => item !== code)
				: [...filters.serviceCategories, code],
		});
	const chips = $derived([
		...(filters.search ? [{ label: `「${filters.search}」`, remove: () => update({ search: "" }) }] : []),
		...(filters.city !== "all" ? [{ label: filters.city, remove: () => update({ city: "all" }) }] : []),
		...(showLevel && filters.hospitalLevel !== "all"
			? [{ label: HOSPITAL_LEVELS[filters.hospitalLevel], remove: () => update({ hospitalLevel: "all" }) }]
			: []),
		...(showPayment && filters.paymentType !== "all"
			? [{ label: PAYMENT_TYPES[filters.paymentType], remove: () => update({ paymentType: "all" }) }]
			: []),
		...filters.serviceCategories.map((code) => ({
			label: categoryLabel(taxonomy.current, code),
			remove: () => toggleCategory(code),
		})),
	]);
</script>

{#snippet advancedFields()}
	<div class="space-y-5">
		{#if showLevel}
			<div class="space-y-2">
				<p class="text-sm font-medium">醫療分級</p>
				<Select
					type="single"
					items={levelItems}
					value={filters.hospitalLevel}
					onValueChange={(value) => update({ hospitalLevel: value as ClinicFilters["hospitalLevel"] })}
				>
					<SelectTrigger class="!h-11 w-full rounded-xl md:w-48" aria-label="醫療分級"><SelectValue /></SelectTrigger>
					<SelectContent>
						{#each HOSPITAL_LEVEL_OPTIONS as option (option.value)}
							<SelectItem value={option.value} label={option.label} />
						{/each}
					</SelectContent>
				</Select>
			</div>
		{/if}
		{#if showPayment}
			<div class="space-y-2">
				<p class="text-sm font-medium">付款方式</p>
				<div class="flex gap-2" role="group" aria-label="付款方式">
					{#each PAYMENT_FILTERS as value (value)}
						<Button
							variant={filters.paymentType === value ? "default" : "outline"}
							class="h-11 rounded-full"
							aria-pressed={filters.paymentType === value}
							onclick={() => update({ paymentType: value })}
						>
							{value === "all" ? "全部" : PAYMENT_TYPES[value]}
						</Button>
					{/each}
				</div>
			</div>
		{/if}
		<div class="space-y-2">
			<p class="text-sm font-medium">服務分類 <span class="font-normal text-muted-foreground">可複選</span></p>
			<div class="flex flex-wrap gap-2" role="group" aria-label="服務分類">
				{#each subcategories as category (category.code)}
					<Button
						variant={filters.serviceCategories.includes(category.code) ? "default" : "secondary"}
						class="min-h-11 rounded-full px-3 text-sm md:min-h-9"
						aria-pressed={filters.serviceCategories.includes(category.code)}
						onclick={() => toggleCategory(category.code)}
					>
						{category.label}
					</Button>
				{/each}
			</div>
		</div>
	</div>
{/snippet}

<div class={cn("space-y-4 rounded-3xl border border-border/80 bg-card p-3 sm:p-5", className)}>
	<div role="group" aria-label="服務類型" class="flex gap-0.5 overflow-x-auto border-b border-border/70 pb-4 sm:gap-1">
		{#each TABS as tab (tab.value)}
			<!-- 圖示與文字間不留空白，與舊版 JSX 輸出相同 -->
			<button
				type="button"
				aria-pressed={filters.facilityType === tab.value}
				onclick={() =>
					update({
						facilityType: tab.value,
						serviceCategories: [],
						hospitalLevel: tab.value === "all" || tab.value === "healthcare" ? filters.hospitalLevel : "all",
						paymentType: tab.value === "healthcare" ? filters.paymentType : "all",
					})}
				class={cn(
					"inline-flex min-h-11 shrink-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 text-sm font-medium sm:px-3 transition-colors focus-visible:outline-2 focus-visible:outline-primary",
					filters.facilityType === tab.value
						? "bg-primary text-primary-foreground"
						: "text-muted-foreground hover:text-foreground",
				)}
				><tab.icon class="hidden size-4 shrink-0 sm:block" />{tab.value === "all"
					? "全部"
					: facilityTypeLabel(taxonomy.current, tab.value)}</button
			>
		{/each}
	</div>
	<div class="flex flex-col gap-2 sm:flex-row">
		<div class="relative min-w-0 flex-1">
			<Search class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				aria-label="搜尋店家、醫師、服務分類或地址"
				placeholder="店家、醫師、服務分類或地址"
				value={filters.search}
				oninput={(event) => update({ search: event.currentTarget.value })}
				class="h-12 rounded-xl bg-secondary/50 pl-11 text-base"
			/>
		</div>
		<div class="flex gap-2">
			<Select type="single" items={cityItems} value={filters.city} onValueChange={(city) => update({ city })}>
				<SelectTrigger class="!h-12 min-w-0 flex-1 rounded-xl sm:w-40" aria-label="縣市"><SelectValue /></SelectTrigger>
				<SelectContent class="max-h-80">
					{#each CITY_OPTIONS as option (option.value)}
						<SelectItem value={option.value} label={option.label} />
					{/each}
				</SelectContent>
			</Select>
			<Sheet bind:open>
				<SheetTrigger>
					{#snippet child({ props })}
						<Button {...props} variant="outline" class="h-12 rounded-xl md:hidden"
							><SlidersHorizontal class="size-4" />篩選{#if advancedCount > 0}<span
									class="rounded-full bg-primary px-2 text-primary-foreground">{advancedCount}</span
								>{/if}</Button
						>
					{/snippet}
				</SheetTrigger>
				<SheetContent side="bottom" class="max-h-[85dvh] rounded-t-3xl" showCloseButton={false}>
					<SheetHeader>
						<div class="flex items-center justify-between">
							<SheetTitle>篩選店家</SheetTitle>
							<SheetClose>
								{#snippet child({ props })}
									<Button {...props} variant="ghost" size="icon" aria-label="關閉篩選"><X /></Button>
								{/snippet}
							</SheetClose>
						</div>
						<SheetDescription>條件即時套用，可選擇多個服務分類。</SheetDescription>
					</SheetHeader>
					<div class="overflow-y-auto px-6 pb-4">{@render advancedFields()}</div>
					<SheetFooter class="border-t pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
						<div class="flex gap-3">
							<Button variant="outline" class="h-12" onclick={clearAdvanced}>重設篩選</Button>
							<SheetClose>
								{#snippet child({ props })}
									<Button {...props} class="h-12 flex-1">查看 {resultCount} 間店家</Button>
								{/snippet}
							</SheetClose>
						</div>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</div>
	</div>
	<details class="hidden rounded-xl border-t pt-3 md:block">
		<summary class="cursor-pointer text-sm font-medium text-muted-foreground"
			>更多篩選{advancedCount > 0 ? `（${advancedCount}）` : ""}</summary
		>
		<div class="pt-4">{@render advancedFields()}</div>
	</details>
	{#if chips.length > 0}
		<div class="flex gap-2 overflow-x-auto pb-1" aria-label="已套用的篩選">
			{#each chips as chip, index (`${chip.label}-${index}`)}
				<!-- 舊版此 button 沒有 type 屬性，照舊 -->
				<button
					onclick={chip.remove}
					class="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full bg-accent px-3 text-sm text-accent-foreground"
					aria-label={`移除 ${chip.label}`}>{chip.label}<X class="size-3.5" /></button
				>
			{/each}
			<Button
				variant="ghost"
				class="h-9 shrink-0"
				onclick={() =>
					onFiltersChange({
						search: "",
						city: "all",
						hospitalLevel: "all",
						facilityType: "all",
						serviceCategories: [],
						paymentType: "all",
					})}>清除全部</Button
			>
		</div>
	{/if}
</div>

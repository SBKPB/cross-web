<script lang="ts">
	import { untrack } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select/index.js";
	import { clinicsApi } from "$lib/api/clinics";
	import { buildCategoryLabelMap } from "$lib/api/service-categories";
	import { EMPTY_FILTERS, filterAndSortClinics, SORT_OPTIONS, type SortKey } from "$lib/clinic-search";
	import { useServiceTaxonomy } from "$lib/hooks/service-taxonomy.svelte";
	import type { Clinic, ClinicFilters } from "$lib/types/clinic";
	import ClinicList from "./ClinicList.svelte";
	import ClinicListSkeleton from "./ClinicListSkeleton.svelte";
	import ClinicToolbar from "./ClinicToolbar.svelte";

	let { initialFilters }: { initialFilters: ClinicFilters } = $props();

	let clinics = $state.raw<Clinic[]>([]);
	let isLoading = $state(true);
	// 與舊版 useState(initialFilters) 相同：只取初始值，之後由工具列控制
	let filters = $state.raw<ClinicFilters>(untrack(() => initialFilters));
	let sort = $state<SortKey>("default");
	let loadError = $state(false);
	let reloadKey = $state(0);
	const taxonomy = useServiceTaxonomy();
	const categoryLabels = $derived(buildCategoryLabelMap(taxonomy.current));

	const sortItems = SORT_OPTIONS.map(({ value, label }) => ({ value, label }));

	// 掛載時與按「重新載入」（reloadKey 變動）時抓取店家清單
	$effect(() => {
		void reloadKey;
		let cancelled = false;
		untrack(() => {
			isLoading = true;
			loadError = false;
		});
		(async () => {
			try {
				const data = await clinicsApi.getClinics();
				if (!cancelled) clinics = data;
			} catch (error) {
				console.error("[Search] Failed to fetch clinics:", error);
				if (!cancelled) loadError = true;
			} finally {
				if (!cancelled) isLoading = false;
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	const filteredClinics = $derived(filterAndSortClinics(clinics, filters, sort, categoryLabels));
</script>

<div class="space-y-5">
	<!-- 黏性工具列：捲動時固定於頁首下方，方便隨時調整篩選 -->
	<div class="py-1">
		<ClinicToolbar {filters} onFiltersChange={(next) => (filters = next)} resultCount={filteredClinics.length} />
	</div>

	<!-- 結果計數 + 排序 -->
	<div class="flex items-center justify-between gap-3">
		<p class="text-sm text-muted-foreground" role="status">
			{#if isLoading}
				載入店家中…
			{:else if loadError}
				尚未取得店家資料
			{:else}
				共 <span class="font-semibold text-foreground">{filteredClinics.length}</span> 間店家
			{/if}
		</p>

		<Select type="single" items={sortItems} value={sort} onValueChange={(v) => (sort = v as SortKey)}>
			<SelectTrigger
				size="sm"
				class="w-[132px] rounded-full border-transparent bg-card ring-1 ring-border/60"
				aria-label="排序方式"
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{#each SORT_OPTIONS as opt (opt.value)}
					<!-- 舊版 Radix 以 focus 標示游標項目（focus:bg-accent focus:text-primary）；Bits UI 改用 data-highlighted -->
					<SelectItem
						value={opt.value}
						label={opt.label}
						class="data-highlighted:bg-accent data-highlighted:text-primary"
					/>
				{/each}
			</SelectContent>
		</Select>
	</div>

	{#if isLoading}
		<ClinicListSkeleton />
	{:else if loadError}
		<div class="rounded-3xl border bg-card p-8 text-center" role="alert">
			<p class="mb-4">暫時無法載入店家，請稍後再試。</p>
			<Button variant="outline" onclick={() => (reloadKey += 1)}>重新載入</Button>
		</div>
	{:else}
		<ClinicList clinics={filteredClinics} onReset={() => (filters = EMPTY_FILTERS)} />
	{/if}
</div>

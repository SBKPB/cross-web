<script lang="ts" module>
	import Flower2 from "@lucide/svelte/icons/flower-2";
	import Sparkles from "@lucide/svelte/icons/sparkles";
	import Stethoscope from "@lucide/svelte/icons/stethoscope";
	import Store from "@lucide/svelte/icons/store";
	import type { FacilityType } from "$lib/types/clinic";

	const WEEKDAY_ZH: Record<string, string> = {
		Sun: "週日",
		Mon: "週一",
		Tue: "週二",
		Wed: "週三",
		Thu: "週四",
		Fri: "週五",
		Sat: "週六",
	};

	// 一律以台北時區判定今天星期幾。若直接用 new Date().getDay()，SSR 在 UTC、
	// 瀏覽器在 Asia/Taipei，跨日時段會算出不同答案而造成 hydration 不符。
	function taipeiWeekday(): string {
		const short = new Intl.DateTimeFormat("en-US", {
			timeZone: "Asia/Taipei",
			weekday: "short",
		}).format(new Date());
		return WEEKDAY_ZH[short] ?? short;
	}

	const FACILITY_TYPE_ICONS: Record<FacilityType, typeof Stethoscope> = {
		healthcare: Stethoscope,
		aesthetic: Sparkles,
		beauty: Flower2,
		other: Store,
	};
</script>

<script lang="ts">
	import ArrowUpRight from "@lucide/svelte/icons/arrow-up-right";
	import Clock from "@lucide/svelte/icons/clock";
	import Crown from "@lucide/svelte/icons/crown";
	import MapPin from "@lucide/svelte/icons/map-pin";
	import Star from "@lucide/svelte/icons/star";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card/index.js";
	import { categoryLabel } from "$lib/api/service-categories";
	import {
		FACILITY_TYPE_COLORS,
		FACILITY_TYPE_LABELS,
		HOSPITAL_LEVELS,
		PAYMENT_TYPES,
		parseAreaFromAddress,
	} from "$lib/constants/clinic-constants";
	import { useServiceTaxonomy } from "$lib/hooks/service-taxonomy.svelte";
	import type { Clinic } from "$lib/types/clinic";
	import { cn } from "$lib/utils";
	import FavoriteButton from "./FavoriteButton.svelte";
	import ClinicLogo from "./ClinicLogo.svelte";

	let {
		clinic,
		class: className,
		onClick,
	}: {
		clinic: Clinic;
		class?: string;
		onClick?: () => void;
	} = $props();

	const tax = useServiceTaxonomy();

	const maxDisplayDepartments = 3;
	const displayDepartments = $derived(clinic.departments.slice(0, maxDisplayDepartments));
	const remainingCount = $derived(clinic.departments.length - maxDisplayDepartments);

	const TypeIcon = $derived(clinic.facility_type ? FACILITY_TYPE_ICONS[clinic.facility_type] : null);

	// 醫療分級僅在健保（或舊資料無 facility_type）顯示，其餘大類不分級
	const showHospitalLevel = $derived(!clinic.facility_type || clinic.facility_type === "healthcare");

	// 「縣市 行政區」；完整地址留給詳情頁
	const area = $derived(parseAreaFromAddress(clinic.address) ?? clinic.city);

	// 今日營業時間。business_hours 只收錄有營業的日子，查不到即今日休息。
	// 註：這不等於「最近可預約時段」—— 後端列表端點目前不提供可約時段，
	// 要做需新增依診所查 availability 的端點。
	const todayHours = $derived.by(() => {
		const today = clinic.business_hours?.find((h) => h.day === taipeiWeekday());
		return clinic.business_hours?.length
			? today && !today.is_closed
				? `今日 ${today.open}–${today.close}`
				: "今日休息"
			: undefined;
	});
</script>

<Card
	class={cn(
		"relative h-full rounded-3xl border border-border/80 shadow-none ring-0 transition-colors",
		"hover:border-primary/35",
		className,
	)}
>
	<CardHeader>
		<ClinicLogo logo={clinic.logo} name={clinic.clinic_name} class="mb-3" />
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0 flex-1 space-y-2">
				<!-- 服務類型 / 醫療分級 badges（圖示與文字間不留空白，與舊版 JSX 輸出相同） -->
				<div class="flex flex-wrap items-center gap-1.5">
					<!-- 精選置頂（付費曝光）：金色 badge 置於最前，視覺優先 -->
					{#if clinic.is_featured}
						<Badge class="gap-1 border-0 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 shadow-sm"
							><Crown class="size-3.5" />精選</Badge
						>
					{/if}
					{#if clinic.facility_type && TypeIcon}
						<Badge class={cn("gap-1 border-0", FACILITY_TYPE_COLORS[clinic.facility_type])}
							><TypeIcon />{FACILITY_TYPE_LABELS[clinic.facility_type]}</Badge
						>
					{/if}
					<!-- 付款方式（健保 / 自費 / 健保+自費），取代舊 self_pay 大類語意 -->
					{#if clinic.payment_type}
						<Badge variant="outline" class="text-muted-foreground">
							{PAYMENT_TYPES[clinic.payment_type]}
						</Badge>
					{/if}
					{#if showHospitalLevel}
						<Badge variant="secondary" class="bg-accent text-accent-foreground">
							{HOSPITAL_LEVELS[clinic.hospital_level]}
						</Badge>
					{/if}
				</div>

				<!-- 診所名稱 -->
				<CardTitle class="text-lg leading-tight">
					{#if onClick}<button type="button" onclick={onClick} class="text-left hover:text-primary"
							>{clinic.clinic_name}</button
						>{:else}{clinic.clinic_name}{/if}
				</CardTitle>

				<!-- 評分（改放描述位置，而不是右上角） -->
				{#if clinic.rating !== undefined && clinic.rating !== null}
					<CardDescription class="flex items-center gap-1.5">
						<span
							class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300"
						>
							<Star class="size-3.5 fill-current" />
							<span class="text-xs font-semibold">{clinic.rating.toFixed(1)}</span>
						</span>
						<!-- 舊版 JSX 為 {review_count && …}：0 時 React 會輸出文字「0」，照舊 -->
						{#if clinic.review_count}
							<span class="text-xs text-muted-foreground">{clinic.review_count} 則評論</span>
						{:else if clinic.review_count === 0}0{/if}
					</CardDescription>
				{/if}
			</div>

			<!-- 右上角只留收藏愛心。原本的 hover 箭頭已移除：卡片本身已用
			     cursor-pointer + hover 位移 + 陰影表達可點，箭頭是第四種重複訊號，
			     且 opacity-0 時仍佔 40px 寬度，會壓縮診所名稱。 -->
			<FavoriteButton clinicId={clinic.id} nextPath={`/clinic/${clinic.id}`} class="shrink-0" />
		</div>
	</CardHeader>

	<CardContent class="flex flex-1 flex-col gap-4">
		<!-- 服務子類別標籤（看診 / 醫美 / 美容 / 其他皆顯示，label 取自 taxonomy） -->
		{#if displayDepartments.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each displayDepartments as dept, i (i)}
					<Badge variant="outline" class="text-muted-foreground">
						{categoryLabel(tax.current, dept)}
					</Badge>
				{/each}
				{#if remainingCount > 0}
					<Badge variant="outline" class="text-muted-foreground">
						+{remainingCount}
					</Badge>
				{/if}
			</div>
		{/if}

		<!-- 決策資訊：在哪裡、今天開不開。
		     完整地址與電話留到詳情頁 —— 卡片階段使用者只需要判斷「近不近、今天能不能去」，
		     而在一個主打「不用再打電話」的平台上，把電話放在卡片最顯眼的底部是矛盾的。 -->
		<div class="space-y-2 text-sm text-muted-foreground">
			{#if area}
				<div class="flex items-center gap-2">
					<MapPin class="h-4 w-4 shrink-0" />
					<span class="truncate">{area}</span>
				</div>
			{/if}
			{#if todayHours}
				<div class="flex items-center gap-2">
					<Clock class="h-4 w-4 shrink-0" />
					<span>{todayHours}</span>
				</div>
			{/if}
		</div>
		<div class="mt-auto border-t border-border/70 pt-4">
			{#if onClick}
				<Button
					onclick={onClick}
					variant="ghost"
					class="h-10 w-full justify-between rounded-full px-0 text-primary"
				>
					查看店家資訊 <ArrowUpRight class="size-4" />
				</Button>
			{:else}
				<span class="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary">
					查看店家資訊 <ArrowUpRight class="size-4" />
				</span>
			{/if}
		</div>
	</CardContent>
</Card>

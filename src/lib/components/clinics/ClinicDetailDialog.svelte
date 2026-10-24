<script lang="ts">
	import Calendar from "@lucide/svelte/icons/calendar";
	import Clock from "@lucide/svelte/icons/clock";
	import Info from "@lucide/svelte/icons/info";
	import MapPin from "@lucide/svelte/icons/map-pin";
	import Navigation from "@lucide/svelte/icons/navigation";
	import Phone from "@lucide/svelte/icons/phone";
	import Star from "@lucide/svelte/icons/star";
	import User from "@lucide/svelte/icons/user";
	import { Badge } from "#lib/components/ui/badge/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
	} from "#lib/components/ui/dialog/index.js";
	import { categoryLabel } from "#lib/api/service-categories.ts";
	import { HOSPITAL_LEVELS } from "#lib/constants/clinic-constants.ts";
	import { useServiceTaxonomy } from "#lib/hooks/service-taxonomy.svelte.ts";
	import { getServicePriceBadge } from "#lib/service-price.ts";
	import type { Clinic } from "#lib/types/clinic.ts";

	let {
		clinic,
		open = $bindable(false),
		onOpenChange,
	}: {
		clinic: Clinic | null;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	} = $props();

	const tax = useServiceTaxonomy();
</script>

{#if clinic}
	<Dialog bind:open {onOpenChange}>
		<DialogContent class="sm:max-w-[500px] bg-popover border-border">
			<DialogHeader>
				<div class="flex items-start justify-between gap-4">
					<div class="space-y-2">
						<DialogTitle class="text-xl font-bold text-foreground">
							{clinic.clinic_name}
						</DialogTitle>
						<DialogDescription class="sr-only">
							{clinic.clinic_name}的詳細資訊、科別、聯絡方式與營業時間
						</DialogDescription>
						<div class="flex items-center gap-2">
							<Badge class="text-xs font-medium bg-accent text-primary">
								{HOSPITAL_LEVELS[clinic.hospital_level]}
							</Badge>
							<!-- 舊版 JSX 為 {rating && …}：0 時 React 會輸出文字「0」，照舊 -->
							{#if clinic.rating}
								<div class="flex items-center gap-1 text-amber-500">
									<Star class="h-4 w-4 fill-current" />
									<span class="text-sm font-medium text-foreground">{clinic.rating}</span>
								</div>
							{:else if clinic.rating === 0}0{/if}
						</div>
					</div>
				</div>
			</DialogHeader>

			<div class="space-y-6 pt-4">
				<!-- 診療科別：只在看診大類顯示（非看診的子類別與大類重疊，不另列） -->
				{#if clinic.facility_type === "healthcare" && clinic.departments.length > 0}
					<div class="space-y-2">
						<h4 class="text-sm font-medium text-foreground">診療科別</h4>
						<div class="flex flex-wrap gap-1.5">
							{#each clinic.departments as dept, i (i)}
								<Badge variant="outline" class="text-xs px-2 py-1 border-0 bg-accent text-primary">
									{categoryLabel(tax.current, dept)}
								</Badge>
							{/each}
						</div>
					</div>
				{/if}

				<!-- 聯絡資訊 -->
				<div class="space-y-3">
					<h4 class="text-sm font-medium text-foreground">聯絡資訊</h4>
					<div class="space-y-2.5 text-sm">
						{#if clinic.address}
							<div class="flex items-start gap-3 text-foreground">
								<MapPin class="h-4 w-4 mt-0.5 shrink-0 text-primary" />
								<span>{clinic.address}</span>
							</div>
						{/if}
						{#if clinic.phone}
							<div class="flex items-center gap-3 text-foreground">
								<Phone class="h-4 w-4 shrink-0 text-primary" />
								<span>{clinic.phone}</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- 門診時間 -->
				{#if clinic.business_hours && clinic.business_hours.length > 0}
					<div class="space-y-2">
						<h4 class="text-sm font-medium text-foreground">門診時間</h4>
						<div class="grid grid-cols-2 gap-1.5 text-sm">
							{#each clinic.business_hours as hours, i (i)}
								<div class="contents">
									<div class="flex items-center gap-2 text-muted-foreground">
										<Clock class="h-3.5 w-3.5 text-amber-500" />
										<span>{hours.day}</span>
									</div>
									<span class={hours.is_closed ? "text-muted-foreground" : "text-foreground"}>
										{hours.is_closed ? "休診" : `${hours.open} - ${hours.close}`}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- 專業人員 -->
				{#if clinic.members && clinic.members.length > 0}
					<div class="space-y-2">
						<h4 class="text-sm font-medium text-foreground">專業人員</h4>
						<div class="space-y-2">
							{#each clinic.members.slice(0, 3) as member, i (i)}
								<div class="flex items-center gap-3 text-sm">
									<User class="h-4 w-4 shrink-0 text-primary" />
									<div>
										<!-- 名稱與職稱之間只靠 ml-2，不留空白（與舊版 JSX 輸出相同） -->
										<span class="text-foreground font-medium">{member.name}</span>{#if member.title}<span
												class="text-muted-foreground ml-2">{member.title}</span
											>{/if}
										{#if member.specialties && member.specialties.length > 0}
											<p class="text-xs text-muted-foreground">
												專長: {member.specialties.join(", ")}
											</p>
										{/if}
									</div>
								</div>
							{/each}
							{#if clinic.members.length > 3}
								<p class="text-xs text-muted-foreground pl-7">
									還有 {clinic.members.length - 3} 位人員...
								</p>
							{/if}
						</div>
					</div>
				{/if}

				<!-- 服務項目 -->
				{#if clinic.services && clinic.services.length > 0}
					<div class="space-y-2">
						<h4 class="text-sm font-medium text-foreground">服務項目</h4>
						<div class="space-y-1.5">
							{#each clinic.services.slice(0, 4) as service, i (i)}
								<!-- 價格 badge 統一規則（依 payment_type gating，三端一致） -->
								{@const priceBadge = getServicePriceBadge(service.price, clinic.payment_type, service.show_price)}
								<div class="flex items-center justify-between text-sm">
									<span class="text-foreground">{service.name}</span>
									{#if priceBadge}
										{#if priceBadge.kind === "price"}
											<span class="font-medium text-primary">{priceBadge.label}</span>
										{:else}
											<span
												class="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
											>
												{priceBadge.label}
											</span>
										{/if}
									{/if}
								</div>
							{/each}
							{#if clinic.services.length > 4}
								<p class="text-xs text-muted-foreground">
									還有 {clinic.services.length - 4} 項服務...
								</p>
							{/if}
						</div>
					</div>
				{/if}

				<!-- 操作按鈕（圖示與文字間不留空白，與舊版 JSX 輸出相同） -->
				<div class="flex gap-2 pt-2">
					<Button
						href={`/booking/${clinic.id}`}
						class="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
						><Calendar class="h-4 w-4 mr-2" />查看可約時段</Button
					>
					<Button
						href={`/clinic/${clinic.id}`}
						class="flex-1 bg-card text-primary border border-primary/40 hover:bg-accent/50"
						><Info class="h-4 w-4 mr-2" />詳細介紹</Button
					>
					{#if clinic.address}
						<Button
							href={`https://maps.google.com/?q=${encodeURIComponent(clinic.address)}`}
							target="_blank"
							rel="noopener noreferrer"
							class="bg-card text-primary border border-border hover:bg-accent/50 px-3"
							title="導航前往"
						>
							<Navigation class="h-4 w-4" />
						</Button>
					{/if}
				</div>
			</div>
		</DialogContent>
	</Dialog>
{/if}

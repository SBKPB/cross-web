<script lang="ts">
	import Briefcase from "@lucide/svelte/icons/briefcase";
	import GraduationCap from "@lucide/svelte/icons/graduation-cap";
	import Stethoscope from "@lucide/svelte/icons/stethoscope";
	import User from "@lucide/svelte/icons/user";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from "$lib/components/ui/dialog/index.js";
	import { MEMBER_ROLES } from "$lib/constants/clinic-constants";
	import type { ClinicDoctorDetail, Member } from "$lib/types/clinic";

	let {
		open = $bindable(false),
		onOpenChange,
		member,
		detail,
	}: {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		member: Member | null;
		detail?: ClinicDoctorDetail;
	} = $props();

	const avatar = $derived(detail?.avatar ?? member?.avatar);
	const specialties = $derived(
		detail?.specialties && detail.specialties.length > 0 ? detail.specialties : (member?.specialties ?? []),
	);
	const education = $derived(detail?.education ?? []);
	const experience = $derived(detail?.experience ?? []);
	const roleLabel = $derived(member ? member.title || MEMBER_ROLES[member.role] : "");
</script>

{#if member}
	<Dialog bind:open {onOpenChange}>
		<DialogContent class="sm:max-w-md">
			<DialogHeader>
				<DialogTitle class="sr-only">{member.name} 詳細資料</DialogTitle>
			</DialogHeader>

			<!-- 頭部：頭像 + 姓名 + 職稱/科別 -->
			<div class="flex flex-col items-center text-center">
				<div class="size-24 overflow-hidden rounded-full shadow-sm ring-4 ring-card">
					{#if avatar}
						<img src={avatar} alt={member.name} class="size-full object-cover" />
					{:else}
						<div class="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-sky-200/50">
							<User class="size-10 text-primary" />
						</div>
					{/if}
				</div>
				<h2 class="mt-3 text-lg font-bold text-foreground">
					{member.name}
				</h2>
				<div class="mt-1 flex flex-wrap items-center justify-center gap-1.5">
					<span class="text-sm font-medium text-primary">{roleLabel}</span>
					{#if detail?.department}
						<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
							{detail.department}
						</span>
					{/if}
					{#if detail?.license_type}
						<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
							{detail.license_type}
						</span>
					{/if}
				</div>
			</div>

			<!-- 後端資料可能有重複項目：清單一律以索引為 key（同舊版 React 只警告、照樣渲染） -->
			<div class="mt-2 space-y-5">
				<!-- 專長 -->
				{#if specialties.length > 0}
					<section>
						<h3 class="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
							<Stethoscope class="size-4 text-primary" />專長
						</h3>
						<div class="flex flex-wrap gap-1.5">
							{#each specialties as s, i (i)}
								<Badge variant="secondary" class="font-normal">
									{s}
								</Badge>
							{/each}
						</div>
					</section>
				{/if}

				<!-- 學歷 -->
				{#if education.length > 0}
					<section>
						<h3 class="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
							<GraduationCap class="size-4 text-primary" />學歷
						</h3>
						<ul class="space-y-1.5">
							{#each education as e, i (i)}
								<li class="flex gap-2 text-sm text-muted-foreground">
									<span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/40"></span>{e}
								</li>
							{/each}
						</ul>
					</section>
				{/if}

				<!-- 經歷 -->
				{#if experience.length > 0}
					<section>
						<h3 class="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
							<Briefcase class="size-4 text-primary" />經歷
						</h3>
						<ul class="space-y-1.5">
							{#each experience as e, i (i)}
								<li class="flex gap-2 text-sm text-muted-foreground">
									<span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/40"></span>{e}
								</li>
							{/each}
						</ul>
					</section>
				{/if}

				{#if specialties.length === 0 && education.length === 0 && experience.length === 0}
					<p class="text-center text-sm text-muted-foreground">尚無更多公開資料</p>
				{/if}
			</div>
		</DialogContent>
	</Dialog>
{/if}

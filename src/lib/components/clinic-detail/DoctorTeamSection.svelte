<script lang="ts" module>
	import type { MemberRole } from "$lib/types/clinic";

	const ROLE_GROUPS: { key: "all" | MemberRole; label: string; roles: MemberRole[] }[] = [
		{ key: "all", label: "全部", roles: [] },
		{ key: "doctor", label: "醫師", roles: ["doctor", "therapist"] },
		{ key: "nurse", label: "護理", roles: ["nurse"] },
		{ key: "beautician", label: "美容", roles: ["beautician"] },
		{ key: "admin", label: "行政", roles: ["receptionist", "admin"] },
	];
</script>

<script lang="ts">
	import User from "@lucide/svelte/icons/user";
	import Users from "@lucide/svelte/icons/users";
	import { MEMBER_ROLES } from "$lib/constants/clinic-constants";
	import type { ClinicDoctorDetail, Member } from "$lib/types/clinic";
	import { cn } from "$lib/utils";
	import DoctorDetailDialog from "./DoctorDetailDialog.svelte";
	import SectionCard from "./SectionCard.svelte";

	let {
		members,
		details,
		class: className,
	}: {
		members: Member[];
		details?: ClinicDoctorDetail[];
		class?: string;
	} = $props();

	let activeTab = $state<string>("all");
	let selected = $state<Member | null>(null);
	let dialogOpen = $state(false);

	// id → 完整詳情（學歷/經歷/科別…），點擊卡片時帶入
	const detailMap = $derived(new Map((details ?? []).map((d) => [d.id, d] as const)));

	function openDetail(member: Member) {
		selected = member;
		dialogOpen = true;
	}

	const availableTabs = $derived(
		ROLE_GROUPS.filter((group) => {
			if (group.key === "all") return true;
			return members.some((m) => group.roles.includes(m.role));
		}),
	);

	const filteredMembers = $derived.by(() => {
		if (activeTab === "all") return members;
		const group = ROLE_GROUPS.find((g) => g.key === activeTab);
		if (!group) return members;
		return members.filter((m) => group.roles.includes(m.role));
	});
</script>

{#if members.length > 0}
	<SectionCard icon={Users} title="團隊成員" class={className}>
		{#snippet action()}
			<span class="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
				{members.length} 人
			</span>
		{/snippet}

		{#if availableTabs.length > 2}
			<div class="mb-4 flex flex-wrap gap-1.5">
				{#each availableTabs as tab (tab.key)}
					{@const isActive = activeTab === tab.key}
					<button
						type="button"
						onclick={() => (activeTab = tab.key)}
						class={cn(
							"rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
							isActive
								? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
								: "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
						)}
					>
						{tab.label}
					</button>
				{/each}
			</div>
		{/if}

		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
			<!-- 後端資料可能有重複 id：以索引為 key（同舊版 React 只警告、照樣渲染） -->
			{#each filteredMembers as member, i (i)}
				<button
					type="button"
					onclick={() => openDetail(member)}
					aria-label={`查看 ${member.name} 詳細資料`}
					class="flex cursor-pointer flex-col items-center rounded-2xl bg-muted/40 p-4 text-center ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:bg-accent/40 hover:shadow-sm hover:ring-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
				>
					<div class="relative size-16 overflow-hidden rounded-full shadow-sm ring-2 ring-card">
						{#if member.avatar}
							<img src={member.avatar} alt={member.name} loading="lazy" class="size-full object-cover" />
						{:else}
							<div
								class="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-sky-200/50"
							>
								<User class="size-7 text-primary" />
							</div>
						{/if}
					</div>
					<p class="mt-3 truncate text-sm font-semibold text-foreground">
						{member.name}
					</p>
					<p class="text-xs text-primary">
						{member.title || MEMBER_ROLES[member.role]}
					</p>
					{#if member.specialties && member.specialties.length > 0}
						<p class="mt-1 line-clamp-1 text-xs text-muted-foreground">
							{member.specialties.slice(0, 2).join("、")}
						</p>
					{/if}
				</button>
			{/each}
		</div>

		<DoctorDetailDialog
			bind:open={dialogOpen}
			member={selected}
			detail={selected ? detailMap.get(selected.id) : undefined}
		/>
	</SectionCard>
{/if}

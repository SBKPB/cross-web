<script lang="ts">
	import { untrack } from "svelte";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import UserCheck from "@lucide/svelte/icons/user-check";
	import UserPlus from "@lucide/svelte/icons/user-plus";
	import { Button } from "$lib/components/ui/button/index.js";
	import { RadioGroup, RadioGroupItem } from "$lib/components/ui/radio-group/index.js";
	import { memberPatientApi } from "$lib/api/member-patient";
	import { getAuth } from "$lib/auth/auth.svelte";
	import { MAX_PATIENTS, RELATION_LABELS } from "$lib/constants/patient-constants";
	import { pickDefaultPatient, patientSummary, sortPatients } from "$lib/patient";
	import type { MemberPatientRead } from "$lib/types/member-patient";
	import { cn } from "$lib/utils";
	import NewPatientDialog from "./NewPatientDialog.svelte";

	/**
	 * 移植自舊版 components/patient/patient-selector.tsx（預約第 3 步選看診對象）。
	 * 舊版另有「未登入」分支（卡片內嵌 Google／Apple 登入）：唯一使用處 BookingFlow 只在已登入時渲染本元件，
	 * 兩者讀同一份登入狀態，該分支在預約流程中不會出現；社群登入按鈕屬 auth/*（另一批移植），故未移植該分支，
	 * 未登入時不顯示任何內容（不會誤把「為本人預約」等需登入的操作給未登入者）。
	 */
	let {
		selectedId,
		onSelect,
		class: className,
	}: {
		selectedId: string | null;
		onSelect: (patient: MemberPatientRead) => void;
		class?: string;
	} = $props();

	const auth = getAuth();

	let patients = $state.raw<MemberPatientRead[]>([]);
	let isLoading = $state(false);
	let dialogOpen = $state(false);
	// 對話框預設關係：「為本人預約」帶 self，其餘帶 other
	let dialogRelation = $state("other");

	// 會員 profile 名稱，用於本人引導預填
	const memberName = $derived(auth.user?.display_name ?? "");

	async function fetchPatients(
		currentSelectedId: string | null,
		lastBooked: string | null | undefined,
		select: (patient: MemberPatientRead) => void,
	) {
		isLoading = true;
		try {
			const data = await memberPatientApi.list();
			patients = data;

			// 如果 selectedId 為空，預設選 last_booked，否則本人（self），最後退回第一位
			if (!currentSelectedId && data.length > 0) {
				const defaultPatient = pickDefaultPatient(data, lastBooked);
				if (defaultPatient) select(defaultPatient);
			}
		} catch (err) {
			console.error("Failed to load patients:", err);
		} finally {
			isLoading = false;
		}
	}

	// 登入後自動載入 patients。依賴同舊版 useEffect [authLoading, isAuthenticated, fetchPatients]，
	// 而 fetchPatients 依賴 [selectedId, user.last_booked_member_patient_id, onSelect]：
	// 舊版每次改選看診對象都會重新載入清單（短暫顯示載入中），照舊。
	$effect(() => {
		const authLoading = auth.isLoading;
		const isAuthenticated = auth.isAuthenticated;
		const currentSelectedId = selectedId;
		const lastBooked = auth.user?.last_booked_member_patient_id;
		const select = onSelect;
		if (authLoading) return;
		if (isAuthenticated) untrack(() => fetchPatients(currentSelectedId, lastBooked, select));
	});

	// 看診人上限控管（與 iOS / Android 一致，最多 MAX_PATIENTS 位）
	const canAddPatient = $derived(patients.length < MAX_PATIENTS);

	// 本人優先排在最前
	const sortedPatients = $derived(sortPatients(patients));

	const openDialog = (relation: string) => {
		dialogRelation = relation;
		dialogOpen = true;
	};

	const handleCreated = (newPatient: MemberPatientRead) => {
		patients = [...patients, newPatient];
		onSelect(newPatient);
		dialogOpen = false;
	};
</script>

{#if !auth.isLoading && !auth.isAuthenticated}
	<!-- 舊版「未登入：顯示 inline 登入」分支，見上方說明；預約流程中不會出現，這裡不顯示任何內容 -->
{:else if auth.isLoading || isLoading}
	<!-- Loading -->
	<div class="flex items-center justify-center py-6">
		<div class="size-6 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
	</div>
{:else}
	<!-- 已登入：顯示看診對象列表 -->
	<div class={className}>
		{#if patients.length === 0}
			<!-- 空狀態：高亮「為本人預約」CTA + 次要「新增其他家人」 -->
			<div class="rounded-3xl bg-card p-6 text-center shadow-sm ring-1 ring-foreground/5 sm:p-7">
				<div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
					<UserCheck class="size-7" />
				</div>
				<p class="mt-4 text-base font-semibold text-foreground">這是您本人要看診嗎？</p>
				<p class="mt-1 text-sm text-muted-foreground">一次填好本人就診資料，之後預約自動帶入</p>

				<Button
					type="button"
					size="lg"
					class="mt-5 w-full rounded-2xl font-semibold shadow-sm shadow-primary/20"
					onclick={() => openDialog("self")}
				>
					<UserCheck class="size-5" />
					為本人預約
				</Button>

				<Button
					type="button"
					variant="ghost"
					class="mt-2 w-full rounded-2xl text-muted-foreground hover:text-foreground"
					onclick={() => openDialog("other")}
				>
					<UserPlus class="size-4" />
					為其他家人預約
				</Button>
			</div>
		{:else}
			<!-- 已有看診對象：清單 -->
			<div>
				<div class="mb-3 flex items-center justify-between">
					<div class="flex items-center gap-2 text-sm font-semibold text-foreground">
						<span class="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<UserCheck class="size-4" />
						</span>
						看診對象
					</div>
					<!-- 已達上限時隱藏新增入口 -->
					{#if canAddPatient}
						<Button type="button" variant="outline" size="sm" class="rounded-full" onclick={() => openDialog("other")}>
							<PlusIcon class="size-3.5" />
							新增
						</Button>
					{/if}
				</div>

				<!-- 看診人達上限提示 -->
				{#if !canAddPatient}
					<p class="mb-3 rounded-2xl bg-muted/60 px-4 py-2.5 text-center text-xs text-muted-foreground">
						最多可建立 {MAX_PATIENTS} 位看診人，如需新增請先刪除其他看診人
					</p>
				{/if}

				<RadioGroup
					value={selectedId || ""}
					onValueChange={(id) => {
						const p = patients.find((pt) => pt.id === id);
						if (p) onSelect(p);
					}}
					class="space-y-2.5"
				>
					<!-- 看診對象來自後端，不以 id 當 key（重複 id 時 keyed each 會丟錯，舊版 React 只警告） -->
					{#each sortedPatients as patient, i (i)}
						{@const isSelected = patient.id === selectedId}
						{@const isSelf = patient.relation === "self"}
						<label
							for={`patient-${patient.id}`}
							class={cn(
								"flex cursor-pointer items-start gap-3 rounded-2xl bg-card p-4 ring-1 transition-all",
								isSelected
									? "bg-primary/5 ring-2 ring-primary shadow-sm shadow-primary/10"
									: "ring-foreground/5 hover:ring-primary/30 hover:shadow-sm",
							)}
						>
							<RadioGroupItem value={patient.id} id={`patient-${patient.id}`} class="mt-0.5" />
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="font-semibold text-foreground">{patient.name}</span>
									{#if isSelf}
										<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">本人</span>
									{:else}
										<span class="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
											>{RELATION_LABELS[patient.relation] ?? "其他"}</span
										>
									{/if}
								</div>
								<div class="mt-1 text-xs text-muted-foreground">{patientSummary(patient)}</div>
							</div>
						</label>
					{/each}
				</RadioGroup>
			</div>
		{/if}

		<NewPatientDialog
			open={dialogOpen}
			onOpenChange={(open) => (dialogOpen = open)}
			onCreated={handleCreated}
			defaultRelation={dialogRelation}
			defaultName={dialogRelation === "self" ? memberName : ""}
		/>
	</div>
{/if}

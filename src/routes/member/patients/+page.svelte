<script lang="ts">
	import ArrowLeft from "@lucide/svelte/icons/arrow-left";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import Trash2Icon from "@lucide/svelte/icons/trash-2";
	import UserCheck from "@lucide/svelte/icons/user-check";
	import { untrack } from "svelte";
	import { memberPatientApi } from "#lib/api/member-patient.ts";
	import { requireMember } from "#lib/auth/auth.svelte.ts";
	import NewPatientDialog from "#lib/components/patient/NewPatientDialog.svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Card } from "#lib/components/ui/card/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "#lib/components/ui/dialog/index.js";
	import { IDENTIFIER_TYPE_LABELS, MAX_PATIENTS, RELATION_LABELS } from "#lib/constants/patient-constants.ts";
	import type { MemberPatientRead } from "#lib/types/member-patient.ts";

	// 移植自舊版 app/member/patients/page.tsx
	// 守衛：未登入導向登入頁，後台帳號導回後台，不渲染民眾端內容
	const guard = requireMember(() => "/member/patients");

	let patients = $state.raw<MemberPatientRead[]>([]);
	let isLoading = $state(true);
	let createOpen = $state(false);
	let editTarget = $state<MemberPatientRead | null>(null);
	let deleteTarget = $state<MemberPatientRead | null>(null);
	let isDeleting = $state(false);

	async function fetchPatients() {
		isLoading = true;
		try {
			patients = await memberPatientApi.list();
		} catch (err) {
			console.error("Failed to load patients:", err);
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		if (!guard.ready) return;
		untrack(fetchPatients);
	});

	const handleCreated = (newPatient: MemberPatientRead) => {
		patients = [...patients, newPatient];
		createOpen = false;
	};

	const handleUpdated = (updated: MemberPatientRead) => {
		patients = patients.map((p) => (p.id === updated.id ? updated : p));
		editTarget = null;
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		const target = deleteTarget;
		isDeleting = true;
		try {
			await memberPatientApi.delete(target.id);
			patients = patients.filter((p) => p.id !== target.id);
			deleteTarget = null;
		} catch (err) {
			console.error("Failed to delete patient:", err);
		} finally {
			isDeleting = false;
		}
	};

	// 看診人上限控管（與 iOS / Android 一致，最多 MAX_PATIENTS 位）
	const canAddPatient = $derived(patients.length < MAX_PATIENTS);
</script>

{#if !guard.ready}
	<div class="flex min-h-[60vh] items-center justify-center bg-background">
		<div class="size-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
	</div>
{:else}
	<div class="min-h-[60vh] bg-background">
		<!-- Header -->
		<div class="border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
			<div class="mx-auto flex max-w-4xl items-center justify-between">
				<div class="flex items-center gap-3">
					<a href="/member" class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
						<ArrowLeft class="mr-1 size-4" />
						返回
					</a>
					<h1 class="text-lg font-bold text-foreground">看診對象管理</h1>
				</div>
				<!-- 已達上限時隱藏新增入口 -->
				{#if !isLoading && canAddPatient}
					<Button size="sm" onclick={() => (createOpen = true)}>
						<PlusIcon class="mr-1.5 size-3.5" />
						新增
					</Button>
				{/if}
			</div>
		</div>

		<div class="mx-auto max-w-4xl space-y-3 px-4 py-6 sm:px-6">
			<!-- 看診人達上限提示 -->
			{#if !isLoading && !canAddPatient}
				<p class="rounded-2xl bg-muted/60 px-4 py-3 text-center text-xs text-muted-foreground">
					最多可建立 {MAX_PATIENTS} 位看診人，如需新增請先刪除其他看診人
				</p>
			{/if}
			{#if isLoading}
				<div class="flex items-center justify-center py-12">
					<div class="size-6 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
				</div>
			{:else if patients.length === 0}
				<Card class="flex flex-col items-center gap-3 p-8 text-center">
					<UserCheck class="size-10 text-muted-foreground" />
					<p class="text-sm text-muted-foreground">尚無看診對象，請先新增</p>
					<Button size="sm" onclick={() => (createOpen = true)}>
						<PlusIcon class="mr-1.5 size-3.5" />
						新增看診對象
					</Button>
				</Card>
			{:else}
				{#each patients as patient, i (`${patient.id}-${i}`)}
					<Card class="p-5 ring-1 ring-foreground/5 transition hover:ring-primary/15">
						<div class="flex items-start gap-3">
							<span
								class="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-base font-semibold text-primary"
							>
								{patient.name.charAt(0)}
							</span>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="font-semibold text-foreground">{patient.name}</span>
									<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
										{RELATION_LABELS[patient.relation] || patient.relation}
									</span>
								</div>
								<div class="mt-1 text-xs tabular-nums text-muted-foreground">
									{IDENTIFIER_TYPE_LABELS[patient.identifier_type]}
									****{patient.identifier_last4} · {patient.birth_date} · {patient.gender === "M" ? "男" : "女"}
								</div>
								{#if patient.phone}
									<div class="mt-0.5 text-xs tabular-nums text-muted-foreground">{patient.phone}</div>
								{/if}
							</div>
							<div class="flex shrink-0 items-center gap-0.5">
								<Button
									variant="ghost"
									size="icon-sm"
									onclick={() => (editTarget = patient)}
									title="編輯"
									class="text-muted-foreground hover:text-primary"
								>
									<PencilIcon class="size-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon-sm"
									onclick={() => (deleteTarget = patient)}
									title="刪除"
									class="text-muted-foreground hover:text-destructive"
								>
									<Trash2Icon class="size-4" />
								</Button>
							</div>
						</div>
					</Card>
				{/each}
			{/if}
		</div>

		<NewPatientDialog open={createOpen} onOpenChange={(o) => (createOpen = o)} onCreated={handleCreated} />

		<!-- 編輯看診對象（共用對話框的 edit 模式；證件唯讀） -->
		<NewPatientDialog
			open={!!editTarget}
			onOpenChange={(o) => {
				if (!o) editTarget = null;
			}}
			editPatient={editTarget}
			onUpdated={handleUpdated}
			onCreated={handleCreated}
		/>

		<!-- 刪除確認 -->
		<Dialog
			bind:open={
				() => !!deleteTarget,
				(o) => {
					if (!o) deleteTarget = null;
				}
			}
		>
			<DialogContent class="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle>確認刪除</DialogTitle>
					<DialogDescription>確定要刪除「{deleteTarget?.name}」嗎？此操作無法復原。</DialogDescription>
				</DialogHeader>
				<DialogFooter class="gap-2 sm:gap-3 sm:justify-end">
					<Button variant="outline" onclick={() => (deleteTarget = null)} disabled={isDeleting}>取消</Button>
					<Button variant="destructive" onclick={handleDelete} disabled={isDeleting}>
						{isDeleting ? "刪除中..." : "確認刪除"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
{/if}

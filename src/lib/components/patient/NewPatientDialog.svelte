<script lang="ts">
	import { untrack } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { RadioGroup, RadioGroupItem } from "$lib/components/ui/radio-group/index.js";
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select/index.js";
	import { memberPatientApi } from "$lib/api/member-patient";
	import {
		IDENTIFIER_ERROR_MESSAGES,
		IDENTIFIER_PLACEHOLDERS,
		IDENTIFIER_TYPE_LABELS,
		RELATION_LABELS,
	} from "$lib/constants/patient-constants";
	import { canSubmitPatientForm, identifierErrorOnChange, patientSaveErrorMessage } from "$lib/patient";
	import type { IdentifierType, MemberPatientRead } from "$lib/types/member-patient";
	import { validateIdentifier } from "$lib/validation/tw-identifier";

	// 移植自舊版 components/patient/new-patient-dialog.tsx（新增／編輯看診對象）

	// 對話框內可選的關係（順序：本人優先）
	const RELATION_OPTIONS = ["self", "spouse", "child", "parent", "other"] as const;
	// Select 收合時顯示目前選項的文字（Bits UI 的 SelectValue 由 items 查 label）
	const relationItems = RELATION_OPTIONS.map((value) => ({ value, label: RELATION_LABELS[value] }));
	const identifierTypeItems = (Object.entries(IDENTIFIER_TYPE_LABELS) as [IdentifierType, string][]).map(
		([value, label]) => ({ value, label }),
	);

	let {
		open,
		onOpenChange,
		onCreated,
		defaultRelation = "other",
		defaultName = "",
		editPatient = null,
		onUpdated,
	}: {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		onCreated: (patient: MemberPatientRead) => void;
		/** 預設關係（如「為本人預約」引導時帶 self） */
		defaultRelation?: string;
		/** 預設姓名（如本人引導時用會員 profile 名稱預填） */
		defaultName?: string;
		/** 帶入此值即進入「編輯」模式；證件類型與末4碼唯讀不可改 */
		editPatient?: MemberPatientRead | null;
		/** 編輯成功的回呼（與 onCreated 並存，編輯模式優先） */
		onUpdated?: (patient: MemberPatientRead) => void;
	} = $props();

	const isEdit = $derived(!!editPatient);
	// 初始值只取第一次的 props（舊版 useState 初始值）；之後由開啟時的 effect 與 resetForm 帶入
	let name = $state(untrack(() => defaultName));
	let identifierType = $state<IdentifierType>("national_id");
	let identifierValue = $state("");
	let birthDate = $state("");
	let gender = $state("");
	let phone = $state("");
	let relation = $state(untrack(() => defaultRelation));
	let error = $state<string | null>(null);
	let identifierError = $state<string | null>(null);
	let isSubmitting = $state(false);

	// 每次開啟時初始化：編輯模式帶入既有資料、新增模式用預設值
	$effect(() => {
		if (!open) return;
		if (editPatient) {
			name = editPatient.name;
			identifierType = editPatient.identifier_type;
			identifierValue = "";
			birthDate = editPatient.birth_date;
			gender = editPatient.gender;
			phone = editPatient.phone ?? "";
			relation = editPatient.relation;
			error = null;
			identifierError = null;
		} else {
			name = defaultName;
			relation = defaultRelation;
		}
	});

	const resetForm = () => {
		name = defaultName;
		identifierType = "national_id";
		identifierValue = "";
		birthDate = "";
		gender = "";
		phone = "";
		relation = defaultRelation;
		error = null;
		identifierError = null;
	};

	const isSelf = $derived(relation === "self");

	const handleIdentifierChange = (value: string) => {
		identifierValue = value;
		identifierError = identifierErrorOnChange(identifierType, value);
	};

	const handleSubmit = async (e: SubmitEvent) => {
		e.preventDefault();
		error = null;

		// 編輯模式不改證件，跳過證件驗證
		if (!isEdit && !validateIdentifier(identifierType, identifierValue)) {
			identifierError = IDENTIFIER_ERROR_MESSAGES[identifierType];
			return;
		}

		isSubmitting = true;
		try {
			if (isEdit && editPatient) {
				// 證件類型與末4碼唯讀：僅更新可變欄位
				const updated = await memberPatientApi.update(editPatient.id, {
					name,
					birth_date: birthDate,
					gender,
					phone,
					relation,
				});
				onUpdated?.(updated);
			} else {
				const created = await memberPatientApi.create({
					name,
					identifier_type: identifierType,
					identifier_value: identifierValue,
					birth_date: birthDate,
					gender,
					phone,
					relation,
				});
				resetForm();
				onCreated(created);
			}
		} catch (err) {
			// 優先讀後端回傳的繁中錯誤訊息，避免顯示英文 "API Error: 400 ..."（見 patientSaveErrorMessage）
			error = patientSaveErrorMessage(err);
		} finally {
			isSubmitting = false;
		}
	};
</script>

<Dialog
	{open}
	onOpenChange={(o) => {
		if (!o) resetForm();
		onOpenChange(o);
	}}
>
	<DialogContent class="sm:max-w-lg">
		<DialogHeader>
			<DialogTitle>
				{isEdit ? "編輯看診對象" : isSelf ? "新增本人就診資料" : "新增看診對象"}
			</DialogTitle>
			<DialogDescription>
				{isEdit
					? "證件類型與號碼不可修改，如需更改請刪除後重新新增"
					: isSelf
						? "填寫您本人的就診資料，之後預約會自動帶入"
						: "填寫家屬或其他看診人的基本資料"}
			</DialogDescription>
		</DialogHeader>

		<form onsubmit={handleSubmit} class="space-y-4">
			{#if error}
				<div class="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
					{error}
				</div>
			{/if}

			<div class="grid gap-2">
				<Label for="np-relation">與您的關係</Label>
				<Select type="single" items={relationItems} value={relation} onValueChange={(v) => (relation = v)}>
					<SelectTrigger id="np-relation"><SelectValue /></SelectTrigger>
					<SelectContent>
						{#each relationItems as option (option.value)}
							<SelectItem value={option.value} label={option.label} />
						{/each}
					</SelectContent>
				</Select>
			</div>

			<div class="grid gap-2">
				<Label for="np-name">姓名 <span class="text-destructive">*</span></Label>
				<Input id="np-name" bind:value={name} required />
			</div>

			<div class="grid gap-2">
				<Label>身分識別碼 {#if !isEdit}<span class="text-destructive">*</span>{/if}</Label>
				{#if isEdit && editPatient}
					<!-- 編輯模式：證件類型 + 末4碼唯讀（不可改） -->
					<Input
						value={`${IDENTIFIER_TYPE_LABELS[editPatient.identifier_type]} ****${editPatient.identifier_last4}`}
						readonly
						disabled
						class="tabular-nums"
					/>
				{:else}
					<div class="grid grid-cols-[140px_1fr] gap-2">
						<Select
							type="single"
							items={identifierTypeItems}
							value={identifierType}
							onValueChange={(v) => {
								identifierType = v as IdentifierType;
								identifierError = null;
							}}
						>
							<SelectTrigger id="np-id-type"><SelectValue /></SelectTrigger>
							<SelectContent>
								{#each identifierTypeItems as option (option.value)}
									<SelectItem value={option.value} label={option.label} />
								{/each}
							</SelectContent>
						</Select>
						<Input
							id="np-id-value"
							value={identifierValue}
							oninput={(e) => handleIdentifierChange(e.currentTarget.value)}
							placeholder={IDENTIFIER_PLACEHOLDERS[identifierType]}
							required
						/>
					</div>
					{#if identifierError}
						<p class="text-xs text-destructive">{identifierError}</p>
					{/if}
				{/if}
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="grid gap-2">
					<Label for="np-birth">生日 <span class="text-destructive">*</span></Label>
					<Input id="np-birth" type="date" bind:value={birthDate} required />
				</div>
				<div class="grid gap-2">
					<Label>性別 <span class="text-destructive">*</span></Label>
					<RadioGroup value={gender} onValueChange={(v) => (gender = v)} class="flex gap-4 pt-2">
						<label for="np-gender-m" class="flex items-center gap-2">
							<RadioGroupItem value="M" id="np-gender-m" />
							<span class="text-sm">男</span>
						</label>
						<label for="np-gender-f" class="flex items-center gap-2">
							<RadioGroupItem value="F" id="np-gender-f" />
							<span class="text-sm">女</span>
						</label>
					</RadioGroup>
				</div>
			</div>

			<div class="grid gap-2">
				<Label for="np-phone">手機號碼 <span class="text-destructive">*</span></Label>
				<Input id="np-phone" type="tel" placeholder="0912345678" bind:value={phone} maxlength={15} required />
			</div>

			<DialogFooter class="gap-2 sm:gap-3 sm:justify-end">
				<Button type="button" variant="outline" onclick={() => onOpenChange(false)} disabled={isSubmitting}>
					取消
				</Button>
				<Button
					type="submit"
					disabled={!canSubmitPatientForm({ isSubmitting, isEdit, name, identifierValue, birthDate, gender, phone })}
				>
					{isSubmitting ? (isEdit ? "儲存中..." : "建立中...") : isEdit ? "儲存" : "新增"}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>

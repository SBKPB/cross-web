<script lang="ts">
	import UserPlus from "@lucide/svelte/icons/user-plus";
	import { untrack } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { memberPatientApi } from "#lib/api/member-patient.ts";
	import { getAuth } from "#lib/auth/auth.svelte.ts";
	import { safeNextUrl } from "#lib/auth/social-login.ts";
	import PublicFrame from "#lib/components/public/PublicFrame.svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#lib/components/ui/card/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { RadioGroup, RadioGroupItem } from "#lib/components/ui/radio-group/index.js";
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#lib/components/ui/select/index.js";
	import {
		IDENTIFIER_ERROR_MESSAGES,
		IDENTIFIER_PLACEHOLDERS,
		IDENTIFIER_TYPE_LABELS,
	} from "#lib/constants/patient-constants.ts";
	import { lumaIconBadge } from "#lib/styles/luma.ts";
	import type { IdentifierType } from "#lib/types/member-patient.ts";
	import { cn } from "#lib/utils.ts";
	import { validateIdentifier } from "#lib/validation/tw-identifier.ts";

	// 移植自舊版 app/auth/complete-profile（layout 為 PublicFrame）：首次登入建立本人就診資料。
	// 伺服器端與載入期間只顯示轉圈；登入守門、查詢既有看診對象都在瀏覽器端。
	// next：舊版未檢查就交給 router（外部網址會整頁跳走）；SvelteKit 的 goto 不接受外部網址，
	// 這裡沿用 /auth 的站內路徑檢查（外部網址改回 /member）。
	const auth = getAuth();
	const nextUrl = $derived(safeNextUrl(page.url.searchParams.get("next")));

	// 與舊版 useState 初值相同：只取元件建立當下的顯示名稱（直接開本頁時登入狀態尚未載入 → 空白）
	let name = $state(untrack(() => auth.user?.display_name || ""));
	let identifierType = $state<IdentifierType>("national_id");
	let identifierValue = $state("");
	let birthDate = $state("");
	let gender = $state("");
	let phone = $state("");
	let error = $state<string | null>(null);
	let identifierError = $state<string | null>(null);
	let isSubmitting = $state(false);
	let isCheckingProfile = $state(true);

	const identifierItems = (["national_id", "arc", "passport"] as const).map((value) => ({
		value,
		label: IDENTIFIER_TYPE_LABELS[value],
	}));

	// 如果已經有 member_patients 就跳過
	async function checkExistingProfile(next: string) {
		try {
			const patients = await memberPatientApi.list();
			if (patients.length > 0) {
				goto(next, { replaceState: true });
				return;
			}
		} catch {
			// 沒有 patients 或 API 錯誤 → 繼續顯示表單
		}
		isCheckingProfile = false;
	}

	$effect(() => {
		const next = nextUrl;
		if (auth.isLoading) return;
		if (!auth.isAuthenticated) {
			goto(`/auth?next=${encodeURIComponent(next)}`, { replaceState: true });
			return;
		}
		untrack(() => checkExistingProfile(next));
	});

	// 即時驗證身分證
	const handleIdentifierChange = (value: string) => {
		identifierValue = value;
		if (value.trim().length >= 6) {
			const isValid = validateIdentifier(identifierType, value);
			identifierError = isValid ? null : IDENTIFIER_ERROR_MESSAGES[identifierType];
		} else {
			identifierError = null;
		}
	};

	const handleSubmit = async (e: SubmitEvent) => {
		e.preventDefault();
		error = null;

		if (!validateIdentifier(identifierType, identifierValue)) {
			identifierError = IDENTIFIER_ERROR_MESSAGES[identifierType];
			return;
		}

		isSubmitting = true;
		try {
			await memberPatientApi.create({
				name,
				identifier_type: identifierType,
				identifier_value: identifierValue,
				birth_date: birthDate,
				gender,
				phone: phone || undefined,
				relation: "self",
			});
			goto(nextUrl);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "建立失敗，請稍後再試";
			error = msg.includes("已經是") ? "此身分識別碼已經綁定過帳號" : msg;
		} finally {
			isSubmitting = false;
		}
	};
</script>

<PublicFrame>
	{#if auth.isLoading || isCheckingProfile}
		<div class="flex min-h-[70vh] items-center justify-center bg-background">
			<div class="size-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
		</div>
	{:else}
		<div class="flex min-h-[70vh] items-center justify-center bg-background p-4">
			<Card class="w-full max-w-lg">
				<CardHeader class="items-center text-center">
					<div class={cn(lumaIconBadge, "size-14")}>
						<UserPlus class="size-6" />
					</div>
					<CardTitle class="mt-3 text-xl"><h1>建立個人資料</h1></CardTitle>
					<CardDescription>
						{auth.user?.email
							? `${auth.user.email}，請填寫以下資料完成註冊`
							: "首次登入需填寫基本資料以開始使用預約服務"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onsubmit={handleSubmit} class="space-y-4">
						{#if error}
							<div
								class="rounded-xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20"
							>
								{error}
							</div>
						{/if}

						<div class="grid gap-2">
							<Label for="name">姓名 <span class="text-destructive">*</span></Label>
							<Input id="name" bind:value={name} placeholder="王小明" required />
						</div>

						<div class="grid gap-2">
							<Label>身分識別碼 <span class="text-destructive">*</span></Label>
							<div class="grid grid-cols-[140px_1fr] gap-2">
								<Select
									type="single"
									items={identifierItems}
									value={identifierType}
									onValueChange={(v) => {
										identifierType = v as IdentifierType;
										identifierError = null;
									}}
								>
									<SelectTrigger id="identifier-type"><SelectValue /></SelectTrigger>
									<SelectContent>
										{#each identifierItems as option (option.value)}
											<SelectItem value={option.value} label={option.label} />
										{/each}
									</SelectContent>
								</Select>
								<Input
									id="identifier-value"
									value={identifierValue}
									oninput={(e) => handleIdentifierChange(e.currentTarget.value)}
									placeholder={IDENTIFIER_PLACEHOLDERS[identifierType]}
									required
								/>
							</div>
							{#if identifierError}
								<p class="text-xs text-destructive">{identifierError}</p>
							{/if}
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="grid gap-2">
								<Label for="birth-date">生日 <span class="text-destructive">*</span></Label>
								<Input id="birth-date" type="date" bind:value={birthDate} required />
							</div>
							<div class="grid gap-2">
								<Label>性別 <span class="text-destructive">*</span></Label>
								<RadioGroup value={gender} onValueChange={(v) => (gender = v)} class="flex gap-4 pt-2">
									<label for="gender-m" class="flex items-center gap-2">
										<RadioGroupItem value="M" id="gender-m" />
										<span class="text-sm">男</span>
									</label>
									<label for="gender-f" class="flex items-center gap-2">
										<RadioGroupItem value="F" id="gender-f" />
										<span class="text-sm">女</span>
									</label>
								</RadioGroup>
							</div>
						</div>

						<div class="grid gap-2">
							<Label for="phone">電話（選填）</Label>
							<Input
								id="phone"
								type="tel"
								bind:value={phone}
								placeholder="0912345678"
								maxlength={15}
							/>
						</div>

						<Button
							type="submit"
							class="w-full"
							disabled={isSubmitting ||
								!name.trim() ||
								!identifierValue.trim() ||
								!birthDate ||
								!gender}
						>
							{isSubmitting ? "建立中..." : "完成註冊"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	{/if}
</PublicFrame>

<script lang="ts">
	import { ApiError } from "#lib/api/client.ts";
	import { memberApi } from "#lib/api/member.ts";
	import { Button } from "#lib/components/ui/button/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "#lib/components/ui/dialog/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import type { User } from "#lib/types/auth.ts";

	// 移植自舊版 components/member/edit-profile-dialog.tsx
	let {
		open,
		onOpenChange,
		user,
		onSaved,
	}: {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		/** 目前登入會員（帶入既有顯示名稱 / 手機，email 唯讀顯示） */
		user: User | null;
		/** 儲存成功的回呼（父層用來刷新 auth user，避免畫面不同步） */
		onSaved: () => void | Promise<void>;
	} = $props();

	let displayName = $state("");
	let phone = $state("");
	let error = $state<string | null>(null);
	let isSubmitting = $state(false);

	// 每次開啟時帶入目前資料
	$effect(() => {
		if (!open) return;
		displayName = user?.display_name ?? "";
		phone = user?.phone_number ?? "";
		error = null;
	});

	const handleSubmit = async (e: SubmitEvent) => {
		e.preventDefault();
		error = null;

		// 與後端同寬鬆度：trim 後只驗長度，空字串＝清空；手機不強驗格式
		const trimmedName = displayName.trim();
		const trimmedPhone = phone.trim();
		if (trimmedName.length > 100) {
			error = "顯示名稱長度不可超過 100 字";
			return;
		}
		if (trimmedPhone.length > 20) {
			error = "手機號碼長度不可超過 20 字";
			return;
		}

		isSubmitting = true;
		try {
			// 兩欄位皆送出（部分更新語意：帶 null＝清空）
			await memberApi.updateProfile({
				display_name: trimmedName || null,
				phone: trimmedPhone || null,
			});
			await onSaved();
			onOpenChange(false);
		} catch (err) {
			// 優先讀後端回傳的繁中錯誤訊息（ApiError.data.detail）
			let msg = "儲存失敗，請稍後再試";
			if (err instanceof ApiError) {
				const data = err.data as { detail?: unknown; message?: unknown } | null;
				const detail = data?.detail ?? data?.message;
				if (typeof detail === "string") msg = detail;
			}
			error = msg;
		} finally {
			isSubmitting = false;
		}
	};
</script>

<!-- 儲存中不允許關閉（Esc / 點遮罩），避免錯誤訊息無處顯示：以 function binding 擋下關閉，Bits 的開關狀態跟著父層 -->
<Dialog
	bind:open={
		() => open,
		(next) => {
			if (isSubmitting && !next) return;
			onOpenChange(next);
		}
	}
>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>編輯個人資料</DialogTitle>
			<DialogDescription>更新顯示名稱與手機號碼，Email 為登入身分無法修改</DialogDescription>
		</DialogHeader>

		<form onsubmit={handleSubmit} class="space-y-4">
			{#if error}
				<div class="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
					{error}
				</div>
			{/if}

			<div class="space-y-2">
				<Label for="ep-email">Email</Label>
				<Input id="ep-email" value={user?.email ?? ""} disabled readonly autocomplete="email" />
				<p class="text-xs text-muted-foreground">Email 為第三方登入身分識別，無法編輯</p>
			</div>

			<div class="space-y-2">
				<Label for="ep-display-name">顯示名稱</Label>
				<Input
					id="ep-display-name"
					bind:value={displayName}
					placeholder="例：王小明"
					maxlength={100}
					autocomplete="name"
				/>
			</div>

			<div class="space-y-2">
				<Label for="ep-phone">手機號碼</Label>
				<Input
					id="ep-phone"
					type="tel"
					bind:value={phone}
					placeholder="例：0912345678"
					maxlength={20}
					autocomplete="tel"
				/>
				<p class="text-xs text-muted-foreground">留空即清除手機號碼</p>
			</div>

			<DialogFooter class="gap-2 sm:gap-3">
				<Button type="button" variant="outline" onclick={() => onOpenChange(false)} disabled={isSubmitting}>
					取消
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? "儲存中..." : "儲存"}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>

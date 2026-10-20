<script lang="ts">
	import CheckCircle2 from "@lucide/svelte/icons/circle-check";
	import KeyRound from "@lucide/svelte/icons/key-round";
	import Loader2 from "@lucide/svelte/icons/loader-circle";
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Card } from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { MIN_PASSWORD, validateVerifyPassword } from "$lib/join/join-form";

	/**
	 * 申請人點驗證信後設定後台密碼（移植自舊版 components/join/verify-form.tsx）。
	 *
	 * 這一步同時完成兩件事：證明信箱是本人的、以及設定密碼——所以密碼
	 * 從頭到尾不會出現在 email 裡。設定完成後仍需人工審核才會開通後台。
	 * 只在瀏覽器端渲染（頁面在伺服器端輸出「載入中…」，同舊版 Suspense），token 由網址讀取。
	 */
	const token = page.url.searchParams.get("token") ?? "";
	let password = $state("");
	let confirm = $state("");
	let error = $state<string | null>(null);
	let isSubmitting = $state(false);
	let done = $state(false);
	// 信箱已經有 Cross 帳號的人沿用原本的密碼——一個人可以同時是院所管理者與
	// 民眾（院長自己也會去別家診所看診）。載入時先問後端要不要設密碼，
	// 否則會逼他設一組後端根本不會採用的密碼。
	let info = $state<{ needsPassword: boolean } | null>(null);
	let loadError = $state<string | null>(null);

	$effect(() => {
		if (!token) return;
		let alive = true;
		(async () => {
			try {
				const res = await fetch(`/api/v1/facility-applications/verify?token=${encodeURIComponent(token)}`);
				const json = (await res.json().catch(() => null)) as { needs_password?: boolean; detail?: string } | null;
				if (!alive) return;
				if (res.ok && json) info = { needsPassword: json.needs_password !== false };
				else loadError = json?.detail ?? "驗證連結無效或已過期，請重新送出申請";
			} catch {
				if (alive) loadError = "連線失敗，請稍後再試";
			}
		})();
		return () => {
			alive = false;
		};
	});

	const needsPassword = $derived(info?.needsPassword ?? true);

	const handleSubmit = async (e: SubmitEvent) => {
		e.preventDefault();
		error = null;
		if (needsPassword) {
			const invalid = validateVerifyPassword(password, confirm);
			if (invalid) {
				error = invalid;
				return;
			}
		}
		isSubmitting = true;
		try {
			const res = await fetch("/api/v1/facility-applications/verify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(needsPassword ? { token, password } : { token }),
			});
			if (res.ok) {
				done = true;
				return;
			}
			const detail = (await res.json().catch(() => null)) as { detail?: string } | null;
			error = detail?.detail ?? "驗證失敗，請重新送出申請";
		} catch {
			error = "連線失敗，請稍後再試";
		} finally {
			isSubmitting = false;
		}
	};
</script>

{#if !token}
	<Card class="w-full max-w-md p-8 text-center">
		<p class="text-sm text-muted-foreground">這個連結不完整，請從信件中的連結重新開啟。</p>
	</Card>
{:else if done}
	<Card class="w-full max-w-md space-y-4 p-8 text-center">
		<div
			class="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
		>
			<CheckCircle2 class="size-6" />
		</div>
		<h1 class="text-lg font-semibold text-foreground">信箱驗證完成</h1>
		<p class="text-sm leading-relaxed text-muted-foreground">
			{info?.needsPassword === false ? "你原本就有 Cross 帳號，密碼沿用原本那組。" : "密碼已設定。"}我們會盡快審核您的申請，<strong
				class="font-medium text-foreground">審核通過後才會開通後台</strong
			>，屆時會以這個信箱通知您。
		</p>
		<Button href="/" variant="outline" class="mt-2">回首頁</Button>
	</Card>
{:else if loadError}
	<Card class="w-full max-w-md p-8 text-center">
		<p class="text-sm text-muted-foreground">{loadError}</p>
	</Card>
{:else if !info}
	<Card class="w-full max-w-md p-8 text-center">
		<Loader2 class="mx-auto size-5 animate-spin text-muted-foreground" />
	</Card>
{:else}
	<Card class="w-full max-w-md space-y-5 p-8">
		<div class="space-y-1.5">
			<div class="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
				<KeyRound class="size-5" />
			</div>
			<h1 class="pt-2 text-lg font-semibold text-foreground">
				{needsPassword ? "設定後台密碼" : "確認信箱"}
			</h1>
			<p class="text-sm leading-relaxed text-muted-foreground">
				{needsPassword
					? "設定完成即完成信箱驗證。通過審核後，就用這組密碼登入院所後台。"
					: "這個信箱已經有 Cross 帳號，密碼沿用原本那組，不需要重設。按下按鈕即完成信箱驗證。"}
			</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-4">
			{#if needsPassword}
				<div class="grid gap-2">
					<Label for="password">密碼</Label>
					<Input
						id="password"
						type="password"
						autocomplete="new-password"
						bind:value={password}
						placeholder={`至少 ${MIN_PASSWORD} 碼`}
						required
					/>
				</div>
				<div class="grid gap-2">
					<Label for="confirm">再次輸入密碼</Label>
					<Input id="confirm" type="password" autocomplete="new-password" bind:value={confirm} required />
				</div>
			{/if}

			{#if error}
				<p class="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
			{/if}

			<Button type="submit" class="w-full" disabled={isSubmitting}>
				{#if isSubmitting}<Loader2 class="size-4 animate-spin" />{/if}
				{isSubmitting ? "處理中…" : needsPassword ? "設定密碼並完成驗證" : "完成信箱驗證"}
			</Button>
		</form>
	</Card>
{/if}

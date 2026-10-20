<script lang="ts">
	import Building2 from "@lucide/svelte/icons/building-2";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { getAuth } from "$lib/auth/auth.svelte";
	import { isBookingNext, safeNextUrl } from "$lib/auth/social-login";
	import AppleSignInButton from "$lib/components/auth/AppleSignInButton.svelte";
	import AuthSplitLayout from "$lib/components/auth/AuthSplitLayout.svelte";
	import GoogleSignInButton from "$lib/components/auth/GoogleSignInButton.svelte";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { lumaIconBadge } from "$lib/styles/luma";
	import { cn } from "$lib/utils";

	// 移植自舊版 app/auth/page.tsx：民眾端登入（Google / Apple）。
	// 伺服器端與載入登入狀態期間只顯示轉圈（舊版 Suspense fallback 與 isLoading 同一個轉圈）；?next= 在瀏覽器端才讀。
	const auth = getAuth();
	let error = $state("");
	let isSubmitting = $state(false);

	const nextUrl = $derived(safeNextUrl(page.url.searchParams.get("next")));
	const isBooking = $derived(isBookingNext(nextUrl));

	// 已登入（含剛登入完成）→ 以 replace 回到 next
	$effect(() => {
		if (!auth.isLoading && auth.isAuthenticated) goto(nextUrl, { replaceState: true });
	});

	const handleGoogleSuccess = async (idToken: string) => {
		error = "";
		isSubmitting = true;
		try {
			await auth.loginWithGoogle(idToken);
			goto(nextUrl);
		} catch (err) {
			error = err instanceof Error ? err.message : "登入失敗，請稍後再試";
		} finally {
			isSubmitting = false;
		}
	};

	const handleAppleSuccess = async (idToken: string, userName?: string) => {
		error = "";
		isSubmitting = true;
		try {
			await auth.loginWithApple(idToken, userName);
			goto(nextUrl);
		} catch (err) {
			error = err instanceof Error ? err.message : "登入失敗，請稍後再試";
		} finally {
			isSubmitting = false;
		}
	};
</script>

{#if auth.isLoading}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="size-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
	</div>
{:else}
	<AuthSplitLayout variant="consumer">
		<Card class="w-full max-w-md border-none bg-transparent shadow-none">
			<CardHeader class="items-center text-center">
				<div class={cn(lumaIconBadge, "size-14")}>
					<Building2 class="size-6" />
				</div>
				<CardTitle class="mt-3 text-2xl"><h1>登入 Cross</h1></CardTitle>
				<CardDescription>
					{isBooking
						? "登入後回到所選時段，確認看診對象後即可完成預約。"
						: "登入後即可預約看診、管理看診對象與查看預約紀錄"}
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-3">
				{#if isBooking}<a
						href={nextUrl}
						class="mb-3 block text-center text-sm text-primary underline underline-offset-4">返回選擇時段</a
					>{/if}
				{#if error}
					<div class="rounded-xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
						{error}
					</div>
				{/if}

				<GoogleSignInButton
					onSuccess={handleGoogleSuccess}
					onError={() => (error = "Google 登入失敗，請重試")}
					disabled={isSubmitting}
				/>

				<AppleSignInButton
					onSuccess={handleAppleSuccess}
					onError={(msg) => (error = msg ?? "Apple 登入失敗，請重試")}
					disabled={isSubmitting}
				/>

				{#if isSubmitting}
					<div class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
						<div class="size-4 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
						登入中...
					</div>
				{/if}

				<p class="pt-2 text-center text-xs text-muted-foreground">
					登入即表示同意 <a href="/terms" class="underline underline-offset-2 hover:text-foreground">服務條款</a>
					與
					<a href="/privacy" class="underline underline-offset-2 hover:text-foreground">隱私政策</a>
				</p>
			</CardContent>
		</Card>
	</AuthSplitLayout>
{/if}

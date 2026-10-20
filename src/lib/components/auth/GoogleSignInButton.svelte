<script lang="ts">
	import { onMount } from "svelte";
	import { env } from "$env/dynamic/public";
	import {
		GOOGLE_BUTTON_HEIGHT,
		GOOGLE_BUTTON_OPTIONS,
		GSI_SCRIPT_SRC,
		googleCredentialCallback,
		googleInitOptions,
	} from "$lib/auth/social-login";
	import { SOCIAL_BUTTON_CLASS } from "./social-button";

	// 移植自舊版 GoogleSignInButton（@react-oauth/google 的 GoogleOAuthProvider + GoogleLogin）：
	// 直接載 Google Identity Services，initialize / renderButton 的參數與套件相同（見 social-login.ts）。
	// 可見的是自訂按鈕（不可點），Google 的真按鈕以近乎透明的方式疊在上面，點擊走 Google 的安全流程。
	let {
		onSuccess,
		onError,
		disabled = false,
	}: {
		onSuccess: (idToken: string) => void;
		onError?: () => void;
		disabled?: boolean;
	} = $props();

	const clientId = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

	interface GoogleAccountsId {
		initialize: (options: ReturnType<typeof googleInitOptions>) => void;
		renderButton: (parent: HTMLElement, options: typeof GOOGLE_BUTTON_OPTIONS) => void;
	}

	let container = $state<HTMLDivElement | null>(null);

	onMount(() => {
		if (!clientId) return;
		// 與 useLoadGsiScript 相同：每個按鈕各自附加一個 script 到 body，卸載時移除
		const script = document.createElement("script");
		script.src = GSI_SCRIPT_SRC;
		script.async = true;
		script.defer = true;
		script.onload = () => {
			const id = (window as { google?: { accounts?: { id?: GoogleAccountsId } } }).google?.accounts?.id;
			id?.initialize(
				googleInitOptions(
					clientId,
					googleCredentialCallback({
						onSuccess: (idToken) => onSuccess(idToken),
						onError: () => onError?.(),
						isDisabled: () => disabled,
					}),
				),
			);
			if (container) id?.renderButton(container, GOOGLE_BUTTON_OPTIONS);
		};
		document.body.appendChild(script);
		return () => script.remove();
	});
</script>

{#snippet googleIcon()}
	<svg class="size-5" viewBox="0 0 24 24" aria-hidden="true">
		<path
			d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
			fill="#4285F4"
		/>
		<path
			d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
			fill="#34A853"
		/>
		<path
			d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
			fill="#FBBC05"
		/>
		<path
			d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
			fill="#EA4335"
		/>
	</svg>
{/snippet}

{#if !clientId}
	<button type="button" disabled class={SOCIAL_BUTTON_CLASS}>{@render googleIcon()}Google 登入尚未設定</button>
{:else}
	<div class="relative w-full">
		<!-- 可見的自訂按鈕（不可點 — 點擊穿透到下面 Google 的真按鈕） -->
		<div class="{SOCIAL_BUTTON_CLASS} pointer-events-none">
			{@render googleIcon()}<span>使用 Google 帳號登入</span>
		</div>
		<!-- Google 真按鈕（透明覆蓋在上面，點擊觸發 Google 的安全流程） -->
		<div class="absolute inset-0 overflow-hidden opacity-[0.011]">
			<div bind:this={container} style="height: {GOOGLE_BUTTON_HEIGHT}px;"></div>
		</div>
	</div>
{/if}

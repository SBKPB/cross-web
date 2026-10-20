<script lang="ts">
	import { onMount } from "svelte";
	import { env } from "$env/dynamic/public";
	import {
		APPLE_SCRIPT_SRC,
		appleAuthOptions,
		appleErrorHandler,
		appleRedirectUri,
		appleResponseHandler,
		appleSignIn,
	} from "$lib/auth/social-login";
	import { SOCIAL_BUTTON_CLASS } from "./social-button";

	// 移植自舊版 AppleSignInButton（react-apple-signin-auth 的 AppleSignin + 自訂 render）：
	// 直接載 Sign in with Apple JS，點擊時 init（usePopup）→ signIn()，回傳 id_token 與首次授權的姓名。
	let {
		onSuccess,
		onError,
		disabled = false,
	}: {
		onSuccess: (idToken: string, userName?: string) => void;
		onError?: (message?: string) => void;
		disabled?: boolean;
	} = $props();

	const clientId = env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? "";

	onMount(() => {
		if (!clientId) return;
		// 與套件的 useScript 相同：頁面上還沒有才附加，卸載時不移除
		if (document.querySelector(`script[src="${APPLE_SCRIPT_SRC}"]`)) return;
		const script = document.createElement("script");
		script.src = APPLE_SCRIPT_SRC;
		script.async = true;
		document.body.appendChild(script);
	});

	function handleClick(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		void appleSignIn({
			authOptions: appleAuthOptions(
				clientId,
				appleRedirectUri(env.NEXT_PUBLIC_APPLE_REDIRECT_URI, window.location.origin),
			),
			// disabled 取點擊當下的值（套件在點擊時捕捉 onSuccess）
			onSuccess: appleResponseHandler({ disabled, onSuccess, onError }),
			onError: appleErrorHandler(onError),
		});
	}
</script>

{#snippet appleIcon()}
	<svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path
			d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
		/>
	</svg>
{/snippet}

{#if !clientId}
	<button type="button" disabled class={SOCIAL_BUTTON_CLASS}>{@render appleIcon()}Apple 登入尚未設定</button>
{:else}
	<button type="button" onclick={handleClick} {disabled} class={SOCIAL_BUTTON_CLASS}
		>{@render appleIcon()}<span>使用 Apple 帳號登入</span></button
	>
{/if}

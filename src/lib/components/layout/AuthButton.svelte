<script lang="ts">
	import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
	import LogIn from "@lucide/svelte/icons/log-in";
	import UserIcon from "@lucide/svelte/icons/user";
	import { Button } from "#lib/components/ui/button/index.js";
	import { getAuth } from "#lib/auth/auth.svelte.ts";
	import { canAccessAdmin, getAdminHomePath } from "#lib/auth/roles.ts";

	// 民眾帳戶與管理帳戶沿用同一個登入狀態；院所入口由 ClinicEntry 提供。
	const auth = getAuth();
	const isAdmin = $derived(canAccessAdmin(auth.user));
</script>

{#if auth.isLoading}
	<!-- 載入中不顯示 -->
{:else if auth.isAuthenticated && auth.user}
	<Button
		href={isAdmin ? getAdminHomePath(auth.user) : "/member"}
		variant="ghost"
		size="sm"
		class="gap-1.5 text-foreground hover:text-primary {isAdmin ? 'min-h-11' : ''}"
	>
		{#if isAdmin}
			<LayoutDashboard class="size-4" />
		{:else}
			<UserIcon class="size-4" />
		{/if}
		<span class={isAdmin ? "" : "hidden sm:inline"}>
			{isAdmin ? "管理後台" : auth.user.display_name || auth.user.email.split("@")[0]}
		</span>
	</Button>
{:else}
	<Button href="/auth" size="sm" class="gap-1.5">
		<LogIn class="size-4" />
		登入
	</Button>
{/if}

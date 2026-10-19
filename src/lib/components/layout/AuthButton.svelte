<script lang="ts">
	import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
	import LogIn from "@lucide/svelte/icons/log-in";
	import UserIcon from "@lucide/svelte/icons/user";
	import { Button } from "$lib/components/ui/button/index.js";
	import { getAuth } from "$lib/auth/auth.svelte";
	import { canAccessAdmin, getAdminHomePath } from "$lib/auth/roles";

	/**
	 * 民眾端 header 的登入 / 帳號按鈕
	 *
	 * - 未登入：只顯示民眾「登入」→ /auth
	 * - 已登入（民眾）：顯示使用者名稱 → /member
	 * - 已登入（後台帳號）：顯示「管理後台」→ 後台首頁，不導向民眾端
	 *
	 * 未登入時不放「診所登入」：這是民眾端 header，四個項目在民眾／院所兩種身分之間
	 * 交錯只會讓民眾困惑。院所入口統一走「夥伴加入」與 footer 的「醫療院所」區
	 * （那裡已有診所登入），登入後台帳號後再由「管理後台」接手。
	 */
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
		class="gap-1.5 text-foreground hover:text-primary"
	>
		{#if isAdmin}
			<LayoutDashboard class="size-4" />
		{:else}
			<UserIcon class="size-4" />
		{/if}
		<span class="hidden sm:inline">
			{isAdmin ? "管理後台" : auth.user.display_name || auth.user.email.split("@")[0]}
		</span>
	</Button>
{:else}
	<Button href="/auth" size="sm" class="gap-1.5">
		<LogIn class="size-4" />
		登入
	</Button>
{/if}

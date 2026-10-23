<script lang="ts">
	import CalendarDays from "@lucide/svelte/icons/calendar-days";
	import Heart from "@lucide/svelte/icons/heart";
	import Users from "@lucide/svelte/icons/users";
	import { page } from "$app/state";
	import { cn } from "#lib/utils.ts";

	const LINKS = [
		{ href: "/member", label: "我的預約", icon: CalendarDays },
		{ href: "/member/favorites", label: "收藏店家", icon: Heart },
		{ href: "/member/patients", label: "預約對象", icon: Users },
	];

	const pathname = $derived<string>(page.url.pathname);
</script>

<div class="border-b border-border/60 bg-[#eff4fa] dark:bg-[#142238]">
	<div class="home-container py-6 sm:py-8">
		<p class="home-eyebrow">MY CROSS / 你的健康日常</p>
		<nav aria-label="會員功能" class="mt-4 flex gap-1 sm:gap-3">
			{#each LINKS as { href, label, icon: Icon } (href)}
				{@const active =
					href === "/member"
						? pathname === href || pathname.startsWith("/member/appointments/")
						: pathname === href}
				<a
					{href}
					aria-current={active ? "page" : undefined}
					class={cn(
						"inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors sm:px-5",
						active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-card hover:text-primary",
					)}><Icon class="hidden size-4 min-[370px]:block" />{label}</a
				>
			{/each}
		</nav>
	</div>
</div>

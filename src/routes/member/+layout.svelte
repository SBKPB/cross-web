<script lang="ts">
	import MemberNavigation from "#lib/components/public/MemberNavigation.svelte";
	import PublicFrame from "#lib/components/public/PublicFrame.svelte";

	// 移植自舊版 app/member/layout.tsx：民眾端外框 + 會員功能導覽
	let { children } = $props();
</script>

<PublicFrame><MemberNavigation />{@render children()}</PublicFrame>

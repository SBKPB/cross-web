<script lang="ts">
	import ArrowLeft from "@lucide/svelte/icons/arrow-left";
	import Seo from "#lib/components/Seo.svelte";
	import JoinForm from "#lib/components/join/JoinForm.svelte";
	import SiteFooter from "#lib/components/layout/SiteFooter.svelte";
	import SiteHeader from "#lib/components/layout/SiteHeader.svelte";
	import PageIntro from "#lib/components/public/PageIntro.svelte";

	/**
	 * 申請流程的第一步（填寫資料），移植自舊版 app/join/apply/page.tsx。
	 *
	 * 刻意獨立成一頁而不是塞在 /join 落地頁底部：18 個欄位鋪在行銷內容後面，
	 * 使用者會邊看邊被打斷；而且「申請」是一段有前後關係的流程
	 * （填寫 → 驗證信箱 → 審核），值得有自己的空間。
	 */
	let { data } = $props();
</script>

<Seo {...data.seo} />

<div class="public-page flex min-h-screen flex-col bg-background">
	<SiteHeader />
	<main class="flex-1">
		<PageIntro
			compact
			eyebrow="CROSS PARTNERS / 開始申請"
			title="成為 Cross 合作夥伴"
			description="填寫資料並驗證信箱，即可進後台設定。通過審核後公開上架，完成方案與排班設定後開放線上預約。"
		/>
		<div class="container mx-auto max-w-2xl px-4 py-10 sm:py-14">
			<a
				href="/join"
				class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft class="size-4" />
				回夥伴加入
			</a>
			<div class="mt-6">
				<JoinForm />
			</div>
		</div>
	</main>
	<SiteFooter />
</div>

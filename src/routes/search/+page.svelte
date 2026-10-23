<script lang="ts">
	import ClinicSearchView from "#lib/components/clinics/ClinicSearchView.svelte";
	import SiteFooter from "#lib/components/layout/SiteFooter.svelte";
	import SiteHeader from "#lib/components/layout/SiteHeader.svelte";
	import PageIntro from "#lib/components/public/PageIntro.svelte";
	import Seo from "#lib/components/Seo.svelte";

	// 移植自舊 Next 的 app/search/page.tsx。外框標記照舊版（main 沒有 PublicFrame 的 id 與 min-w-0），不共用 PublicFrame。
	// 同一路由換網址參數（例如從 /search?type=x 點「預約服務」）時元件不重掛載、篩選維持原狀，
	// 與舊版 App Router 換 searchParams 保留 client 狀態相同（ClinicSearchView 只取 initialFilters 初始值）。
	let { data } = $props();
</script>

<Seo {...data.seo} />

<div class="public-page min-h-screen bg-background flex flex-col">
	<SiteHeader />

	<main class="flex-1">
		<PageIntro
			compact
			eyebrow="EXPLORE / 找到適合的服務"
			title="搜尋店家"
			description="依地區、服務或專業人員搜尋，先了解，再安心預約。"
		/>

		<div class="home-container py-3 pb-16 sm:py-6 sm:pb-24">
			<ClinicSearchView initialFilters={data.initialFilters} />
		</div>
	</main>

	<SiteFooter />
</div>

<script lang="ts">
	import ClinicSearchView from "#lib/components/clinics/ClinicSearchView.svelte";
	import SiteFooter from "#lib/components/layout/SiteFooter.svelte";
	import SiteHeader from "#lib/components/layout/SiteHeader.svelte";
	import PageIntro from "#lib/components/public/PageIntro.svelte";
	import Seo from "#lib/components/Seo.svelte";

	let { data } = $props();
</script>

<Seo {...data.seo} />

<div class="public-page min-h-screen bg-background flex flex-col">
	<SiteHeader />

	<main class="flex-1">
		<PageIntro
			compact
			eyebrow="EXPLORE / 找到適合的服務"
			title="找院所與服務"
			description="依地區、服務或專業人員搜尋，先了解，再安心預約。"
		/>

		<div class="home-container py-3 pb-16 sm:py-6 sm:pb-24">
			<ClinicSearchView />
		</div>
	</main>

	<SiteFooter />
</div>

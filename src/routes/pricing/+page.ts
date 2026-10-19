import type { SeoProps } from "$lib/components/Seo.svelte";
import type { PageLoad } from "./$types";

export const load: PageLoad = () => ({
	seo: {
		title: "Cross 方案與合作",
		description:
			"Cross 預約工作流程單一方案 NT$3,000／月，設備、HIS 與客製整合依範圍報價。Design Partner 共同驗證實際流程。",
		canonical: "/pricing",
	} satisfies SeoProps,
});

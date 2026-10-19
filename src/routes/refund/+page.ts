import type { SeoProps } from "$lib/components/Seo.svelte";
import type { PageLoad } from "./$types";

const DESCRIPTION =
	"Cross 退款政策：取消續訂後使用至到期，誤購或誤續約於付款後 7 日內且未使用付費功能可申請退款，另提供扣款錯誤與服務問題的處理方式。";

// 對應舊版 metadata：有覆寫 openGraph / twitter，全站 og（site_name、locale、type、分享圖）整組不沿用
export const load: PageLoad = () => ({
	seo: {
		title: "退款政策",
		description: DESCRIPTION,
		canonical: "/refund",
		openGraph: { title: "退款政策 | Cross", description: DESCRIPTION, url: "/refund" },
		twitter: { card: "summary", title: "退款政策 | Cross", description: DESCRIPTION },
	} satisfies SeoProps,
});

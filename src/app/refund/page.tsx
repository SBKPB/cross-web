import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DESCRIPTION =
  "Cross 退款政策：取消續訂後使用至到期，誤購或誤續約於付款後 7 日內且未使用付費功能可申請退款，另提供扣款錯誤與服務問題的處理方式。";

export const metadata: Metadata = {
  title: "退款政策",
  description: DESCRIPTION,
  alternates: { canonical: "/refund" },
  openGraph: {
    title: "退款政策 | Cross",
    description: DESCRIPTION,
    url: "/refund",
  },
  twitter: {
    card: "summary",
    title: "退款政策 | Cross",
    description: DESCRIPTION,
  },
};

export default function RefundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          退款政策
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          本政策適用於由 Cross 收取的院所月繳及年繳訂閱費用。
          依法或依雙方個別書面約定享有更有利的退款權利者，優先適用該規定或約定。
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          最後更新日期：<time dateTime="2026-09-11">2026 年 9 月 11 日</time>
        </p>

        <Card className="mt-8">
          <CardContent className="space-y-8 text-base leading-8 text-muted-foreground">
            <section aria-labelledby="free-trial">
              <h2 id="free-trial" className="mb-2 text-lg font-semibold text-foreground">
                1. 免費試用
              </h2>
              <p>
                免費方案及免費試用期間未收取訂閱費用，因此不涉及退款。
                付費前，請確認方案內容、計費週期及金額。
              </p>
            </section>

            <section aria-labelledby="subscription-cancellation">
              <h2 id="subscription-cancellation" className="mb-2 text-lg font-semibold text-foreground">
                2. 取消續訂
              </h2>
              <p>
                您可聯繫 Cross 營運團隊申請停止續訂。取消後，
                仍可使用付費功能至已付款的訂閱期間結束，下一期不再續訂。
              </p>
              <p className="mt-3">
                除符合本政策的退款條件或法令另有規定外，月繳及年繳方案不因提前停止使用，
                而退還剩餘天數或月份的費用。
              </p>
            </section>

            <section aria-labelledby="refund-eligibility">
              <h2 id="refund-eligibility" className="mb-2 text-lg font-semibold text-foreground">
                3. 誤購或誤續約退款
              </h2>
              <p>
                因誤購或誤續約而申請退款，符合下列條件者，可退還該筆訂閱費用全額：
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  於付款日起 7 個日曆日內提出申請，以退款申請寄出時間為準。
                </li>
                <li>
                  該筆付款對應的訂閱期間內，尚未使用付費功能，例如透過系統受理預約、
                  發送預約提醒、使用叫號管理或付費分析報表。僅登入帳號、查看帳務或
                  維護免費院所資訊，不視為使用付費功能。
                </li>
              </ul>
              <p className="mt-3">
                此項誤購優惠每間院所以一次為限。法定退費、扣款錯誤及 Cross
                未依約提供服務的退款，不受此次數限制。
              </p>
            </section>

            <section aria-labelledby="billing-and-service-issues">
              <h2 id="billing-and-service-issues" className="mb-2 text-lg font-semibold text-foreground">
                4. 扣款錯誤與服務問題
              </h2>
              <p>
                如有重複扣款或收費金額錯誤，經核實後，Cross 將退還重複或多收的款項。
              </p>
              <p className="mt-3">
                如 Cross 未依約提供服務，完全未提供服務者，全額退費；已提供部分服務者，
                依未提供服務期間占該計費期間的比例，按實際支付金額計算退款。
                依法應負的其他責任不受影響。
              </p>
            </section>

            <section aria-labelledby="refund-request">
              <h2 id="refund-request" className="mb-2 text-lg font-semibold text-foreground">
                5. 申請方式與退款處理
              </h2>
              <p>
                請寄信至 office@twinhao.com，主旨註明「Cross 退款申請」，提供院所名稱、
                註冊信箱、付款日期、金額、付款憑證或交易編號，以及申請事項。
              </p>
              <p className="mt-3">
                Cross 會核對付款與服務使用紀錄，並以電子郵件告知處理結果。核准退款後，
                原則於 7 個工作日內完成退款作業，退回原付款方式；若無法原路退回，
                會與原付款人確認其他方式。實際入帳時間依銀行或付款服務商作業而定，
                法令另有期限規定者優先適用。
              </p>
              <p className="mt-3">
                全額退款核准後，該期付費權限將終止；部分退款案件的服務終止日期，
                將於處理結果中說明。
              </p>
              <Button asChild className="mt-4">
                <a href={`mailto:office@twinhao.com?subject=${encodeURIComponent("Cross 退款申請")}`}>
                  聯繫客服申請退款
                </a>
              </Button>
              <p className="mt-2 break-words text-sm">客服信箱：office@twinhao.com</p>
            </section>

            <section aria-labelledby="patient-fees">
              <h2 id="patient-fees" className="mb-2 text-lg font-semibold text-foreground">
                6. 民眾預約及院所收費
              </h2>
              <p>
                民眾使用 Cross 搜尋院所及線上預約為免費服務。由院所收取的掛號費、
                診療費、療程費或訂金，請直接向收款院所申請退費。
              </p>
              <p className="mt-3">
                取消 Cross 預約，不會自動完成院所款項的退款。
              </p>
            </section>

            <section aria-labelledby="refund-rights">
              <h2 id="refund-rights" className="mb-2 text-lg font-semibold text-foreground">
                7. 法定權利與政策更新
              </h2>
              <p>
                本政策不限制依法享有的解除契約、退款或其他權利。行使法定權利，
                不以符合本政策的未使用條件、退款次數限制或申請資料齊備為前提。
              </p>
              <p className="mt-3">
                政策更新將公告於本頁；已成立的交易，依交易當時適用的政策、雙方約定及法令辦理。
              </p>
            </section>
          </CardContent>
        </Card>

        <nav aria-label="相關政策與方案" className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
          <Link href="/pricing" className="text-primary underline underline-offset-4">
            方案與定價
          </Link>
          <Link href="/terms" className="text-primary underline underline-offset-4">
            服務條款
          </Link>
          <Link href="/privacy" className="text-primary underline underline-offset-4">
            隱私權政策
          </Link>
        </nav>
      </main>

      <SiteFooter />
    </div>
  );
}

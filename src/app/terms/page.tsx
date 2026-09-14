import { PublicFrame } from "@/components/public/public-frame";
import { PageIntro } from "@/components/public/page-intro";
import Link from "next/link";

export default function TermsPage() {
  return (
    <PublicFrame>
      <PageIntro eyebrow="CROSS / 使用說明與政策" title="服務條款" />
      <div className="home-container py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">


        <div className="policy-body space-y-7 rounded-3xl border border-border bg-card p-6 text-base leading-8 text-muted-foreground sm:p-9">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              1. 服務說明
            </h2>
            <p>
              本系統提供線上預約服務，方便您預約診所的各項服務。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              2. 預約規則
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>請確實填寫正確的聯絡資訊</li>
              <li>如需取消或變更預約，請提前通知</li>
              <li>遲到超過 15 分鐘可能視為取消預約</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              3. 使用者責任
            </h2>
            <p>
              您同意提供真實、準確的個人資料，並對所提供資料的正確性負責。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              4. 服務變更
            </h2>
            <p>
              我們保留修改或中止服務的權利，並會盡可能提前通知。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              5. 免責聲明
            </h2>
            <p>
              本系統僅提供預約功能，實際服務內容以診所現場為準。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              6. 退款與訂閱取消
            </h2>
            <p>
              Cross 平台費用的退款申請與訂閱取消方式，請參閱
              <Link href="/refund" className="mx-1 text-primary underline underline-offset-4">
                退款政策
              </Link>
              。由院所收取的費用，請直接向收款院所申請退費。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              7. 條款修改
            </h2>
            <p>
              本條款可能不定期更新，繼續使用本服務即表示同意更新後的條款。
            </p>
          </section>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          最後更新日期：2026 年 9 月 11 日
        </p>
      </div>
      </div>
    </PublicFrame>
  );
}

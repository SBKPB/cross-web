import { PublicFrame } from "@/components/public/public-frame";
import { PageIntro } from "@/components/public/page-intro";
export default function PrivacyPage() {
  return (
    <PublicFrame>
      <PageIntro eyebrow="CROSS / 使用說明與政策" title="隱私權政策" />
      <div className="home-container py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">


        <div className="policy-body space-y-7 rounded-3xl border border-border bg-card p-6 text-base leading-8 text-muted-foreground sm:p-9">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              1. 資料蒐集
            </h2>
            <p>
              我們僅蒐集您主動提供的個人資料，包括姓名、性別、手機號碼等，
              用於預約服務及聯繫通知。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              2. 資料使用
            </h2>
            <p>您的個人資料僅用於以下目的：</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>處理及確認預約</li>
              <li>發送預約提醒通知</li>
              <li>提供客戶服務</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              3. 資料保護
            </h2>
            <p>
              我們採取適當的安全措施保護您的個人資料，防止未經授權的存取、
              使用或洩露。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              4. 資料分享
            </h2>
            <p>
              除法律規定或您的同意外，我們不會將您的個人資料提供給第三方。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              5. 您的權利
            </h2>
            <p>
              您有權查詢、更正或刪除您的個人資料，如有需要請聯繫我們。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              6. 政策更新
            </h2>
            <p>
              本政策可能不定期更新，更新後將於本頁面公告。
            </p>
          </section>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          最後更新日期：2026 年 2 月
        </p>
      </div>
      </div>
    </PublicFrame>
  );
}

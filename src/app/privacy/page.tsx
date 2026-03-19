export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="mb-6 text-2xl font-bold">隱私權政策</h1>

        <div className="space-y-6 rounded-lg bg-white p-6 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-900">
              1. 資料蒐集
            </h2>
            <p>
              我們僅蒐集您主動提供的個人資料，包括姓名、性別、手機號碼等，
              用於預約服務及聯繫通知。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-900">
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
            <h2 className="mb-2 text-base font-semibold text-slate-900">
              3. 資料保護
            </h2>
            <p>
              我們採取適當的安全措施保護您的個人資料，防止未經授權的存取、
              使用或洩露。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-900">
              4. 資料分享
            </h2>
            <p>
              除法律規定或您的同意外，我們不會將您的個人資料提供給第三方。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-900">
              5. 您的權利
            </h2>
            <p>
              您有權查詢、更正或刪除您的個人資料，如有需要請聯繫我們。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-900">
              6. 政策更新
            </h2>
            <p>
              本政策可能不定期更新，更新後將於本頁面公告。
            </p>
          </section>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          最後更新日期：2026 年 2 月
        </p>
      </div>
    </div>
  );
}

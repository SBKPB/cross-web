export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="mb-6 text-2xl font-bold">服務條款</h1>

        <div className="space-y-6 rounded-lg bg-white p-6 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-900">
              1. 服務說明
            </h2>
            <p>
              本系統提供線上預約服務，方便您預約診所的各項服務。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-900">
              2. 預約規則
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>請確實填寫正確的聯絡資訊</li>
              <li>如需取消或變更預約，請提前通知</li>
              <li>遲到超過 15 分鐘可能視為取消預約</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-900">
              3. 使用者責任
            </h2>
            <p>
              您同意提供真實、準確的個人資料，並對所提供資料的正確性負責。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-900">
              4. 服務變更
            </h2>
            <p>
              我們保留修改或中止服務的權利，並會盡可能提前通知。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-900">
              5. 免責聲明
            </h2>
            <p>
              本系統僅提供預約功能，實際服務內容以診所現場為準。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-900">
              6. 條款修改
            </h2>
            <p>
              本條款可能不定期更新，繼續使用本服務即表示同意更新後的條款。
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

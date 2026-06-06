import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Cross 上的店家分哪些類型？",
    a: "Cross 同時收錄健保看診、自費門診與美容諮詢三大類。每間店家頁面都會明確標示服務類型，你可以依需求篩選。",
  },
  {
    q: "使用 Cross 要付錢嗎？",
    a: "Cross 平台本身完全免費，不需註冊即可搜尋店家與查看資訊。看診或療程費用依各店家規定，與 Cross 無關。",
  },
  {
    q: "美容諮詢也可以預約嗎？",
    a: "可以。在 Hero 搜尋切換到「美容」tab 即可。美容預約通常是諮詢為主，實際療程與價格以店家現場評估為準。",
  },
  {
    q: "預約後想取消或改時間怎麼辦？",
    a: "進入「我的預約」頁面即可隨時取消或改時間，請盡量提前通知，避免佔用其他民眾的時段。",
  },
  {
    q: "我沒帳號也能預約嗎？",
    a: "可以。你可以用手機號碼快速預約，也可以選擇以 Google 帳號登入建立會員以便查看歷史記錄。",
  },
  {
    q: "如何知道醫師的看診或諮詢時間？",
    a: "每間診所的頁面都會顯示即時門診表與醫師班表。按「立即預約」後會看到可選時段。",
  },
];

export function FaqSection() {
  return (
    <section className="border-t border-border bg-muted/40 py-20">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold tracking-wide text-primary">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            常見問題
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            第一次用 Cross？這些問題先看一下
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5"
        >
          {FAQS.map((faq, i) => (
            <AccordionItem key={faq.q} value={`item-${i}`}>
              <AccordionTrigger className="px-6 text-left">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="px-6">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

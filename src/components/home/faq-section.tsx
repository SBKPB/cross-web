import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Cross 上的店家分哪些類型？",
    a: "Cross 收錄看診、醫美、美容、其他四大類服務。健保或自費屬於付款方式，不是分類，每間店家頁面都會同時標示服務類型與付款方式，你可以依需求篩選。",
  },
  {
    q: "使用 Cross 要付錢嗎？",
    a: "Cross 平台本身完全免費，不需註冊即可搜尋店家與查看資訊。看診或療程費用依各店家規定，與 Cross 無關。",
  },
  {
    q: "美容諮詢也可以預約嗎？",
    a: "在搜尋列切換到「美容」可查看目前合作店家。店家開通線上預約後即可選擇服務與時段；未找到店家時可調整地區，實際療程與費用以店家說明為準。",
  },
  {
    q: "預約後想取消或改時間怎麼辦？",
    a: "進入「我的預約」查看可取消的預約。如需改時間，請先取消原預約，再選擇新的時段重新預約；可約名額以當時顯示為準。",
  },
  {
    q: "我沒帳號也能預約嗎？",
    a: "不需登入即可搜尋店家、查看服務與可約時段。選好時段後，使用 Google 或 Apple 帳號登入，確認看診對象後送出預約。",
  },
  {
    q: "如何知道醫師的看診或諮詢時間？",
    a: "院所頁會依店家設定顯示班表。開通線上預約的店家可按「查看可約時段」，選擇服務與人員後查看日期及剩餘時段。",
  },
];

export function FaqSection() {
  return (
    // 背景改回 background：上一區的支撐細帶已是 bg-muted/40，
    // 兩區同底色會連成一塊分不出段落。
    <section className="bg-background py-20">
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

import { CalendarCheck, MousePointerClick, Search } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "搜尋",
    desc: "輸入科別或地區，找附近的診所與店家",
  },
  {
    icon: MousePointerClick,
    title: "挑選",
    desc: "比較評價、看診時段與醫師資訊",
  },
  {
    icon: CalendarCheck,
    title: "預約",
    desc: "一鍵完成掛號，出門前確認號碼",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-muted/40 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-14 text-center">
          <p className="text-sm font-semibold tracking-wide text-primary">
            預約流程
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            三步完成預約
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            簡單三步驟，不用再打電話排隊
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="group relative rounded-3xl bg-card p-7 shadow-sm ring-1 ring-foreground/5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="absolute right-6 top-6 text-4xl font-bold text-primary/10">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <step.icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

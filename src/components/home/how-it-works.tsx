import { CalendarCheck, MousePointerClick, Search } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "搜尋",
    desc: "輸入科別或地區，找附近的診所",
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
    <section className="bg-muted border-y border-border py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            三步完成預約
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            簡單三步驟，不用再打電話排隊
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative text-center">
              {/* 編號 */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white ring-1 ring-border/60 shadow-sm mb-4">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute top-0 right-1/2 translate-x-[54px] -translate-y-1 text-xs font-semibold text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-1.5">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px] mx-auto">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

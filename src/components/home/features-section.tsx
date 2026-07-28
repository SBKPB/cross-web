import { CalendarCheck, MapPin, ShieldCheck, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: MapPin,
    title: "一站找服務",
    // 細帶每格只有一行的高度，文案控制在單行內以免該格變高、整排參差
    desc: "看診、醫美、美容一次找",
  },
  {
    icon: CalendarCheck,
    title: "24 小時預約",
    desc: "不用等電話開放時間",
  },
  {
    icon: ShieldCheck,
    title: "預約管理",
    desc: "取消、改時間一鍵搞定",
  },
  {
    icon: Sparkles,
    title: "平台免費",
    desc: "看診費用依店家規定",
  },
];

/**
 * 支撐訊息細帶（原本是「Cross 有什麼不一樣」整區）。
 *
 * 改成帶狀的原因：首頁原本有三組視覺上完全同構的卡片區（分類 / 三步驟 / 特色）——
 * 一樣的 rounded-3xl、一樣的 size-12 圖示磚、一樣的 hover 位移，使用者滑到第三組
 * 就會判定「看過了」而略過。這區的內容是輔助說明而非主要內容，降成一條細帶後，
 * 卡片語彙就只保留給真正的內容（診所卡），階層才成立。
 *
 * 同批一併刪除「三步完成預約」：搜尋 → 挑選 → 預約是不證自明的流程，
 * 用三張整高卡片教這件事只是佔位。
 */
export function FeaturesSection() {
  return (
    <section className="border-y border-border bg-muted/40 py-12">
      <div className="container mx-auto px-4">
        <ul className="mx-auto grid max-w-5xl gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="size-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{f.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

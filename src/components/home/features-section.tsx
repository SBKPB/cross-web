import { CalendarCheck, MapPin, ShieldCheck, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: MapPin,
    title: "一站找服務",
    desc: "健保、自費、美容通通能搜，不用裝好幾個 App",
  },
  {
    icon: CalendarCheck,
    title: "24 小時預約",
    desc: "看診掛號、美容諮詢隨時都能約，不用等電話開放",
  },
  {
    icon: ShieldCheck,
    title: "預約管理",
    desc: "所有預約一目瞭然，取消改時間一鍵搞定",
  },
  {
    icon: Sparkles,
    title: "平台免費",
    desc: "Cross 使用免費，看診費用依診所規定",
  },
];

export function FeaturesSection() {
  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Cross 有什麼不一樣
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            把看診的大小事變簡單
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 bg-white border border-border transition-colors duration-200 hover:border-primary/50"
            >
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-foreground font-semibold mb-1.5">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

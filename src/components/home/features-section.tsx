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
        <div className="mb-14 text-center">
          <p className="text-sm font-semibold tracking-wide text-primary">
            為什麼選 Cross
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Cross 有什麼不一樣
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            把看診的大小事變簡單
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5 transition hover:-translate-y-1 hover:shadow-md hover:ring-primary/15"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

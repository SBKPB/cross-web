import Link from "next/link";
import {
  ArrowRight,
  Flower2,
  Sparkles,
  Stethoscope,
  Store,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { FacilityType } from "@/types/clinic";

// 4 大類分流卡（純服務軸；健保/自費屬付款方式，不在此分類）
const CATEGORIES: {
  type: FacilityType;
  title: string;
  desc: string;
  icon: LucideIcon;
  accent: string;
}[] = [
  {
    type: "healthcare",
    title: "看診",
    desc: "家醫、內科、皮膚科等各科別掛號（健保 / 自費）",
    icon: Stethoscope,
    accent: "bg-sky-100 text-sky-600",
  },
  {
    type: "aesthetic",
    title: "醫美",
    desc: "微整、雷射、電波等醫學美容",
    icon: Sparkles,
    accent: "bg-pink-100 text-pink-600",
  },
  {
    type: "beauty",
    title: "美容",
    desc: "美容、美甲、美睫、紋繡、SPA",
    icon: Flower2,
    accent: "bg-rose-100 text-rose-600",
  },
  {
    type: "other",
    title: "其他",
    desc: "傳統整復推拿等其他健康服務",
    icon: Store,
    accent: "bg-slate-100 text-slate-600",
  },
];

export function CategoryBrowse() {
  return (
    <section className="container mx-auto px-4 py-16 sm:py-20">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold tracking-wide text-primary">
          依需求選擇
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          想預約哪一種？
        </h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          看診、醫美、美容…依需求挑一個開始找
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Link
            key={c.type}
            href={`/search?type=${c.type}`}
            className="group rounded-3xl bg-card p-7 shadow-sm ring-1 ring-foreground/5 transition hover:-translate-y-1 hover:shadow-md hover:ring-primary/15"
          >
            <span
              className={cn(
                "inline-flex size-12 items-center justify-center rounded-2xl",
                c.accent,
              )}
            >
              <c.icon className="size-6" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-foreground">
              {c.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {c.desc}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              開始預約
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

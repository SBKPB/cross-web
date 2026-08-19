"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ANNUAL_PAID_MONTHS,
  PRICING_PLANS,
  annualSaving,
  annualTotal,
  formatTWD,
} from "@/lib/constants/pricing-constants";
import { cn } from "@/lib/utils";

type BillingCycle = "monthly" | "annual";

interface PricingTableProps {
  className?: string;
  /**
   * 覆寫所有方案的 CTA 連結。嵌入 /join 時傳 "#apply"，讓按鈕捲動到頁內表單；
   * 省略則使用各方案自帶的 href（/pricing 用，導向 /join）。
   */
  ctaHref?: string;
}

export function PricingTable({ className, ctaHref }: PricingTableProps) {
  // 預設年繳：多數院所選年繳，也讓「省 2 個月」第一眼就看到
  const [cycle, setCycle] = useState<BillingCycle>("annual");

  return (
    <div className={cn("mx-auto max-w-5xl", className)}>
      <BillingToggle cycle={cycle} onChange={setCycle} />

      <div className="grid gap-5 lg:grid-cols-3">
        {PRICING_PLANS.map((plan) => {
          const href = ctaHref ?? plan.cta.href;
          const isHash = href.startsWith("#");
          // 免費方案沒有 monthlyPrice，切到年繳時維持原樣
          const annual =
            cycle === "annual" && plan.monthlyPrice !== undefined
              ? {
                  total: annualTotal(plan.monthlyPrice),
                  saving: annualSaving(plan.monthlyPrice),
                }
              : null;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-3xl bg-card p-6 shadow-sm ring-1 transition",
                plan.highlighted
                  ? "ring-2 ring-primary lg:-translate-y-2 lg:shadow-xl"
                  : "ring-foreground/5 hover:shadow-md",
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              <p className="mt-1 min-h-10 text-sm leading-snug text-muted-foreground">
                {plan.description}
              </p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {annual ? formatTWD(annual.total) : plan.priceLabel}
                </span>
                {plan.pricePeriod && (
                  <span className="pb-1 text-sm text-muted-foreground">
                    {annual ? "/ 年" : plan.pricePeriod}
                  </span>
                )}
              </div>
              {/* 固定高度：切換月／年時卡片不跳動 */}
              <p className="mt-1.5 min-h-5 text-xs text-primary">
                {annual &&
                  `等於付 ${ANNUAL_PAID_MONTHS} 個月，省 ${formatTWD(annual.saving)}`}
              </p>

              <Button
                asChild
                className="mt-4 w-full"
                variant={plan.highlighted ? "default" : "outline"}
              >
                {isHash ? (
                  <a href={href}>{plan.cta.label}</a>
                ) : (
                  <Link href={href}>{plan.cta.label}</Link>
                )}
              </Button>

              <ul className="mt-6 space-y-3 border-t border-border pt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span className="text-sm leading-snug text-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BillingToggle({
  cycle,
  onChange,
}: {
  cycle: BillingCycle;
  onChange: (c: BillingCycle) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="付款週期"
      className="mx-auto mb-8 flex w-fit items-center gap-1 rounded-full bg-muted p-1"
    >
      {(["monthly", "annual"] as const).map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={cycle === c}
          onClick={() => onChange(c)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition",
            cycle === c
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {c === "monthly" ? "月繳" : "年繳"}
          {c === "annual" && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
              省 {12 - ANNUAL_PAID_MONTHS} 個月
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

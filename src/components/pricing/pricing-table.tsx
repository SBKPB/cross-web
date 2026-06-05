import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PRICING_PLANS } from "@/lib/constants/pricing-constants";
import { cn } from "@/lib/utils";

interface PricingTableProps {
  className?: string;
  /**
   * 覆寫所有方案的 CTA 連結。嵌入 /join 時傳 "#apply"，讓按鈕捲動到頁內表單；
   * 省略則使用各方案自帶的 href（/pricing 用，導向 /join）。
   */
  ctaHref?: string;
}

export function PricingTable({ className, ctaHref }: PricingTableProps) {
  return (
    <div className={cn("mx-auto grid max-w-5xl gap-5 lg:grid-cols-3", className)}>
      {PRICING_PLANS.map((plan) => {
        const href = ctaHref ?? plan.cta.href;
        const isHash = href.startsWith("#");
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
                {plan.priceLabel}
              </span>
              {plan.pricePeriod && (
                <span className="pb-1 text-sm text-muted-foreground">
                  {plan.pricePeriod}
                </span>
              )}
            </div>

            <Button
              asChild
              className="mt-5 w-full"
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
  );
}

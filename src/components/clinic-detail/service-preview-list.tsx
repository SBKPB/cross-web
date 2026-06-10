"use client";

import { Clock, Sparkles } from "lucide-react";

import { SectionCard } from "@/components/clinic-detail/section-card";
import { getServicePriceBadge } from "@/lib/service-price";
import type { PaymentType, Service } from "@/types/clinic";

interface ServicePreviewListProps {
  services: Service[];
  /** 院所付款方式（健保 / 自費 / 兩者）；0 元服務是否標「健保給付」依此 gating */
  paymentType?: PaymentType;
  className?: string;
}

export function ServicePreviewList({
  services,
  paymentType,
  className,
}: ServicePreviewListProps) {
  if (services.length === 0) return null;

  const grouped: Record<string, Service[]> = {};
  for (const service of services) {
    const category = service.category || "其他";
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(service);
  }

  return (
    <SectionCard icon={Sparkles} title="服務項目" className={className}>
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, categoryServices]) => (
          <div key={category}>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category}
            </h3>
            <div className="space-y-2">
              {categoryServices.map((service) => {
                // 價格 badge 統一規則（依 payment_type gating，三端一致）
                const priceBadge = getServicePriceBadge(service.price, paymentType);
                return (
                  <div
                    key={service.id}
                    className="flex items-start justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3 transition-colors hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{service.name}</p>
                      {service.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {service.description}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        <span>{service.duration_minutes} 分鐘</span>
                      </div>
                    </div>
                    {priceBadge &&
                      (priceBadge.kind === "price" ? (
                        <div className="shrink-0 rounded-xl bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground tabular-nums">
                          {priceBadge.label}
                        </div>
                      ) : (
                        <div className="shrink-0 rounded-xl bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                          {priceBadge.label}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

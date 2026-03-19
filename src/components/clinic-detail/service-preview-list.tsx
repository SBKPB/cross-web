"use client";

import { Clock, Sparkles } from "lucide-react";
import type { Service } from "@/types/clinic";
import { cn } from "@/lib/utils";

interface ServicePreviewListProps {
  services: Service[];
  className?: string;
}

export function ServicePreviewList({
  services,
  className,
}: ServicePreviewListProps) {
  if (services.length === 0) return null;

  // 依類別分組
  const grouped: Record<string, Service[]> = {};
  for (const service of services) {
    const category = service.category || "其他";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(service);
  }

  return (
    <div className={cn("px-4 sm:px-6", className)}>
      <div className="rounded-2xl border border-n-border bg-n-card p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-4 text-n-brand" />
          <h2 className="text-sm font-semibold text-n-heading">服務項目</h2>
        </div>

        <div className="space-y-5">
          {Object.entries(grouped).map(([category, categoryServices]) => (
            <div key={category}>
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-n-muted">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-n-border bg-n-section/50 px-3.5 py-3 transition-colors hover:bg-n-section"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-n-heading">
                        {service.name}
                      </p>
                      <p className="mt-0.5 text-xs text-n-secondary line-clamp-1">
                        {service.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-n-muted">
                        <Clock className="size-3" />
                        <span>{service.duration_minutes} 分鐘</span>
                      </div>
                    </div>
                    <div className="shrink-0 rounded-lg bg-n-brand-soft px-2.5 py-1 text-sm font-semibold text-n-brand">
                      NT$ {service.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

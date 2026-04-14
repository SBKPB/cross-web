"use client";

import { Clock, Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Service } from "@/types/clinic";

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
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(service);
  }

  return (
    <div className={cn("px-4 sm:px-6", className)}>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-primary" />
            服務項目
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-5">
            {Object.entries(grouped).map(([category, categoryServices]) => (
              <div key={category}>
                <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-start justify-between gap-3 rounded-3xl bg-muted/60 px-4 py-3 transition-colors hover:bg-muted"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {service.name}
                        </p>
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
                      <div className="shrink-0 rounded-2xl bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground">
                        NT$ {service.price.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

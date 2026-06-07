"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";

import type { ServiceOption } from "@/types/booking";

import { ServiceCard } from "./service-card";

interface ServiceListProps {
  services: ServiceOption[];
  selectedService: ServiceOption | null;
  onSelectService: (service: ServiceOption) => void;
  primaryColor?: string;
}

export function ServiceList({
  services,
  selectedService,
  onSelectService,
  primaryColor,
}: ServiceListProps) {
  const groupedServices = useMemo(() => {
    const groups: Record<string, ServiceOption[]> = {};
    for (const service of services) {
      const category = service.category || "其他";
      if (!groups[category]) groups[category] = [];
      groups[category].push(service);
    }
    return groups;
  }, [services]);

  const categories = Object.keys(groupedServices);

  if (services.length === 0) {
    return (
      <div className="px-4">
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-card p-10 text-center shadow-sm ring-1 ring-foreground/5">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Sparkles className="size-6" />
          </span>
          <p className="text-sm text-muted-foreground">
            目前尚無可預約的服務項目
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 px-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          選擇服務項目
        </h1>
        <p className="text-sm text-muted-foreground">
          請選擇您本次想預約的服務
        </p>
      </div>

      {categories.map((category) => (
        <div key={category} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {category}
          </h2>
          <div className="space-y-3">
            {groupedServices[category].map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedService?.id === service.id}
                onSelect={onSelectService}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

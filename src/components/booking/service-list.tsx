"use client";

import { useMemo } from "react";
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
  // 依據 category 分組
  const groupedServices = useMemo(() => {
    const groups: Record<string, ServiceOption[]> = {};
    for (const service of services) {
      const category = service.category || "其他";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(service);
    }
    return groups;
  }, [services]);

  const categories = Object.keys(groupedServices);

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category}>
          <h2 className="mb-3 px-4 text-sm font-medium text-slate-500">
            {category}
          </h2>
          <div className="space-y-3 px-4">
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

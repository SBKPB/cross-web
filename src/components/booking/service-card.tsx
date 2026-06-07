"use client";

import { Check, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ServiceOption } from "@/types/booking";

interface ServiceCardProps {
  service: ServiceOption;
  isSelected: boolean;
  onSelect: (service: ServiceOption) => void;
  primaryColor?: string;
}

export function ServiceCard({
  service,
  isSelected,
  onSelect,
  primaryColor = "#3b82f6",
}: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      className={cn(
        "group w-full rounded-3xl bg-card p-5 text-left transition-all",
        "shadow-sm ring-1 ring-foreground/5",
        "hover:-translate-y-0.5 hover:shadow-md",
        "active:translate-y-0",
        isSelected && "shadow-md",
      )}
      style={{
        boxShadow: isSelected
          ? `0 0 0 2px ${primaryColor}, 0 10px 15px -3px rgb(0 0 0 / 0.08)`
          : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">{service.name}</h3>
          {service.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {service.description}
            </p>
          )}
        </div>

        {/* Selection Indicator */}
        <div
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            isSelected ? "border-transparent text-white" : "border-border",
          )}
          style={{ backgroundColor: isSelected ? primaryColor : undefined }}
        >
          {isSelected && <Check className="size-3.5" strokeWidth={3} />}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" />
          <span>{service.duration_minutes} 分鐘</span>
        </div>

        <div className="rounded-xl bg-accent px-3 py-1.5 text-sm font-bold tabular-nums text-accent-foreground">
          NT$ {service.price.toLocaleString()}
        </div>
      </div>
    </button>
  );
}

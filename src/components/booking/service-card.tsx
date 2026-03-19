"use client";

import { Clock } from "lucide-react";
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
        "w-full rounded-xl border-2 bg-white p-4 text-left transition-all active:scale-[0.98]",
        isSelected ? "shadow-md" : "border-slate-200 hover:border-slate-300"
      )}
      style={{
        borderColor: isSelected ? primaryColor : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-slate-900">{service.name}</h3>
          <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">
            {service.description}
          </p>
        </div>

        {/* Selection Indicator */}
        <div
          className={cn(
            "size-5 shrink-0 rounded-full border-2 transition-colors",
            isSelected ? "border-current" : "border-slate-300"
          )}
          style={{ borderColor: isSelected ? primaryColor : undefined }}
        >
          {isSelected && (
            <div
              className="m-0.5 size-3 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-slate-500">
          <Clock className="size-3.5" />
          <span>{service.duration_minutes} 分鐘</span>
        </div>

        <div className="font-semibold" style={{ color: primaryColor }}>
          NT$ {service.price.toLocaleString()}
        </div>
      </div>
    </button>
  );
}

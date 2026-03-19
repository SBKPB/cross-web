import { MapPin, Phone, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  HOSPITAL_LEVELS,
  MEDICAL_DEPARTMENTS,
  API_MEDICAL_DEPARTMENTS,
} from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { Clinic } from "@/types/clinic";

interface ClinicCardProps {
  clinic: Clinic;
  className?: string;
  onClick?: () => void;
}

export function ClinicCard({ clinic, className, onClick }: ClinicCardProps) {
  const maxDisplayDepartments = 3;
  const displayDepartments = clinic.departments.slice(0, maxDisplayDepartments);
  const remainingCount = clinic.departments.length - maxDisplayDepartments;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden cursor-pointer",
        "bg-n-card border border-n-border",
        "shadow-sm",
        "transition-all duration-200 ease-out",
        "hover:shadow-md hover:border-n-border-focus hover:-translate-y-0.5",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5">
            <h3 className="font-semibold text-lg leading-tight text-n-heading">
              {clinic.clinic_name}
            </h3>
            <Badge
              variant="secondary"
              className="text-xs font-medium bg-n-brand-soft text-n-brand"
            >
              {HOSPITAL_LEVELS[clinic.hospital_level]}
            </Badge>
          </div>
          {clinic.rating && (
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium text-n-heading">{clinic.rating}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 科別標籤 */}
        <div className="flex flex-wrap gap-1.5">
          {displayDepartments.map((dept) => (
            <Badge
              key={dept}
              variant="outline"
              className="text-xs px-2 py-0.5 bg-n-accent-soft text-n-accent border-0"
            >
              {MEDICAL_DEPARTMENTS[dept as keyof typeof MEDICAL_DEPARTMENTS] ??
                API_MEDICAL_DEPARTMENTS[dept as keyof typeof API_MEDICAL_DEPARTMENTS] ??
                dept}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 bg-n-section text-n-secondary border-0"
            >
              +{remainingCount}
            </Badge>
          )}
        </div>

        {/* 聯絡資訊 */}
        <div className="space-y-2 text-sm text-n-body">
          {clinic.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-n-muted" />
              <span className="line-clamp-2">{clinic.address}</span>
            </div>
          )}
          {clinic.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-n-muted" />
              <span>{clinic.phone}</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Accent bottom line */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-n-brand to-n-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    </Card>
  );
}

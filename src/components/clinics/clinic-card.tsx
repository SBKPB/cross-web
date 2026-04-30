import { ArrowUpRight, MapPin, Phone, Sparkles, Star, Stethoscope, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  API_MEDICAL_DEPARTMENTS,
  FACILITY_TYPE_COLORS,
  FACILITY_TYPE_LABELS,
  HOSPITAL_LEVELS,
  MEDICAL_DEPARTMENTS,
} from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { Clinic, FacilityType } from "@/types/clinic";

const FACILITY_TYPE_ICONS: Record<FacilityType, typeof Stethoscope> = {
  healthcare: Stethoscope,
  self_pay: Wallet,
  aesthetic: Sparkles,
};

interface ClinicCardProps {
  clinic: Clinic;
  className?: string;
  onClick?: () => void;
}

export function ClinicCard({ clinic, className, onClick }: ClinicCardProps) {
  const maxDisplayDepartments = 3;
  const displayDepartments = clinic.departments.slice(0, maxDisplayDepartments);
  const remainingCount = clinic.departments.length - maxDisplayDepartments;

  const TypeIcon = clinic.facility_type
    ? FACILITY_TYPE_ICONS[clinic.facility_type]
    : null;

  // 美容 / 自費 不分醫療分級，僅健保（或舊資料）顯示
  const showHospitalLevel =
    !clinic.facility_type || clinic.facility_type === "healthcare";

  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative cursor-pointer transition-all duration-200 ease-out",
        "hover:-translate-y-1 hover:shadow-xl hover:ring-primary/20",
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            {/* 服務類型 / 醫療分級 badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {clinic.facility_type && TypeIcon && (
                <Badge
                  className={cn(
                    "gap-1 border-0",
                    FACILITY_TYPE_COLORS[clinic.facility_type],
                  )}
                >
                  <TypeIcon />
                  {FACILITY_TYPE_LABELS[clinic.facility_type]}
                </Badge>
              )}
              {showHospitalLevel && (
                <Badge variant="secondary" className="bg-accent text-accent-foreground">
                  {HOSPITAL_LEVELS[clinic.hospital_level]}
                </Badge>
              )}
            </div>

            {/* 診所名稱 */}
            <CardTitle className="text-lg leading-tight">
              {clinic.clinic_name}
            </CardTitle>

            {/* 評分（改放描述位置，而不是右上角） */}
            {clinic.rating !== undefined && clinic.rating !== null && (
              <CardDescription className="flex items-center gap-1.5 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium text-foreground">
                  {clinic.rating.toFixed(1)}
                </span>
                {clinic.review_count && (
                  <span className="text-xs text-muted-foreground">
                    · {clinic.review_count} 則評論
                  </span>
                )}
              </CardDescription>
            )}
          </div>

          {/* Hover 時出現的箭頭（Luma 風格微互動） */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground opacity-0 transition-opacity group-hover/card:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 科別標籤（只在健保 / 舊資料顯示，美容、自費不分科） */}
        {showHospitalLevel && displayDepartments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displayDepartments.map((dept) => (
              <Badge key={dept} variant="outline" className="text-muted-foreground">
                {MEDICAL_DEPARTMENTS[dept as keyof typeof MEDICAL_DEPARTMENTS] ??
                  API_MEDICAL_DEPARTMENTS[dept as keyof typeof API_MEDICAL_DEPARTMENTS] ??
                  dept}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="outline" className="text-muted-foreground">
                +{remainingCount}
              </Badge>
            )}
          </div>
        )}

        {/* 聯絡資訊 */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {clinic.address && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="line-clamp-2">{clinic.address}</span>
            </div>
          )}
          {clinic.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{clinic.phone}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

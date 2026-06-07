"use client";

import {
  ArrowUpRight,
  Crown,
  Flower2,
  MapPin,
  Phone,
  Sparkles,
  Star,
  Stethoscope,
  Store,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { categoryLabel } from "@/lib/api/service-categories";
import { useServiceTaxonomy } from "@/lib/hooks/use-service-taxonomy";
import {
  FACILITY_TYPE_COLORS,
  FACILITY_TYPE_LABELS,
  HOSPITAL_LEVELS,
  PAYMENT_TYPES,
} from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { Clinic, FacilityType } from "@/types/clinic";

const FACILITY_TYPE_ICONS: Record<FacilityType, typeof Stethoscope> = {
  healthcare: Stethoscope,
  aesthetic: Sparkles,
  beauty: Flower2,
  other: Store,
};

interface ClinicCardProps {
  clinic: Clinic;
  className?: string;
  onClick?: () => void;
}

export function ClinicCard({ clinic, className, onClick }: ClinicCardProps) {
  const tax = useServiceTaxonomy();

  const maxDisplayDepartments = 3;
  const displayDepartments = clinic.departments.slice(0, maxDisplayDepartments);
  const remainingCount = clinic.departments.length - maxDisplayDepartments;

  const TypeIcon = clinic.facility_type
    ? FACILITY_TYPE_ICONS[clinic.facility_type]
    : null;

  // 醫療分級僅在健保（或舊資料無 facility_type）顯示，其餘大類不分級
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
              {/* 精選置頂（付費曝光）：金色 badge 置於最前，視覺優先 */}
              {clinic.is_featured && (
                <Badge className="gap-1 border-0 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 shadow-sm">
                  <Crown className="size-3.5" />
                  精選
                </Badge>
              )}
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
              {/* 付款方式（健保 / 自費 / 健保+自費），取代舊 self_pay 大類語意 */}
              {clinic.payment_type && (
                <Badge variant="outline" className="text-muted-foreground">
                  {PAYMENT_TYPES[clinic.payment_type]}
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
              <CardDescription className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300">
                  <Star className="size-3.5 fill-current" />
                  <span className="text-xs font-semibold">
                    {clinic.rating.toFixed(1)}
                  </span>
                </span>
                {clinic.review_count && (
                  <span className="text-xs text-muted-foreground">
                    {clinic.review_count} 則評論
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
        {/* 服務子類別標籤（看診 / 醫美 / 美容 / 其他皆顯示，label 取自 taxonomy） */}
        {displayDepartments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displayDepartments.map((dept) => (
              <Badge key={dept} variant="outline" className="text-muted-foreground">
                {categoryLabel(tax, dept)}
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

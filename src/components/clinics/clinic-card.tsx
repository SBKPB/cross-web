"use client";

import {
  Clock,
  Crown,
  Flower2,
  MapPin,
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
import { FavoriteButton } from "@/components/clinics/favorite-button";
import { categoryLabel } from "@/lib/api/service-categories";
import { useServiceTaxonomy } from "@/lib/hooks/use-service-taxonomy";
import {
  FACILITY_TYPE_COLORS,
  FACILITY_TYPE_LABELS,
  HOSPITAL_LEVELS,
  PAYMENT_TYPES,
  parseAreaFromAddress,
} from "@/lib/constants/clinic-constants";
import { cn } from "@/lib/utils";
import type { Clinic, FacilityType } from "@/types/clinic";

const WEEKDAY_ZH: Record<string, string> = {
  Sun: "週日",
  Mon: "週一",
  Tue: "週二",
  Wed: "週三",
  Thu: "週四",
  Fri: "週五",
  Sat: "週六",
};

// 一律以台北時區判定今天星期幾。若直接用 new Date().getDay()，SSR 在 UTC、
// 瀏覽器在 Asia/Taipei，跨日時段會算出不同答案而造成 hydration 不符。
function taipeiWeekday(): string {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    weekday: "short",
  }).format(new Date());
  return WEEKDAY_ZH[short] ?? short;
}

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

  // 「縣市 行政區」；完整地址留給詳情頁
  const area = parseAreaFromAddress(clinic.address) ?? clinic.city;

  // 今日營業時間。business_hours 只收錄有營業的日子，查不到即今日休息。
  // 註：這不等於「最近可預約時段」—— 後端列表端點目前不提供可約時段，
  // 要做需新增依診所查 availability 的端點。
  const today = clinic.business_hours?.find((h) => h.day === taipeiWeekday());
  const todayHours = clinic.business_hours?.length
    ? today && !today.is_closed
      ? `今日 ${today.open}–${today.close}`
      : "今日休息"
    : undefined;

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

          {/* 右上角只留收藏愛心。原本的 hover 箭頭已移除：卡片本身已用
              cursor-pointer + hover 位移 + 陰影表達可點，箭頭是第四種重複訊號，
              且 opacity-0 時仍佔 40px 寬度，會壓縮診所名稱。 */}
          <FavoriteButton
            clinicId={clinic.id}
            nextPath={`/clinic/${clinic.id}`}
            className="shrink-0"
          />
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

        {/* 決策資訊：在哪裡、今天開不開。
            完整地址與電話留到詳情頁 —— 卡片階段使用者只需要判斷「近不近、今天能不能去」，
            而在一個主打「不用再打電話」的平台上，把電話放在卡片最顯眼的底部是矛盾的。 */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {area && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{area}</span>
            </div>
          )}
          {todayHours && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{todayHours}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

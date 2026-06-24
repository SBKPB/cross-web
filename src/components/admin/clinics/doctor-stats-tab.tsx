"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Hourglass, Loader2, Lock, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { canAccessFeature, canStartTrial } from "@/lib/feature-access";
import { cn } from "@/lib/utils";
import type { DoctorDuration, MedicalFacility } from "@/types/clinic";

const RANGES = [
  { label: "近 7 天", value: 7 },
  { label: "近 30 天", value: 30 },
  { label: "近 90 天", value: 90 },
] as const;

interface DoctorStatsTabProps {
  facilityId: string;
  facility: MedicalFacility;
}

export function DoctorStatsTab({ facilityId, facility }: DoctorStatsTabProps) {
  const accessible = canAccessFeature(facility, "advanced_queue");

  const [range, setRange] = useState(30);
  const [doctors, setDoctors] = useState<DoctorDuration[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminClinicsApi.doctorDurations(facilityId, { range });
      setDoctors(data.doctors);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch doctor durations:", err);
      setError("無法載入看診統計，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, range]);

  useEffect(() => {
    if (!accessible) return;
    void fetchStats();
  }, [accessible, fetchStats]);

  // 方案不足 → 升級提示（照叫號台 / 客戶分析 gated 模式）
  if (!accessible) {
    return <UpgradeWall canTrial={canStartTrial(facility)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <Button
            key={r.value}
            variant={range === r.value ? "default" : "outline"}
            size="sm"
            onClick={() => setRange(r.value)}
            className="h-8 text-xs"
          >
            {r.label}
          </Button>
        ))}
        <p className="ml-auto text-xs text-muted-foreground">
          看診時長 = 看診中→完成；等待時間 = 報到→看診
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      ) : !doctors || doctors.length === 0 ? (
        <AdminEmptyState
          icon={Clock}
          title="尚無看診統計資料"
          description="在叫號台完成「報到 → 叫號 → 完成看診」後，這裡會顯示每位醫師的平均看診時長與等待時間"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d) => (
            <DoctorCard key={d.staff_id ?? "none"} doctor={d} />
          ))}
        </div>
      )}
    </div>
  );
}

/** 單一醫師看診統計卡：平均看診時長 + 平均等待時間（沿用客戶分析 StatCard 視覺語言） */
function DoctorCard({ doctor }: { doctor: DoctorDuration }) {
  const lowConsult = doctor.consult_count < 3;
  return (
    <Card className="space-y-4 rounded-3xl p-5 ring-1 ring-foreground/5">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Stethoscope className="size-4" />
        </span>
        <span className="truncate">{doctor.staff_name ?? "不指定醫師"}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric
          icon={Clock}
          label="平均看診"
          minutes={doctor.avg_consult_minutes}
        />
        <Metric
          icon={Hourglass}
          label="平均等待"
          minutes={doctor.avg_wait_minutes}
        />
      </div>

      <p
        className={cn(
          "text-xs",
          lowConsult ? "text-amber-600" : "text-muted-foreground",
        )}
      >
        {lowConsult
          ? `看診樣本不足（${doctor.consult_count} 筆），僅供參考`
          : `看診 ${doctor.consult_count} 筆 · 等待 ${doctor.wait_count} 筆`}
      </p>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  minutes,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  minutes: number | null;
}) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">
        {minutes ?? "—"}
        <span className="ml-1 text-sm font-medium text-muted-foreground">
          分
        </span>
      </p>
    </div>
  );
}

/** 方案不足升級牆（進階叫號為 PRO 專屬） */
function UpgradeWall({ canTrial }: { canTrial: boolean }) {
  return (
    <Card className="flex flex-col items-center gap-4 p-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Lock className="size-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          看診統計為「專業方案」功能
        </h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          升級至專業方案即可查看每位醫師的平均看診時長，並一併解鎖候診室大螢幕看板與民眾端「預估等候時間」。
        </p>
      </div>
      {canTrial ? (
        <p className="text-sm text-primary">
          你的院所還沒用過試用 —— 可從上方橫幅「一鍵試用 90 天」立即解鎖全部功能。
        </p>
      ) : (
        <Button asChild>
          <Link href="/pricing">查看方案</Link>
        </Button>
      )}
    </Card>
  );
}

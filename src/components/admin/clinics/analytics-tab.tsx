"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  Eye,
  Loader2,
  Lock,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PLAN_LABELS,
  canAccessFeature,
  canStartTrial,
} from "@/lib/feature-access";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import type { FacilityAnalytics, VisitorCount } from "@/types/clinic";
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/clinic";

/**
 * 這個元件只需要訂閱相關欄位，不需要完整院所物件——
 * 院所帳號傳 FacilitySummary、系統管理員傳 MedicalFacility，兩者都符合。
 */
type SubscriptionLike = {
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  trial_used_at: string | null;
};

const RANGES = [
  { days: 7, granularity: "day" as const, label: "近 7 天" },
  { days: 30, granularity: "day" as const, label: "近 30 天" },
  { days: 90, granularity: "week" as const, label: "近 90 天" },
];

const METHOD_LABELS: Record<string, string> = {
  phone: "電話",
  walk_in: "現場",
  online: "線上",
};

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

interface FacilityAnalyticsViewProps {
  facilityId: string;
  /** 用來判斷該院所方案是否已開通客戶分析 */
  facility: SubscriptionLike | null | undefined;
  /**
   * facility＝院所自己看（未開通時顯示升級牆，含一鍵試用引導）
   * admin＝系統管理員逐間查看（未開通時只中性說明，不對自己人推銷）
   */
  variant: "facility" | "admin";
}

/**
 * 客戶分析的呈現層，`/admin/analytics`（院所帳號）與診所詳情頁的
 * 「客戶分析」分頁（系統管理員）共用同一份實作。
 *
 * 造訪人數／訪客人數對所有方案開放；完整分析依該院所方案 gating——
 * 系統管理員也一樣，因為後端 require_feature 是看院所的方案而非看人。
 */
export function FacilityAnalyticsView({
  facilityId,
  facility,
  variant,
}: FacilityAnalyticsViewProps) {
  const [rangeIdx, setRangeIdx] = useState(1); // 預設近 30 天
  const [data, setData] = useState<FacilityAnalytics | null>(null);
  const [visitor, setVisitor] = useState<VisitorCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const accessible = canAccessFeature(facility, "analytics");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = RANGES[rangeIdx];
      // 訪客／造訪人數：所有方案皆可看（不掛付費 gating）
      setVisitor(await adminClinicsApi.visitorCount(facilityId, { range: r.days }));
      // 完整分析：僅開通者抓（free / standard 打了會 403）
      setData(
        accessible
          ? await adminClinicsApi.analytics(facilityId, {
              range: r.days,
              granularity: r.granularity,
            })
          : null,
      );
    } catch {
      setError("載入分析資料失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }, [facilityId, accessible, rangeIdx]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {RANGES.map((r, i) => (
          <Button
            key={r.days}
            size="sm"
            variant={i === rangeIdx ? "default" : "outline"}
            onClick={() => setRangeIdx(i)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> 載入中…
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-sm text-destructive">{error}</Card>
      ) : (
        <>
          {visitor && <VisitorCard data={visitor} variant={variant} />}
          {accessible && data ? (
            <AnalyticsContent data={data} />
          ) : variant === "admin" ? (
            <PlanLockedNote facility={facility} />
          ) : (
            <UpgradeWall canTrial={canStartTrial(facility)} />
          )}
        </>
      )}
    </div>
  );
}

/** 系統管理員視角：只說明為什麼沒有完整分析，不推銷 */
function PlanLockedNote({ facility }: { facility: SubscriptionLike | null | undefined }) {
  const plan = facility ? PLAN_LABELS[facility.subscription_plan] : "—";
  return (
    <Card className="flex flex-col items-center gap-2 p-8 text-center">
      <Lock className="size-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        此院所目前為「{plan}」方案，未開通完整客戶分析。
      </p>
      <p className="text-xs text-muted-foreground">
        上方造訪與訪客人數對所有方案開放，不受影響。
      </p>
    </Card>
  );
}

function VisitorCard({
  data,
  variant,
}: {
  data: VisitorCount;
  variant: "facility" | "admin";
}) {
  // 刻意不算「轉換率」：分子（有預約的病患）涵蓋電話、現場、App 全管道且依
  // 看診日開窗，分母（造訪）只涵蓋 web 且依造訪日開窗——兩個母體不相交，
  // 相除常態超過 100%（造訪表是新的、從 0 開始累積，預約卻有歷史資料）。
  // 真要做轉換率得改成「同區間內經 web 建立的線上預約 / 造訪」，是另一個功能。
  return (
    <Card className="grid gap-6 p-6 sm:grid-cols-2">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="size-4" />
          造訪人數
        </div>
        <div className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {data.page_view_count}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          近 {data.range_days} 天看過{variant === "admin" ? "該院所" : "你"}
          診所頁的人（同一 IP 同一天只算一次；僅涵蓋網頁，App 不計入）
        </p>
      </div>
      <div className="sm:border-l sm:border-border sm:pl-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" />
          訪客人數
        </div>
        <div className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {data.visitor_count}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          近 {data.range_days} 天不重複到訪病患（{data.start_date} ~ {data.end_date}）
        </p>
      </div>
    </Card>
  );
}

function UpgradeWall({ canTrial }: { canTrial: boolean }) {
  return (
    <Card className="flex flex-col items-center gap-4 p-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Lock className="size-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          完整客戶分析為「專業方案」功能
        </h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          升級至專業方案即可查看預約量趨勢、未到診率、預約管道佔比與回診率，
          用數據優化營運。
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

function AnalyticsContent({ data }: { data: FacilityAnalytics }) {
  const trendMax = Math.max(1, ...data.trend.map((t) => t.count));
  const methodMax = Math.max(1, ...data.by_method.map((m) => m.count));
  const hourMax = Math.max(1, ...data.by_hour.map((h) => h.count));

  return (
    <>
      {/* 數字卡 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="總預約" value={data.total} />
        <StatCard icon={CheckCircle2} label="已完成" value={data.completed} />
        <StatCard icon={XCircle} label="已取消" value={data.cancelled} />
        <StatCard icon={XCircle} label="未到診" value={data.no_show} />
      </div>

      {/* 比率 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RateCard
          icon={TrendingUp}
          label="未到診率"
          rate={data.no_show_rate}
          hint={`${data.no_show} 次未到診 / 已結案預約`}
          tone={data.no_show_rate > 0.15 ? "danger" : "ok"}
        />
        <RateCard
          icon={UserCheck}
          label="回診率"
          rate={data.repeat_patient_rate}
          hint={`${data.unique_patients} 位不重複病患中，≥2 次預約的比例`}
          tone="ok"
        />
      </div>

      {/* 預約量趨勢 */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">預約量趨勢</h3>
        {data.trend.length === 0 ? (
          <p className="text-sm text-muted-foreground">此區間尚無預約資料。</p>
        ) : (
          <div className="flex h-44 items-end gap-1.5 overflow-x-auto">
            {data.trend.map((t) => (
              <div
                key={t.period}
                className="flex min-w-6 flex-1 flex-col items-center gap-1"
                title={`${t.period}：${t.count} 筆`}
              >
                <span className="text-xs text-muted-foreground">{t.count}</span>
                <div
                  className="w-full rounded-t bg-primary/80 transition-all"
                  style={{ height: `${(t.count / trendMax) * 100}%` }}
                />
                <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                  {t.period.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 尖峰時段 */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">尖峰時段</h3>
        {data.by_hour.length === 0 ? (
          <p className="text-sm text-muted-foreground">此區間尚無預約資料。</p>
        ) : (
          <div className="flex h-44 items-end gap-1.5 overflow-x-auto">
            {data.by_hour.map((h) => (
              <div
                key={h.hour}
                className="flex min-w-7 flex-1 flex-col items-center gap-1"
                title={`${h.hour}:00 ~ ${h.hour}:59：${h.count} 筆`}
              >
                <span className="text-xs text-muted-foreground tabular-nums">
                  {h.count}
                </span>
                <div
                  className={`w-full rounded-t transition-all ${
                    h.count === hourMax ? "bg-primary" : "bg-primary/50"
                  }`}
                  style={{ height: `${(h.count / hourMax) * 100}%` }}
                />
                <span className="w-full text-center text-[10px] text-muted-foreground tabular-nums">
                  {String(h.hour).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          依預約時段統計；最高的時段（深色）即為尖峰。
        </p>
      </Card>

      {/* 預約管道佔比 */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">預約管道佔比</h3>
        {data.by_method.length === 0 ? (
          <p className="text-sm text-muted-foreground">此區間尚無預約資料。</p>
        ) : (
          <div className="space-y-3">
            {data.by_method.map((m) => (
              <div key={m.method} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    {METHOD_LABELS[m.method] ?? m.method}
                  </span>
                  <span className="text-muted-foreground">
                    {m.count} 筆（{data.total ? ((m.count / data.total) * 100).toFixed(0) : 0}%）
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(m.count / methodMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>
    </Card>
  );
}

function RateCard({
  icon: Icon,
  label,
  rate,
  hint,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  rate: number;
  hint: string;
  tone: "ok" | "danger";
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="size-4" />
          {label}
        </div>
        <span
          className={
            tone === "danger"
              ? "text-2xl font-bold text-destructive"
              : "text-2xl font-bold text-foreground"
          }
        >
          {pct(rate)}
        </span>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={
            tone === "danger"
              ? "h-full rounded-full bg-destructive"
              : "h-full rounded-full bg-primary"
          }
          style={{ width: `${Math.min(100, rate * 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

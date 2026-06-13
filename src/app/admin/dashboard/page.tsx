"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  Sparkles,
  Users,
  UserX,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { useAuth } from "@/lib/auth/auth-context";
import { isFacilityUser, isSystemAdmin } from "@/lib/auth/roles";
import {
  PLAN_LABELS,
  canAccessFeature,
  canStartTrial,
  daysUntilExpiry,
  isTrialActive,
} from "@/lib/feature-access";
import type { FacilitySummary } from "@/types/auth";
import { FACILITY_TYPE_LABELS } from "@/lib/constants/clinic-constants";
import { QUEUE_ACTIVE_STATUSES } from "@/lib/constants/appointment";
import { cn } from "@/lib/utils";
import type {
  ApiAppointment,
  AppointmentStatus,
  FacilityType,
  MedicalFacility,
  SubscriptionStatus,
} from "@/types/clinic";

// ===== 對照表 =====
const SUB_STATUS: Record<SubscriptionStatus, { label: string; dot: string }> = {
  trial: { label: "試用中", dot: "bg-amber-500" },
  active: { label: "啟用", dot: "bg-green-500" },
  suspended: { label: "已暫停", dot: "bg-red-500" },
  cancelled: { label: "已取消", dot: "bg-slate-400" },
};

const APPT_STATUS: Record<AppointmentStatus, { label: string; cls: string }> = {
  confirmed: { label: "已預約", cls: "bg-blue-100 text-blue-700" },
  checked_in: { label: "已報到", cls: "bg-teal-100 text-teal-700" },
  in_progress: { label: "看診中", cls: "bg-indigo-100 text-indigo-700" },
  completed: { label: "已完成", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "已取消", cls: "bg-slate-100 text-slate-600" },
  no_show: { label: "未到診", cls: "bg-red-100 text-red-700" },
};

// ===== 日期工具 =====
function ymd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ===== 共用元件 =====
function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="group rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/15">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-2xl transition group-hover:scale-105",
            tone === "warning"
              ? "bg-amber-100 text-amber-600"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-5" />
        </span>
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-4 text-4xl font-bold tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="size-7 animate-spin text-primary" />
    </div>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <div className="rounded-3xl bg-destructive/10 p-6 text-sm text-destructive ring-1 ring-destructive/20">
      {message}
    </div>
  );
}

function PageHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground before:size-2 before:shrink-0 before:rounded-full before:bg-primary before:content-['']">
        {title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

// ===== 系統管理員 Dashboard =====
function SystemDashboard() {
  const [facilities, setFacilities] = useState<MedicalFacility[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminClinicsApi
      .list()
      .then(setFacilities)
      .catch(() => setError("載入院所資料失敗，請稍後再試"));
  }, []);

  if (error) return <DashboardError message={error} />;
  if (!facilities) return <DashboardLoading />;

  const now = new Date();
  const in7 = addDays(now, 7);

  const total = facilities.length;
  const activeCount = facilities.filter((f) => f.is_active).length;
  const subActive = facilities.filter(
    (f) => f.subscription_status === "active",
  ).length;
  const expiringSoon = facilities.filter((f) => {
    if (!f.subscription_expires_at) return false;
    if (f.subscription_status !== "active" && f.subscription_status !== "trial")
      return false;
    const exp = new Date(f.subscription_expires_at);
    return exp >= now && exp <= in7;
  }).length;

  const statusCounts: Record<SubscriptionStatus, number> = {
    trial: 0,
    active: 0,
    suspended: 0,
    cancelled: 0,
  };
  facilities.forEach((f) => {
    statusCounts[f.subscription_status] += 1;
  });

  const typeCounts: Record<FacilityType, number> = {
    healthcare: 0,
    aesthetic: 0,
    beauty: 0,
    other: 0,
  };
  facilities.forEach((f) => {
    if (f.facility_type) typeCounts[f.facility_type] += 1;
  });

  const recent = [...facilities]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeading title="總覽" desc="全平台院所與訂閱概況" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="總院所數" value={total} />
        <StatCard icon={CheckCircle2} label="啟用中院所" value={activeCount} />
        <StatCard icon={CreditCard} label="訂閱啟用中" value={subActive} />
        <StatCard
          icon={AlertTriangle}
          label="7 天內到期"
          value={expiringSoon}
          tone="warning"
          hint="試用 / 啟用即將到期"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 訂閱狀態分布 */}
        <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5">
          <h2 className="font-semibold text-foreground">訂閱狀態分布</h2>
          <div className="mt-5 space-y-4">
            {(Object.keys(SUB_STATUS) as SubscriptionStatus[]).map((s) => {
              const count = statusCounts[s];
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <div key={s}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className={cn("size-2.5 rounded-full", SUB_STATUS[s].dot)}
                      />
                      {SUB_STATUS[s].label}
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        SUB_STATUS[s].dot,
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 服務類型分布 */}
        <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5">
          <h2 className="font-semibold text-foreground">服務類型分布</h2>
          <div className="mt-5 space-y-4">
            {(Object.keys(typeCounts) as FacilityType[]).map((t) => {
              const count = typeCounts[t];
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <div key={t}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {FACILITY_TYPE_LABELS[t]}
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/80 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 最近加入院所 */}
      <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">最近加入院所</h2>
          <Button asChild variant="ghost" size="sm" className="text-primary">
            <Link href="/admin/clinics">
              查看全部
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            尚無院所
          </p>
        ) : (
          <div className="space-y-2">
            {recent.map((f) => (
              <Link
                key={f.id}
                href={`/admin/clinics/${f.id}`}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 ring-1 ring-foreground/5 transition hover:bg-muted/40 hover:ring-primary/15"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  {f.name.charAt(0)}
                </span>
                <span className="truncate font-medium text-foreground">
                  {f.name}
                </span>
                {f.facility_type && (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {FACILITY_TYPE_LABELS[f.facility_type]}
                  </span>
                )}
                <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      SUB_STATUS[f.subscription_status].dot,
                    )}
                  />
                  {SUB_STATUS[f.subscription_status].label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 院所 Dashboard =====
interface FacilityData {
  today: ApiAppointment[];
  upcoming: ApiAppointment[];
  recent: ApiAppointment[];
  staffCount: number;
  serviceCount: number;
}

function FacilityDashboard({ facilityId }: { facilityId: string }) {
  const [data, setData] = useState<FacilityData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    const today = ymd(now);
    const in7 = ymd(addDays(now, 7));
    const ago30 = ymd(addDays(now, -30));

    Promise.allSettled([
      adminClinicsApi.appointments.list(facilityId, { date: today }),
      adminClinicsApi.appointments.list(facilityId, {
        start_date: today,
        end_date: in7,
      }),
      adminClinicsApi.appointments.list(facilityId, {
        start_date: ago30,
        end_date: today,
      }),
      adminClinicsApi.staff.list(facilityId),
      adminClinicsApi.services.list(facilityId),
    ]).then((res) => {
      if (cancelled) return;
      if (res.every((r) => r.status === "rejected")) {
        setError("載入院所資料失敗，請稍後再試");
        return;
      }
      const val = <T,>(i: number, fallback: T): T =>
        res[i].status === "fulfilled"
          ? (res[i] as PromiseFulfilledResult<T>).value
          : fallback;
      setData({
        today: val<ApiAppointment[]>(0, []),
        upcoming: val<ApiAppointment[]>(1, []),
        recent: val<ApiAppointment[]>(2, []),
        staffCount: val<{ is_active: boolean }[]>(3, []).filter(
          (s) => s.is_active,
        ).length,
        serviceCount: val<unknown[]>(4, []).length,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [facilityId]);

  if (error) return <DashboardError message={error} />;
  if (!data) return <DashboardLoading />;

  // 含已報到/看診中：今日預約被報到、叫號後仍是待就診量，不該從計數消失
  const upcomingActive = data.upcoming.filter((a) =>
    QUEUE_ACTIVE_STATUSES.includes(a.status),
  ).length;
  const noShow30 = data.recent.filter((a) => a.status === "no_show").length;
  const todaySorted = [...data.today].sort((a, b) =>
    a.appointment_time < b.appointment_time ? -1 : 1,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeading title="總覽" desc="今日預約與近期營運概況" />
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/clinics/${facilityId}`}>
            管理院所
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <PlanCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CalendarDays}
          label="今日預約"
          value={data.today.length}
        />
        <StatCard
          icon={CalendarClock}
          label="未來 7 天預約"
          value={upcomingActive}
          hint="待就診"
        />
        <StatCard
          icon={UserX}
          label="近 30 天未到診"
          value={noShow30}
          tone="warning"
        />
        <StatCard
          icon={Users}
          label="服務人員"
          value={data.staffCount}
          hint={`服務項目 ${data.serviceCount} 項`}
        />
      </div>

      {/* 今日預約 */}
      <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5">
        <h2 className="mb-4 font-semibold text-foreground">今日預約</h2>
        {todaySorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            今天沒有預約
          </p>
        ) : (
          <div className="space-y-2">
            {todaySorted.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 ring-1 ring-foreground/5"
              >
                <span className="w-12 shrink-0 text-sm font-semibold text-foreground tabular-nums">
                  {a.appointment_time?.slice(0, 5)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {a.patient_name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[a.service_name, a.staff_name].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                    APPT_STATUS[a.status].cls,
                  )}
                >
                  {APPT_STATUS[a.status].label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 院所「當前方案」卡片：方案 + 試用倒數 + 解鎖功能入口
function PlanCard() {
  const { user } = useAuth();
  const facility: FacilitySummary | null = user?.facility ?? null;
  if (!facility) return null;

  const planLabel = PLAN_LABELS[facility.subscription_plan];
  const trialing = isTrialActive(facility); // 僅「未過期的試用」才算試用中
  const trialDaysLeft = trialing
    ? daysUntilExpiry(facility.subscription_expires_at)
    : null;
  const hasAnalytics = canAccessFeature(facility, "analytics");
  const showTrialHint = canStartTrial(facility);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">目前方案</p>
          <p className="font-semibold text-foreground">
            {planLabel}
            {trialing && trialDaysLeft !== null && (
              <span className="ml-2 text-sm font-normal text-primary">
                試用中 · 還剩 {trialDaysLeft} 天
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {hasAnalytics ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/analytics">
              <BarChart3 className="size-4" />
              客戶分析
            </Link>
          </Button>
        ) : showTrialHint ? (
          <span className="text-sm text-muted-foreground">
            可由上方橫幅一鍵試用 90 天
          </span>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href="/pricing">查看方案</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <DashboardLoading />;
  if (isSystemAdmin(user)) return <SystemDashboard />;
  if (isFacilityUser(user) && user?.facility_id)
    return <FacilityDashboard facilityId={user.facility_id} />;
  return null;
}

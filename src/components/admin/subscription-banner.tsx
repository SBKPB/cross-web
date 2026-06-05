"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { isFacilityUser } from "@/lib/auth/roles";
import { canStartTrial, daysUntilExpiry, isExpired } from "@/lib/feature-access";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import { TRIAL_DAYS } from "@/lib/constants/pricing-constants";
import { cn } from "@/lib/utils";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")}`;
}

/**
 * 訂閱狀態 banner（facility user 登入時，依 user.facility 訂閱狀態顯示）
 *
 * 分支優先序：
 * - suspended / cancelled            → 紅：已暫停/取消
 * - status=trial 且未過期             → 藍：免費試用還剩 N 天（含升級 CTA）
 * - active 但 expires < now           → 紅：已過期（cron 未跑到的 fallback）
 * - plan=free 且未用過試用            → 藍：一鍵試用 90 天 CTA
 * - plan=free 且已用過試用            → 藍：升級提示（導 /pricing）
 * - active 且 7 天內到期              → 黃：即將到期
 * - 其他                             → 不顯示
 */
export function SubscriptionBanner() {
  const { user, refreshUser } = useAuth();

  if (!isFacilityUser(user) || !user?.facility) return null;

  const facility = user.facility;
  const { subscription_status, subscription_expires_at, name } = facility;
  const daysLeft = daysUntilExpiry(subscription_expires_at);
  const expired = isExpired(subscription_expires_at);

  // 已暫停 / 已取消
  if (subscription_status === "suspended" || subscription_status === "cancelled") {
    return (
      <Banner variant="destructive" icon={AlertTriangle}>
        <span className="font-semibold">{name}</span> 的訂閱
        {subscription_status === "suspended" ? "已暫停" : "已取消"}
        ，部分付費功能無法使用。請聯絡系統管理員恢復訂閱。
      </Banner>
    );
  }

  // 試用中（未過期）
  if (subscription_status === "trial" && !expired) {
    return (
      <Banner variant="info" icon={Sparkles}>
        <span className="font-semibold">{name}</span> 正在免費試用中，
        {daysLeft !== null ? `還剩 ${daysLeft} 天` : ""}
        （{formatDate(subscription_expires_at)} 到期），可使用全部付費功能。
        <UpgradeLink label="了解付費方案" />
      </Banner>
    );
  }

  // 試用 / 付費已過期（cron 尚未降級前的常態，含過期試用）
  if (
    expired &&
    (subscription_status === "active" || subscription_status === "trial")
  ) {
    return (
      <Banner variant="destructive" icon={AlertTriangle}>
        <span className="font-semibold">{name}</span> 的
        {subscription_status === "trial" ? "免費試用" : "訂閱"}已於{" "}
        {formatDate(subscription_expires_at)} 到期，付費功能已停用。
        <UpgradeLink label="重新升級" />
      </Banner>
    );
  }

  // 免費方案：可一鍵試用 → CTA；已用過試用 → 升級提示
  if (facility.subscription_plan === "free") {
    if (canStartTrial(facility)) {
      return (
        <Banner variant="info" icon={Sparkles}>
          <span className="font-semibold">{name}</span> 目前為免費方案，
          開通線上預約、預約提醒、客戶分析等付費功能 ——
          <StartTrialButton onDone={refreshUser} />
        </Banner>
      );
    }
    return (
      <Banner variant="info" icon={Sparkles}>
        <span className="font-semibold">{name}</span> 目前為免費方案。
        升級即可開通線上預約、預約提醒與客戶分析。
        <UpgradeLink label="查看方案" />
      </Banner>
    );
  }

  // 付費方案 7 天內到期
  if (
    subscription_status === "active" &&
    daysLeft !== null &&
    daysLeft >= 0 &&
    daysLeft <= 7
  ) {
    return (
      <Banner variant="warning" icon={Clock}>
        <span className="font-semibold">{name}</span> 的訂閱將於 {daysLeft} 天後（
        {formatDate(subscription_expires_at)}）到期。
        <Link
          href="/admin/subscription"
          className="ml-1 underline underline-offset-2 hover:no-underline"
        >
          查看詳情
        </Link>
      </Banner>
    );
  }

  return null;
}

function StartTrialButton({ onDone }: { onDone: () => Promise<void> }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const facilityId = user?.facility?.id;
  if (!facilityId) return null;

  const handleClick = async () => {
    setBusy(true);
    setError(null);
    try {
      await adminClinicsApi.startTrial(facilityId);
      await onDone(); // 重新抓 /me 讓 banner 與 gating 立即更新
    } catch {
      setError("開通失敗，請稍後再試或聯絡客服");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="ml-1 inline-flex items-center gap-2">
      <Button size="sm" className="h-7" disabled={busy} onClick={handleClick}>
        {busy ? (
          <Loader2 className="mr-1 size-3.5 animate-spin" />
        ) : (
          <Sparkles className="mr-1 size-3.5" />
        )}
        一鍵試用 {TRIAL_DAYS} 天
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  );
}

function UpgradeLink({ label }: { label: string }) {
  return (
    <Link
      href="/pricing"
      className="ml-1 underline underline-offset-2 hover:no-underline"
    >
      {label}
    </Link>
  );
}

interface BannerProps {
  variant: "warning" | "destructive" | "info";
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function Banner({ variant, icon: Icon, children }: BannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 border-b px-4 py-2.5 text-sm md:px-6",
        variant === "warning" &&
          "border-yellow-500/30 bg-yellow-500/10 text-yellow-900 dark:text-yellow-100",
        variant === "destructive" &&
          "border-destructive/30 bg-destructive/10 text-destructive",
        variant === "info" &&
          "border-primary/20 bg-primary/5 text-foreground",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

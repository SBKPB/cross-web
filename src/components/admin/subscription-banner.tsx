"use client";

import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { isFacilityUser } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

function getDaysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")}`;
}

/**
 * 訂閱警示 banner
 *
 * 顯示時機：facility user（facility_admin / facility_staff）登入時，
 * 根據 user.facility 訂閱狀態自動顯示對應狀態 banner。
 *
 * 狀態對照：
 * - suspended / cancelled         → 紅色：已暫停
 * - active 但 expires < now       → 紅色：已過期（理論上 cron 會更新成 suspended，這裡是 fallback）
 * - active 且 7 天內到期            → 黃色：即將到期
 * - 其他                           → 不顯示
 */
export function SubscriptionBanner() {
  const { user } = useAuth();

  if (!isFacilityUser(user) || !user?.facility) return null;

  const { subscription_status, subscription_expires_at, name } = user.facility;
  const daysLeft = getDaysUntil(subscription_expires_at);

  // 已暫停 / 已取消
  if (subscription_status === "suspended" || subscription_status === "cancelled") {
    return (
      <Banner variant="destructive" icon={AlertTriangle}>
        <span className="font-semibold">{name}</span> 的訂閱
        {subscription_status === "suspended" ? "已暫停" : "已取消"}
        ，部分功能無法使用。請聯絡系統管理員恢復訂閱。
      </Banner>
    );
  }

  // 仍是 active 但實際已過期（cron 還沒跑到）
  if (
    subscription_status === "active" &&
    daysLeft !== null &&
    daysLeft < 0
  ) {
    return (
      <Banner variant="destructive" icon={AlertTriangle}>
        <span className="font-semibold">{name}</span> 的訂閱已於{" "}
        {formatDate(subscription_expires_at)} 到期，請盡快聯絡系統管理員續訂。
        <SubscriptionLink />
      </Banner>
    );
  }

  // 7 天內到期
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
        <SubscriptionLink />
      </Banner>
    );
  }

  return null;
}

interface BannerProps {
  variant: "warning" | "destructive";
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
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

function SubscriptionLink() {
  return (
    <Link
      href="/admin/subscription"
      className="ml-1 underline underline-offset-2 hover:no-underline"
    >
      查看詳情
    </Link>
  );
}

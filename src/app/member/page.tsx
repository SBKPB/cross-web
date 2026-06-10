"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Clock,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { useRequireMember } from "@/lib/auth/use-require-member";
import { memberApi } from "@/lib/api/member";
import {
  memberAppointmentApi,
  type MemberAppointment,
} from "@/lib/api/member-appointment";
import { memberPatientApi } from "@/lib/api/member-patient";
import { RecentlyViewedRail } from "@/components/member/recently-viewed-rail";
import { ThemeToggle } from "@/components/theme-toggle";

const STATUS_LABEL: Record<string, string> = {
  confirmed: "已預約",
  completed: "已完成",
  cancelled: "已取消",
  no_show: "未到診",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "outline",
};

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function formatMonthDay(d: string) {
  const dt = new Date(d + "T00:00:00");
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}

function formatWeekday(d: string) {
  const dt = new Date(d + "T00:00:00");
  return `週${WEEKDAYS[dt.getDay()]}`;
}

function formatTime(t: string) {
  return t.substring(0, 5);
}

function formatMemberSince(iso: string) {
  const dt = new Date(iso);
  return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "U";
  // 中文取末一字（姓名習慣），英文/email 取首字母
  if (/[一-龥]/.test(trimmed)) return trimmed.slice(-1);
  return trimmed.slice(0, 1).toUpperCase();
}

export default function MemberPage() {
  const { user, logout } = useAuth();
  // 守衛：未登入導向登入頁，後台帳號（管理員 / 院所）導回後台，不渲染民眾端內容
  const { ready } = useRequireMember("/member");
  const [appointments, setAppointments] = useState<MemberAppointment[]>([]);
  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [appts, patients] = await Promise.all([
        memberAppointmentApi.list(),
        memberPatientApi.list().catch(() => []),
      ]);
      setAppointments(appts);
      setPatientCount(patients.length);
    } catch (err) {
      console.error("Failed to load member data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    fetchData();
  }, [ready, fetchData]);

  const { all, confirmed, completed, cancelled } = useMemo(() => {
    const byDateDesc = (a: MemberAppointment, b: MemberAppointment) =>
      b.appointment_date.localeCompare(a.appointment_date);
    const byDateAsc = (a: MemberAppointment, b: MemberAppointment) =>
      a.appointment_date.localeCompare(b.appointment_date);
    return {
      all: [...appointments].sort(byDateDesc),
      // 已預約（即將看診）依日期由近到遠，方便最快就診的排最前
      confirmed: appointments
        .filter((a) => a.status === "confirmed")
        .sort(byDateAsc),
      completed: appointments
        .filter((a) => a.status === "completed")
        .sort(byDateDesc),
      // 已取消含未到診（皆屬「未完成就診」的歷史）
      cancelled: appointments
        .filter((a) => a.status === "cancelled" || a.status === "no_show")
        .sort(byDateDesc),
    };
  }, [appointments]);

  // 確認刪除帳號：成功後沿用登出邏輯清除登入狀態並導回首頁
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteAccountError("");
    try {
      await memberApi.deleteAccount();
      setDeleteDialogOpen(false);
      logout("/");
    } catch (err) {
      console.error("Failed to delete account:", err);
      setDeleteAccountError("刪除失敗，請稍後再試");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  const displayName = user?.display_name || user?.email?.split("@")[0] || "會員";

  return (
    <div className="min-h-screen bg-muted/40 pb-12">
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
        {/* Profile 卡 */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-blue-700 p-6 text-primary-foreground">
          {/* 裝飾光暈 */}
          <div className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex items-start gap-4">
            <Avatar className="size-16 shrink-0 ring-2 ring-white/40">
              <AvatarFallback className="bg-white/20 text-xl font-semibold text-white backdrop-blur">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 pt-1">
              <h1 className="truncate text-xl font-bold">{displayName}</h1>
              <div className="mt-1.5 space-y-1 text-sm text-white/80">
                {user?.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="size-3.5 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
                {user?.phone_number && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-3.5 shrink-0" />
                    <span>{user.phone_number}</span>
                  </div>
                )}
              </div>
              {user?.created_at && (
                <p className="mt-1.5 text-xs text-white/60">
                  會員自 {formatMemberSince(user.created_at)}
                </p>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-white/80 hover:bg-white/15 hover:text-white"
              onClick={() => logout("/")}
              title="登出"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>

        {/* 統計卡 */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Clock className="size-4" />}
            label="即將看診"
            value={isLoading ? null : confirmed.length}
          />
          <StatCard
            icon={<CalendarCheck2 className="size-4" />}
            label="已完成"
            value={isLoading ? null : completed.length}
          />
          <StatCard
            icon={<Users className="size-4" />}
            label="看診對象"
            value={isLoading ? null : (patientCount ?? 0)}
          />
        </div>

        {/* 快捷功能 */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ActionCard
            href="/"
            icon={<CalendarPlus className="size-5" />}
            title="預約看診"
            desc="搜尋診所，線上掛號"
            accent
          />
          <ActionCard
            href="/member/patients"
            icon={<Users className="size-5" />}
            title="看診對象管理"
            desc="管理家人與本人資料"
          />
          <ActionCard
            href="/member/favorites"
            icon={<Heart className="size-5" />}
            title="我的收藏"
            desc="收藏的診所一覽"
          />
        </div>

        {/* 外觀設定（主題切換：亮 / 暗 / 跟隨系統） */}
        <Card className="flex flex-row items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="font-medium text-foreground">外觀主題</div>
            <div className="text-xs text-muted-foreground">
              切換亮色、暗色或跟隨系統
            </div>
          </div>
          <ThemeToggle className="shrink-0" />
        </Card>

        {/* 最近瀏覽 */}
        <RecentlyViewedRail ready={ready} />

        {/* 預約紀錄 */}
        <div>
          <h2 className="mb-3 text-base font-semibold text-foreground">
            預約紀錄
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              <AppointmentSkeleton />
              <AppointmentSkeleton />
            </div>
          ) : (
            <Tabs defaultValue="confirmed">
              <TabsList className="w-full">
                <TabsTrigger value="all">
                  全部
                  {all.length > 0 && (
                    <span className="ml-1 text-xs opacity-70">
                      ({all.length})
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="confirmed">
                  已預約
                  {confirmed.length > 0 && (
                    <span className="ml-1 text-xs opacity-70">
                      ({confirmed.length})
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed">
                  已完成
                  {completed.length > 0 && (
                    <span className="ml-1 text-xs opacity-70">
                      ({completed.length})
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="cancelled">
                  已取消
                  {cancelled.length > 0 && (
                    <span className="ml-1 text-xs opacity-70">
                      ({cancelled.length})
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <AppointmentGroup
                  items={all}
                  emptyText="尚無預約紀錄"
                  showEmptyCta
                />
              </TabsContent>
              <TabsContent value="confirmed" className="mt-4">
                <AppointmentGroup
                  items={confirmed}
                  emptyText="目前沒有即將到來的預約"
                  showEmptyCta
                  highlight
                />
              </TabsContent>
              <TabsContent value="completed" className="mt-4">
                <AppointmentGroup items={completed} emptyText="尚無已完成的預約" />
              </TabsContent>
              <TabsContent value="cancelled" className="mt-4">
                <AppointmentGroup items={cancelled} emptyText="尚無已取消的預約" />
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* 帳號（危險操作） */}
        <Card className="flex flex-row items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="font-medium text-foreground">刪除帳號</div>
            <div className="text-xs text-muted-foreground">
              永久刪除會員資料、看診人與預約紀錄
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="shrink-0"
            onClick={() => {
              setDeleteAccountError("");
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="size-4" />
            刪除帳號
          </Button>
        </Card>
      </div>

      {/* 刪除帳號確認 */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(o) => {
          if (!isDeletingAccount) setDeleteDialogOpen(o);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除帳號嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              將永久刪除您的會員資料、所有看診人與預約紀錄，此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteAccountError && (
            <p className="text-sm text-destructive">{deleteAccountError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>
              取消
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? "刪除中..." : "刪除帳號"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------- 子元件 ---------- */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
}) {
  return (
    <Card className="flex flex-col items-center gap-1 p-3 text-center shadow-sm">
      <span className="text-primary">{icon}</span>
      {value === null ? (
        <Skeleton className="h-6 w-6" />
      ) : (
        <span className="text-2xl font-bold text-foreground tabular-nums">
          {value}
        </span>
      )}
      <span className="text-xs text-muted-foreground">{label}</span>
    </Card>
  );
}

function ActionCard({
  href,
  icon,
  title,
  desc,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="group flex flex-row items-center gap-3 p-4 text-left transition-colors hover:bg-accent/40 hover:ring-primary/30">
        <span
          className={
            accent
              ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
              : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"
          }
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-foreground">{title}</div>
          <div className="truncate text-xs text-muted-foreground">{desc}</div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Card>
    </Link>
  );
}

/** 依分頁渲染一組預約卡片，空時顯示空狀態 */
function AppointmentGroup({
  items,
  emptyText,
  showEmptyCta,
  highlight,
}: {
  items: MemberAppointment[];
  emptyText: string;
  showEmptyCta?: boolean;
  highlight?: boolean;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays className="size-10" />}
        text={emptyText}
        action={
          showEmptyCta ? (
            <Button asChild size="sm">
              <Link href="/">立即預約</Link>
            </Button>
          ) : undefined
        }
      />
    );
  }
  return (
    <div className="space-y-3">
      {items.map((appt) => (
        <AppointmentCard
          key={appt.id}
          appt={appt}
          highlight={highlight && appt.status === "confirmed"}
        />
      ))}
    </div>
  );
}

function AppointmentCard({
  appt,
  highlight,
}: {
  appt: MemberAppointment;
  highlight?: boolean;
}) {
  return (
    <Link href={`/member/appointments/${appt.id}`} className="block">
      <Card className="group overflow-hidden p-0 transition-shadow hover:shadow-md">
        <div className="flex items-stretch">
          {/* 日期區塊 */}
          <div
            className={
              highlight
                ? "flex w-20 shrink-0 flex-col items-center justify-center bg-primary py-4 text-primary-foreground"
                : "flex w-20 shrink-0 flex-col items-center justify-center bg-muted py-4 text-muted-foreground"
            }
          >
            <div className="text-lg leading-none font-bold">
              {formatMonthDay(appt.appointment_date)}
            </div>
            <div className="mt-1 text-[11px] opacity-80">
              {formatWeekday(appt.appointment_date)}
            </div>
            <div className="mt-1.5 flex items-center gap-0.5 text-xs font-medium">
              <Clock className="size-3" />
              {formatTime(appt.appointment_time)}
            </div>
          </div>

          {/* 內容 */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{appt.facility_name}</span>
              </div>
              <Badge variant={STATUS_VARIANT[appt.status]} className="shrink-0">
                {STATUS_LABEL[appt.status]}
              </Badge>
            </div>
            {appt.staff_name && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Stethoscope className="size-3.5 shrink-0" />
                {appt.staff_name}
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                預約編號 {appt.booking_number}
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function AppointmentSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-stretch">
        <Skeleton className="h-[88px] w-20 rounded-none" />
        <div className="flex flex-1 flex-col justify-center gap-2 p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </Card>
  );
}

function EmptyState({
  icon,
  text,
  action,
}: {
  icon: React.ReactNode;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <span className="text-muted-foreground">{icon}</span>
      <p className="text-sm text-muted-foreground">{text}</p>
      {action}
    </Card>
  );
}

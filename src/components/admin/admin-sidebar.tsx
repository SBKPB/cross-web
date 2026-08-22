"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getAdminHomePath,
  isFacilityUser,
  isSystemAdmin,
} from "@/lib/auth/roles";
import type { User } from "@/types/auth";
import { ChangePasswordDialog } from "@/components/admin/change-password-dialog";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const SYSTEM_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "總覽", icon: LayoutDashboard },
  { href: "/admin/clinics", label: "院所管理", icon: Building2 },
  { href: "/admin/applications", label: "夥伴申請", icon: ClipboardCheck },
  { href: "/admin/users", label: "使用者管理", icon: UserCog },
  { href: "/admin/settings", label: "系統設定", icon: Settings },
];

function getNavItems(user: User | null): NavItem[] {
  if (isSystemAdmin(user)) return SYSTEM_NAV;
  if (isFacilityUser(user) && user?.facility_id) {
    return [
      {
        href: "/admin/dashboard",
        label: "總覽",
        icon: LayoutDashboard,
      },
      {
        href: `/admin/clinics/${user.facility_id}`,
        label: "我的院所",
        icon: Building2,
      },
      {
        href: "/admin/analytics",
        label: "客戶分析",
        icon: BarChart3,
      },
      {
        href: "/admin/subscription",
        label: "我的訂閱",
        icon: CreditCard,
      },
    ];
  }
  return [];
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

interface AdminSidebarContentProps {
  onNavigate?: () => void;
}

export function AdminSidebarContent({ onNavigate }: AdminSidebarContentProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const navItems = getNavItems(user);
  const homePath = getAdminHomePath(user);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const displayName =
    user?.display_name || user?.email?.split("@")[0] || "使用者";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-full w-full min-w-0 flex-col bg-sidebar text-sidebar-foreground">
      <Link
        href={homePath}
        onClick={onNavigate}
        className="flex h-16 items-center gap-2.5 border-b border-sidebar-border/60 px-5 font-semibold"
      >
        <Image
          src="/cross-icon.png"
          alt="Cross"
          width={34}
          height={34}
          className="size-9 rounded-xl ring-1 ring-primary/10"
        />
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">Cross</span>
          <span className="text-[11px] font-medium text-sidebar-foreground/45">
            院所管理後台
          </span>
        </span>
      </Link>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          選單
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-sm ring-1 ring-primary/10 before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-primary before:content-['']"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition",
                  active
                    ? "text-primary"
                    : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80",
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-sidebar-border/60 p-3">
        <div className="flex items-center gap-2.5 px-1">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {displayName}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/50">
              {user?.email ?? "—"}
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setPasswordDialogOpen(true)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-sidebar-foreground/70 ring-1 ring-sidebar-border/70 transition hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <KeyRound className="size-3.5" />
            修改密碼
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              logout("/admin/login");
            }}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 ring-1 ring-sidebar-border/70 transition hover:bg-destructive/10 hover:text-destructive"
            aria-label="登出"
            title="登出"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </div>
  );
}

export function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-hidden border-r border-sidebar-border/60 md:flex">
      <AdminSidebarContent />
    </aside>
  );
}

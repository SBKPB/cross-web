"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  KeyRound,
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
  { href: "/admin/clinics", label: "院所管理", icon: Building2 },
  { href: "/admin/users", label: "使用者管理", icon: UserCog },
  { href: "/admin/settings", label: "系統設定", icon: Settings },
];

function getNavItems(user: User | null): NavItem[] {
  if (isSystemAdmin(user)) return SYSTEM_NAV;
  if (isFacilityUser(user) && user?.facility_id) {
    return [
      {
        href: `/admin/clinics/${user.facility_id}`,
        label: "我的院所",
        icon: Building2,
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

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <Link
        href={homePath}
        onClick={onNavigate}
        className="flex h-14 items-center gap-2.5 border-b border-sidebar-border/60 px-5 font-semibold"
      >
        <Image
          src="/cross-icon.png"
          alt="Cross"
          width={32}
          height={32}
          className="size-8 rounded-xl"
        />
        <span className="text-sm tracking-tight">Cross Console</span>
      </Link>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-sidebar-border/60 p-3">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-sidebar-foreground/60">
              登入中
            </p>
            <p className="truncate text-sm text-sidebar-foreground">
              {user?.email ?? "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPasswordDialogOpen(true)}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 transition hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            aria-label="修改密碼"
            title="修改密碼"
          >
            <KeyRound className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              logout("/admin/login");
            }}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 transition hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
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
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-sidebar-border/60 md:flex">
      <AdminSidebarContent />
    </aside>
  );
}

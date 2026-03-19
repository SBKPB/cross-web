"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LogOut, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

const BREADCRUMB_MAP: Record<string, string> = {
  "/admin/clinics": "院所管理",
  "/admin/users": "使用者管理",
  "/admin/settings": "系統設定",
};

export function AdminHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // 根據路徑產生麵包屑
  const breadcrumbs = buildBreadcrumbs(pathname);

  return (
    <header className="border-b border-slate-200/50 bg-white/80 backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-900/80">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Left: Logo + Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/admin"
            className="flex items-center gap-2 font-semibold text-slate-900 hover:text-blue-600 dark:text-slate-100"
          >
            <div className="rounded-lg bg-blue-500/10 p-1.5 dark:bg-blue-500/20">
              <Building2 className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            Console
          </Link>

          {breadcrumbs.map((crumb) => (
            <span key={crumb.href} className="flex items-center gap-2">
              <ChevronRight className="size-3.5 text-slate-300 dark:text-slate-600" />
              {crumb.isLast ? (
                <span className="text-slate-600 dark:text-slate-400">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-slate-600 hover:text-blue-600 dark:text-slate-400"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </div>

        {/* Right: User + Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 text-sm text-slate-600 sm:flex dark:text-slate-400">
            <User className="size-3.5" />
            <span>{user?.email}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="size-4" />
            <span className="ml-1 hidden sm:inline">登出</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

interface Breadcrumb {
  label: string;
  href: string;
  isLast: boolean;
}

function buildBreadcrumbs(pathname: string): Breadcrumb[] {
  // Dashboard 首頁不需要麵包屑
  if (pathname === "/admin") return [];

  const crumbs: Breadcrumb[] = [];

  // 檢查是否匹配已知的父路徑
  for (const [path, label] of Object.entries(BREADCRUMB_MAP)) {
    if (pathname.startsWith(path)) {
      const isExactMatch = pathname === path;
      crumbs.push({
        label,
        href: path,
        isLast: isExactMatch,
      });

      // 如果是子頁面（如 /admin/clinics/[id]），加上「詳細」
      if (!isExactMatch) {
        crumbs.push({
          label: "詳細",
          href: pathname,
          isLast: true,
        });
      }
      break;
    }
  }

  return crumbs;
}

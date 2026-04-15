"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getAdminHomePath,
  isFacilityUser,
  isSystemAdmin,
} from "@/lib/auth/roles";
import type { User } from "@/types/auth";

const SYSTEM_BREADCRUMB_MAP: Record<string, string> = {
  "/admin/clinics": "院所管理",
  "/admin/users": "使用者管理",
  "/admin/settings": "系統設定",
};

interface Breadcrumb {
  label: string;
  href: string;
  isLast: boolean;
}

function buildBreadcrumbs(pathname: string, user: User | null): Breadcrumb[] {
  // Facility user 不顯示路徑層級（只看單一院所）
  if (isFacilityUser(user)) return [];

  // System admin 才有 module-level breadcrumb
  if (!isSystemAdmin(user)) return [];

  const crumbs: Breadcrumb[] = [];
  for (const [path, label] of Object.entries(SYSTEM_BREADCRUMB_MAP)) {
    if (pathname.startsWith(path)) {
      const isExactMatch = pathname === path;
      crumbs.push({ label, href: path, isLast: isExactMatch });
      if (!isExactMatch) {
        crumbs.push({ label: "詳細", href: pathname, isLast: true });
      }
      break;
    }
  }
  return crumbs;
}

interface AdminTopbarProps {
  onOpenMobileNav: () => void;
}

export function AdminTopbar({ onOpenMobileNav }: AdminTopbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const breadcrumbs = buildBreadcrumbs(pathname, user);
  const homePath = getAdminHomePath(user);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMobileNav}
        aria-label="開啟選單"
      >
        <Menu className="size-5" />
      </Button>

      <nav className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <Link
          href={homePath}
          className="shrink-0 text-muted-foreground transition hover:text-foreground"
        >
          Console
        </Link>
        {breadcrumbs.map((crumb) => (
          <span
            key={crumb.href}
            className="flex min-w-0 items-center gap-2"
          >
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40" />
            {crumb.isLast ? (
              <span className="truncate text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="truncate text-muted-foreground transition hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </header>
  );
}

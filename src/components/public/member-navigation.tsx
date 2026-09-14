"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/member", label: "我的預約", icon: CalendarDays },
  { href: "/member/favorites", label: "收藏店家", icon: Heart },
  { href: "/member/patients", label: "預約對象", icon: Users },
];

export function MemberNavigation() {
  const pathname = usePathname();
  return (
    <div className="border-b border-border/60 bg-[#eff4fa] dark:bg-[#142238]">
      <div className="home-container py-6 sm:py-8">
        <p className="home-eyebrow">MY CROSS / 你的健康日常</p>
        <nav aria-label="會員功能" className="mt-4 flex gap-1 sm:gap-3">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === "/member" ? pathname === href || pathname.startsWith("/member/appointments/") : pathname === href;
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors sm:px-5", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-card hover:text-primary")}><Icon className="hidden size-4 min-[370px]:block" />{label}</Link>;
          })}
        </nav>
      </div>
    </div>
  );
}

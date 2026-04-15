"use client";

import { useState, type ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { SubscriptionBanner } from "@/components/admin/subscription-banner";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <SubscriptionBanner />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
      <AdminMobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
    </div>
  );
}

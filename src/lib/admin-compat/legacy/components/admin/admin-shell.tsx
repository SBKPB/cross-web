import { useState, type ReactNode } from "react";
import { AdminSidebar } from "$lib/admin-compat/legacy/components/admin/admin-sidebar";
import { AdminTopbar } from "$lib/admin-compat/legacy/components/admin/admin-topbar";
import { AdminMobileNav } from "$lib/admin-compat/legacy/components/admin/admin-mobile-nav";
import { SubscriptionBanner } from "$lib/admin-compat/legacy/components/admin/subscription-banner";

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
        <main className="admin-canvas flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
      <AdminMobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
    </div>
  );
}

"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AdminSidebarContent } from "@/components/admin/admin-sidebar";

interface AdminMobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminMobileNav({ open, onOpenChange }: AdminMobileNavProps) {
  const handleNavigate = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-64 p-0"
        showCloseButton={false}
      >
        <SheetTitle className="sr-only">後台導覽</SheetTitle>
        <AdminSidebarContent onNavigate={handleNavigate} />
      </SheetContent>
    </Sheet>
  );
}

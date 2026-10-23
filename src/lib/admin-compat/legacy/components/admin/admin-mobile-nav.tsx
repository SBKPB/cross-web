import { Sheet, SheetContent, SheetTitle } from "#lib/admin-compat/legacy/components/ui/sheet.tsx";
import { AdminSidebarContent } from "#lib/admin-compat/legacy/components/admin/admin-sidebar.tsx";

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

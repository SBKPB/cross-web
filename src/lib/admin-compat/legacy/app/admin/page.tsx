import { useEffect } from "react";
import { useRouter } from "#lib/admin-compat/navigation.ts";
import { useAuth } from "#lib/admin-compat/auth.ts";
import { getAdminHomePath } from "#lib/auth/roles.ts";

export default function AdminIndexPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;
    router.replace(getAdminHomePath(user));
  }, [user, isLoading, isAuthenticated, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}

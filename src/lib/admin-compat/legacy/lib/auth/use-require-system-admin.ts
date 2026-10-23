import { useEffect } from "react";
import { useRouter } from "#lib/admin-compat/navigation.ts";
import { useAuth } from "#lib/admin-compat/auth.ts";
import { getAdminHomePath, isSystemAdmin } from "#lib/auth/roles.ts";

export function useRequireSystemAdmin() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;
    if (!isSystemAdmin(user)) {
      router.replace(getAdminHomePath(user));
    }
  }, [user, isLoading, isAuthenticated, router]);
}

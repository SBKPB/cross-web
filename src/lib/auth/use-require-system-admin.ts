"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { getAdminHomePath, isSystemAdmin } from "@/lib/auth/roles";

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

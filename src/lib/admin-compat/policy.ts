import { canAccessAdmin, isSystemAdmin } from '../auth/roles.ts';
import type { User } from '../types/auth.ts';

const systemPages = new Set(['clinics', 'users', 'applications', 'settings']);
type Access = { state: 'allow' | 'loading' } | { state: 'redirect'; href: string };

/** 在掛載後台頁面及發出其請求之前先判斷權限；API 仍由後端獨立驗證。 */
export function adminAccess(name: string, user: User | null, loading: boolean, facilityId?: string): Access {
  if (name === 'login') return { state: 'allow' };
  if (loading) return { state: 'loading' };
  if (!user) return { state: 'redirect', href: '/admin/login' };
  if (!canAccessAdmin(user)) return { state: 'redirect', href: '/' };
  if (!isSystemAdmin(user) && (systemPages.has(name) || (name === 'clinic' && user.facility_id !== facilityId))) {
    return { state: 'redirect', href: '/admin/dashboard' };
  }
  return { state: 'allow' };
}

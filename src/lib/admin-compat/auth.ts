import { createContext, useContext } from 'react';
import type { Auth } from '#lib/auth/auth.svelte.ts';

export type AdminAuth = Pick<Auth, 'user' | 'isLoading' | 'isAuthenticated' | 'sessionExpiredMessage' | 'login' | 'loginWithGoogle' | 'loginWithApple' | 'register' | 'logout' | 'refreshUser' | 'clearSessionExpiredMessage'>;
export const AdminAuthContext = createContext<AdminAuth | null>(null);

/** 後台與 Svelte 共用登入實例；這裡不另存 token 或註冊過期監聽器。 */
export function useAuth(): AdminAuth {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error('後台需由 Svelte 登入橋接層掛載');
  return value;
}

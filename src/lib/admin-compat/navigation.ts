import { createContext, useContext } from 'react';

export interface AdminRouter {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
  refresh: () => void;
}
export interface NavigationState {
  pathname: string;
  params: Record<string, string | undefined>;
  search: string;
  router: AdminRouter;
  theme: string;
  resolvedTheme: string;
  setTheme: (theme: string) => void;
}
export const NavigationContext = createContext<NavigationState | null>(null);
export function useNavigation(): NavigationState {
  const value = useContext(NavigationContext);
  if (!value) throw new Error('後台需由 Svelte 路由橋接層掛載');
  return value;
}
export function useRouter(): AdminRouter { return useNavigation().router; }
export function usePathname(): string { return useNavigation().pathname; }
export function useParams<T = Record<string, string>>(): T { return useNavigation().params as T; }
export function useSearchParams(): URLSearchParams { return new URLSearchParams(useNavigation().search); }

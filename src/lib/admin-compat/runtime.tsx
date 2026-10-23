import { createElement, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminAuthContext, type AdminAuth } from './auth';
import { NavigationContext, type NavigationState } from './navigation';
import AdminLayout from './legacy/app/admin/layout';

const pages = {
  index: () => import('./legacy/app/admin/page'),
  login: () => import('./legacy/app/admin/login/page'),
  dashboard: () => import('./legacy/app/admin/dashboard/page'),
  clinics: () => import('./legacy/app/admin/clinics/page'),
  clinic: () => import('./legacy/app/admin/clinics/[id]/page'),
  analytics: () => import('./legacy/app/admin/analytics/page'),
  applications: () => import('./legacy/app/admin/applications/page'),
  settings: () => import('./legacy/app/admin/settings/page'),
  subscription: () => import('./legacy/app/admin/subscription/page'),
  users: () => import('./legacy/app/admin/users/page'),
};
export type AdminPage = keyof typeof pages;

export async function createAdminRoot(element: HTMLElement, name: AdminPage) {
  const Page: ComponentType = (await pages[name]()).default;
  const root = createRoot(element);
  return {
    render(auth: AdminAuth, navigation: NavigationState) {
      root.render(createElement(AdminAuthContext.Provider, { value: auth },
        createElement(NavigationContext.Provider, { value: navigation },
          createElement(AdminLayout, { children: createElement(Page, { key: navigation.pathname }) }))));
    },
    clear() { root.render(null); },
    destroy() { root.unmount(); },
  };
}

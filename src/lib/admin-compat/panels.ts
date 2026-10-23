// 尚未移轉的院所設定只在需要時載入，日常原生 Svelte 工作頁不載入 React。
import { createElement, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminAuthContext, type AdminAuth } from './auth.ts';
import { NavigationContext, type NavigationState } from './navigation.ts';
const loaders = {
  patient: async()=> (await import('./legacy/components/admin/clinics/patient-detail-dialog.tsx')).PatientDetailDialog,
  personnel: async()=> (await import('./legacy/components/admin/clinics/personnel-tab.tsx')).PersonnelTab,
  services: async()=> (await import('./legacy/components/admin/clinics/services-tab.tsx')).ServicesTab,
  announcements: async()=> (await import('./legacy/components/admin/clinics/announcements-tab.tsx')).AnnouncementsTab,
  stats: async()=> (await import('./legacy/components/admin/clinics/doctor-stats-tab.tsx')).DoctorStatsTab,
  analytics: async()=> (await import('./legacy/components/admin/clinics/analytics-tab.tsx')).FacilityAnalyticsView,
  subscription: async()=> (await import('./legacy/app/admin/subscription/page.tsx')).default,
  subscriptionInfo: async()=> (await import('./legacy/components/admin/clinics/subscription-section.tsx')).SubscriptionSection,
  edit: async()=> (await import('./legacy/components/admin/clinics/clinic-form-dialog.tsx')).ClinicFormDialog,
  password: async()=> (await import('./legacy/components/admin/change-password-dialog.tsx')).ChangePasswordDialog,
  remove: async()=> (await import('./legacy/components/admin/clinics/clinic-delete-dialog.tsx')).ClinicDeleteDialog,
};
export type LegacyPanelName = keyof typeof loaders;
export async function createPanel(element:HTMLElement,name:LegacyPanelName){
  const Panel=(await loaders[name]()) as unknown as ComponentType<Record<string,unknown>>;
  const root=createRoot(element);
  return {render(auth:AdminAuth,navigation:NavigationState,props:Record<string,unknown>){root.render(createElement(AdminAuthContext.Provider,{value:auth},createElement(NavigationContext.Provider,{value:navigation},createElement(Panel,props))));},destroy(){root.unmount();}};
}

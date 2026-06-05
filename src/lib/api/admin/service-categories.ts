import { api } from "../client";
import type { FacilityType } from "@/types/clinic";

export interface ServiceCategoryAdmin {
  id: string;
  facility_type: FacilityType;
  code: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export interface ServiceCategoryCreate {
  facility_type: FacilityType;
  label: string;
  code?: string; // 選填；不給則後端自動產生 UUID
}

export interface ServiceCategoryUpdate {
  label?: string;
  sort_order?: number;
  is_active?: boolean;
}

const BASE = "/api/v1/service-categories/admin";

export const adminServiceCategoriesApi = {
  list: () => api.get<ServiceCategoryAdmin[]>(BASE),
  create: (data: ServiceCategoryCreate) =>
    api.post<ServiceCategoryAdmin>(BASE, data),
  update: (id: string, data: ServiceCategoryUpdate) =>
    api.patch<ServiceCategoryAdmin>(`${BASE}/${id}`, data),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
};

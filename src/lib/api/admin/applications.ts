import { api } from "../client";
import type { ApplicationStatus, FacilityApplication } from "@/types/clinic";

const PATH = "/api/v1/facility-applications";

/** 夥伴加入申請的審核 API（僅系統管理員） */
export const adminApplicationsApi = {
  list: (status?: ApplicationStatus) =>
    api.get<FacilityApplication[]>(PATH, {
      params: status ? { status } : undefined,
    }),

  /** 核准：後端會建立院所（先不上架）與院所管理員帳號 */
  approve: (id: string, note?: string) =>
    api.post<FacilityApplication>(`${PATH}/${id}/approve`, { note }),

  reject: (id: string, note?: string) =>
    api.post<FacilityApplication>(`${PATH}/${id}/reject`, { note }),
};

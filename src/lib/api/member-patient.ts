import { api } from "./client";
import type {
  MemberPatientCreate,
  MemberPatientRead,
  MemberPatientUpdate,
} from "@/types/member-patient";

const PREFIX = "/api/v1/member/patients";

export const memberPatientApi = {
  list: () => api.get<MemberPatientRead[]>(`${PREFIX}/`),

  get: (id: string) => api.get<MemberPatientRead>(`${PREFIX}/${id}`),

  create: (data: MemberPatientCreate) =>
    api.post<MemberPatientRead>(`${PREFIX}/`, data),

  update: (id: string, data: MemberPatientUpdate) =>
    api.patch<MemberPatientRead>(`${PREFIX}/${id}`, data),

  delete: (id: string) => api.delete<void>(`${PREFIX}/${id}`),
};

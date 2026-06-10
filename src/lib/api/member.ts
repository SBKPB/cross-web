import { api } from "./client";

export interface MemberAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  is_new_user: boolean;
}

// 綁定的患者紀錄（跨院所）
export interface LinkedPatientInfo {
  id: string;
  name: string;
  phone: string;
  facility_id: string;
  facility_name: string;
}

// 會員個人資料（GET / PATCH /member/me 回應）
export interface MemberProfile {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  auth_provider: string;
  linked_patients: LinkedPatientInfo[];
  created_at: string;
}

// 會員個人資料部分更新：未帶＝不動該欄位、帶 null＝清空；Email 不可編輯
export interface MemberProfileUpdate {
  display_name?: string | null;
  phone?: string | null;
}

const MEMBER_PREFIX = "/api/v1/member";

export const memberApi = {
  googleAuth: (idToken: string, phone?: string) =>
    api.post<MemberAuthResponse>(`${MEMBER_PREFIX}/google`, {
      id_token: idToken,
      phone: phone || undefined,
    }),

  appleAuth: (idToken: string, userName?: string) =>
    api.post<MemberAuthResponse>(`${MEMBER_PREFIX}/apple`, {
      id_token: idToken,
      user_name: userName || undefined,
    }),

  /** 更新會員個人資料（部分更新：未帶欄位不動、帶 null 清空），回傳更新後 profile */
  updateProfile: (payload: MemberProfileUpdate) =>
    api.patch<MemberProfile>(`${MEMBER_PREFIX}/me`, payload),

  /** 刪除會員帳號（204；看診人與預約紀錄一併刪除，無法復原） */
  deleteAccount: () => api.delete<void>(`${MEMBER_PREFIX}/me`),
};

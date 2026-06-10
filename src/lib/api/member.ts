import { api } from "./client";

export interface MemberAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  is_new_user: boolean;
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

  /** 刪除會員帳號（204；看診人與預約紀錄一併刪除，無法復原） */
  deleteAccount: () => api.delete<void>(`${MEMBER_PREFIX}/me`),
};

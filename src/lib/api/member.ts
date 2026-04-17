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
};

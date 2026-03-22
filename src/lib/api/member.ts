import { api } from "./client";

export interface GoogleAuthRequest {
  id_token: string;
  phone?: string;
  bind_token?: string;
}

export interface MemberAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  is_new_user: boolean;
}

export const memberApi = {
  googleAuth: (data: GoogleAuthRequest) =>
    api.post<MemberAuthResponse>("/api/v1/member/google", data),
};

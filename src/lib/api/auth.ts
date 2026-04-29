import { api } from "./client";
import type { User, RegisterRequest, TokenResponse, RefreshTokenRequest } from "@/types/auth";

const AUTH_PREFIX = "/api/v1/auth";

export const authApi = {
  /**
   * 註冊新使用者
   */
  register: (data: RegisterRequest) =>
    api.post<User>(`${AUTH_PREFIX}/register`, data),

  /**
   * 登入 (使用 OAuth2 form-data 格式)
   */
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    return api.post<TokenResponse>(`${AUTH_PREFIX}/login`, formData);
  },

  /**
   * 刷新 Token
   */
  refresh: (data: RefreshTokenRequest) =>
    api.post<TokenResponse>(`${AUTH_PREFIX}/refresh`, data),

  /**
   * 取得當前使用者資訊
   */
  me: () => api.get<User>(`${AUTH_PREFIX}/me`),

  /**
   * 更改自己的密碼（需驗證目前密碼）
   */
  changePassword: (current_password: string, new_password: string) =>
    api.post<void>(`${AUTH_PREFIX}/change-password`, {
      current_password,
      new_password,
    }),
};

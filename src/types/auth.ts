// 使用者資料
export interface User {
  id: string;
  email: string;
  is_active: boolean;
  phone_number: string | null;
  created_at: string;
  updated_at: string | null;
}

// 註冊請求
export interface RegisterRequest {
  email: string;
  password: string;
  phone_number?: string;
}

// 登入回應 Token
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// 刷新 Token 請求
export interface RefreshTokenRequest {
  refresh_token: string;
}

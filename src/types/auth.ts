// 使用者所屬院所概要（含訂閱狀態，供前端 banner 用）
export interface FacilitySummary {
  id: string;
  name: string;
  subscription_plan: "trial" | "basic" | "standard" | "premium";
  subscription_status: "trial" | "active" | "suspended" | "cancelled";
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
}

// 使用者資料
export interface User {
  id: string;
  email: string;
  is_active: boolean;
  phone_number: string | null;
  facility_id: string | null;
  roles: string[];
  facility: FacilitySummary | null;
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

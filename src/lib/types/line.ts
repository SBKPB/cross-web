export interface BindByTokenRequest {
  token: string;
}

export interface BindResponse {
  success: boolean;
  message: string;
  user_email?: string;
}

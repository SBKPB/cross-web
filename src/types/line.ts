export interface BindByTokenRequest {
  token: string;
  patient_phone: string;
}

export interface BindResponse {
  success: boolean;
  message: string;
  patient_name?: string;
  bound_count: number;
}

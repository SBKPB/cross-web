// 角色
export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
}

// 使用者（管理端，含角色、院所與民眾端會員資訊）
export interface AdminUser {
  id: string;
  email: string;
  is_active: boolean;
  phone_number: string | null;
  facility_id: string | null;
  last_login: string | null;
  member_patients_count: number;
  created_at: string;
  updated_at: string | null;
}

// 使用者權限回應（GET /users/{id}/permissions）
export interface UserPermissions {
  user_id: string;
  roles: Role[];
  permissions: { id: string; name: string; description: string | null }[];
}

// 建立使用者
export interface AdminUserCreate {
  email: string;
  password: string;
  phone_number?: string;
  facility_id?: string;
  role_ids?: string[];
}

// 更新使用者
export interface AdminUserUpdate {
  email: string;
  is_active: boolean;
  phone_number: string | null;
  facility_id: string | null;
}

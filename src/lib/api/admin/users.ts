import { api } from "../client";
import type {
  AdminUser,
  AdminUserUpdate,
  Role,
  UserPermissions,
} from "@/types/user";
import type { User, RegisterRequest } from "@/types/auth";

const USERS_PATH = "/api/v1/users";
const ROLES_PATH = "/api/v1/roles";
const AUTH_PATH = "/api/v1/auth";

export const adminUsersApi = {
  // ========== 使用者 ==========

  list: () => api.get<AdminUser[]>(`${USERS_PATH}/`),

  get: (id: string) => api.get<AdminUser>(`${USERS_PATH}/${id}`),

  create: async (data: RegisterRequest) => {
    const user = await api.post<User>(`${AUTH_PATH}/register`, data);
    return user;
  },

  update: (id: string, data: AdminUserUpdate) =>
    api.patch<AdminUser>(`${USERS_PATH}/${id}`, data),

  delete: (id: string) => api.delete<void>(`${USERS_PATH}/${id}`),

  // ========== 角色 ==========

  getRoles: () => api.get<Role[]>(`${ROLES_PATH}/`),

  getUserPermissions: (id: string) =>
    api.get<UserPermissions>(`${USERS_PATH}/${id}/permissions`),

  setUserRoles: (id: string, roleIds: string[]) =>
    api.put<{ message: string }>(`${USERS_PATH}/${id}/roles`, {
      role_ids: roleIds,
    }),

  // ========== LINE 綁定 ==========

  /** 強制清除指定 user 所有 LINE 綁定（user-based + patient-based） */
  unbindLine: (id: string) =>
    api.delete<{ deleted_count: number }>(`${USERS_PATH}/${id}/line-bindings`),
};

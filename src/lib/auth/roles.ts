import type { User } from "@/types/auth";

const SYSTEM_ADMIN_ROLES = new Set(["admin", "superadmin"]);
const FACILITY_ROLES = new Set(["facility_admin", "facility_staff"]);

/** 後台員工帳號允許的 4 種角色 — patient 等其它角色不在後台管理 */
export const STAFF_ROLE_NAMES = [
  "superadmin",
  "admin",
  "facility_admin",
  "facility_staff",
] as const;

const STAFF_ROLE_SET: Set<string> = new Set(STAFF_ROLE_NAMES);
const FACILITY_BOUND_ROLE_SET = new Set(["facility_admin", "facility_staff"]);

/** 是否為後台員工角色（用於過濾後台 user 列表與 role 選項） */
export function isStaffRole(roleName: string): boolean {
  return STAFF_ROLE_SET.has(roleName);
}

/** 該角色是否「必須」綁定一個院所 */
export function requiresFacility(roleName: string): boolean {
  return FACILITY_BOUND_ROLE_SET.has(roleName);
}

export function isSystemAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.roles.some((role) => SYSTEM_ADMIN_ROLES.has(role));
}

export function isFacilityUser(user: User | null): boolean {
  if (!user) return false;
  return (
    user.roles.some((role) => FACILITY_ROLES.has(role)) && !!user.facility_id
  );
}

export function canAccessAdmin(user: User | null): boolean {
  return isSystemAdmin(user) || isFacilityUser(user);
}

export function getAdminHomePath(user: User | null): string {
  if (isSystemAdmin(user)) return "/admin/clinics";
  if (isFacilityUser(user) && user?.facility_id) {
    return `/admin/clinics/${user.facility_id}`;
  }
  return "/";
}

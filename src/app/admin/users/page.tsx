"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  PlusIcon,
  SearchIcon,
  UsersIcon,
  PencilIcon,
  ShieldIcon,
  Trash2Icon,
  CalendarPlus,
  Link2Off,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserFormDialog,
  UserRoleDialog,
  UserDeleteDialog,
  UserLineUnbindDialog,
} from "@/components/admin/users";
import { RenewSubscriptionDialog } from "@/components/admin/clinics/renew-subscription-dialog";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { useRequireSystemAdmin } from "@/lib/auth/use-require-system-admin";
import { isStaffRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import {
  lumaCardInner,
  lumaPageContainer,
  lumaSectionDesc,
  lumaSectionTitle,
  lumaTableHeader,
  lumaTableRowHover,
  lumaTableShell,
} from "@/lib/styles/luma";
import { adminUsersApi } from "@/lib/api/admin/users";
import { adminClinicsApi } from "@/lib/api/admin/clinics";
import type {
  AdminUser,
  AdminUserCreate,
  AdminUserUpdate,
  Role,
  UserPermissions,
} from "@/types/user";
import type { MedicalFacility } from "@/types/clinic";

type UserTab = "staff" | "patient";

export default function AdminUsersPage() {
  useRequireSystemAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<UserTab>("staff");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 參考資料
  const [roles, setRoles] = useState<Role[]>([]);
  const [facilities, setFacilities] = useState<MedicalFacility[]>([]);
  const [userRolesMap, setUserRolesMap] = useState<
    Record<string, Role[]>
  >({});

  // Dialog 狀態
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleDialogUser, setRoleDialogUser] = useState<AdminUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [renewFacility, setRenewFacility] = useState<MedicalFacility | null>(null);
  const [unbindDialogOpen, setUnbindDialogOpen] = useState(false);
  const [unbindUser, setUnbindUser] = useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUserRolesMap = useCallback(
    async (userList: AdminUser[]): Promise<Record<string, Role[]>> => {
      const map: Record<string, Role[]> = {};
      await Promise.all(
        userList.map(async (user) => {
          try {
            const perms: UserPermissions =
              await adminUsersApi.getUserPermissions(user.id);
            map[user.id] = perms.roles;
          } catch {
            map[user.id] = [];
          }
        }),
      );
      return map;
    },
    [],
  );

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminUsersApi.list();
      // 串接 roles 一起載完才解除 loading，避免 empty state 閃現
      const map = await fetchUserRolesMap(data);
      setUsers(data);
      setUserRolesMap(map);
    } catch (err) {
      setError("無法載入使用者資料");
      console.error("Failed to fetch users:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserRolesMap]);

  const fetchRolesAndFacilities = useCallback(async () => {
    try {
      const [rolesData, facilitiesData] = await Promise.all([
        adminUsersApi.getRoles(),
        adminClinicsApi.list(),
      ]);
      setRoles(rolesData);
      setFacilities(facilitiesData);
    } catch (err) {
      console.error("Failed to fetch roles/facilities:", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRolesAndFacilities();
  }, [fetchUsers, fetchRolesAndFacilities]);

  useEffect(() => {
    // 依分頁過濾：
    //  - staff：擁有 superadmin / admin / facility_admin / facility_staff 任一角色
    //  - patient：以上都沒有（patient role 或無角色）
    const scoped = users.filter((user) => {
      const userRoles = userRolesMap[user.id];
      if (!userRoles) return tab === "patient"; // 無角色資料當成一般使用者
      const isStaff = userRoles.some((r) => isStaffRole(r.name));
      return tab === "staff" ? isStaff : !isStaff;
    });

    if (!searchTerm.trim()) {
      setFilteredUsers(scoped);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredUsers(
        scoped.filter((user) => user.email.toLowerCase().includes(term)),
      );
    }
  }, [users, userRolesMap, searchTerm, tab]);

  // 兩個分頁的計數（給 tab 上的 badge 用）
  const tabCounts = useMemo(() => {
    let staff = 0;
    let patient = 0;
    for (const user of users) {
      const roles = userRolesMap[user.id];
      const isStaff = roles?.some((r) => isStaffRole(r.name)) ?? false;
      if (isStaff) staff += 1;
      else patient += 1;
    }
    return { staff, patient };
  }, [users, userRolesMap]);

  const facilityMap = useMemo(
    () => new Map(facilities.map((f) => [f.id, f])),
    [facilities],
  );

  const getFacilityName = (facilityId: string | null) => {
    if (!facilityId) return "—";
    return facilityMap.get(facilityId)?.name || "未知";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const renderSubscriptionCell = (facilityId: string | null) => {
    if (!facilityId) {
      return <span className="text-sm text-muted-foreground">—</span>;
    }
    const facility = facilityMap.get(facilityId);
    if (!facility) {
      return <span className="text-sm text-muted-foreground">—</span>;
    }
    const expiresIso = facility.subscription_expires_at;
    const status = facility.subscription_status;

    if (!expiresIso) {
      return (
        <Badge variant="outline">
          {status === "trial" ? "試用中" : "未設定"}
        </Badge>
      );
    }

    const expiresDate = new Date(expiresIso);
    const dateStr = formatDate(expiresIso);
    const days = Math.ceil(
      (expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    let hint: { label: string; variant: "secondary" | "outline" | "destructive" } | null =
      null;
    if (status === "suspended" || status === "cancelled") {
      hint = {
        label: status === "suspended" ? "已暫停" : "已取消",
        variant: "destructive",
      };
    } else if (days < 0) {
      hint = { label: `已過期 ${-days} 天`, variant: "destructive" };
    } else if (days <= 7) {
      hint = { label: `${days} 天後到期`, variant: "destructive" };
    } else if (days <= 30) {
      hint = { label: `${days} 天後到期`, variant: "outline" };
    }

    return (
      <div className="space-y-1">
        <div className="text-sm text-foreground">{dateStr}</div>
        {hint && (
          <Badge variant={hint.variant} className="text-xs">
            {hint.label}
          </Badge>
        )}
      </div>
    );
  };

  // ========== 新增使用者 ==========
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormDialogOpen(true);
  };

  const handleCreate = async (data: AdminUserCreate | AdminUserUpdate) => {
    setIsSubmitting(true);
    try {
      const createData = data as AdminUserCreate;
      const newUser = await adminUsersApi.create({
        email: createData.email,
        password: createData.password,
        phone_number: createData.phone_number,
      });

      // 設定角色
      if (createData.role_ids && createData.role_ids.length > 0) {
        await adminUsersApi.setUserRoles(newUser.id, createData.role_ids);
      }

      // 設定 facility_id（如果有的話，透過 update）
      if (createData.facility_id) {
        await adminUsersApi.update(newUser.id, {
          email: createData.email,
          is_active: true,
          phone_number: createData.phone_number || null,
          facility_id: createData.facility_id,
        });
      }

      setFormDialogOpen(false);
      await fetchUsers();
    } catch (err) {
      console.error("Failed to create user:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== 編輯使用者 ==========
  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormDialogOpen(true);
  };

  const handleUpdate = async (data: AdminUserCreate | AdminUserUpdate) => {
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      await adminUsersApi.update(editingUser.id, data as AdminUserUpdate);
      setFormDialogOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      console.error("Failed to update user:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== 角色管理 ==========
  const handleOpenRoles = (user: AdminUser) => {
    setRoleDialogUser(user);
    setRoleDialogOpen(true);
  };

  const handleSetRoles = async (roleIds: string[]) => {
    if (!roleDialogUser) return;
    setIsSubmitting(true);
    try {
      await adminUsersApi.setUserRoles(roleDialogUser.id, roleIds);
      setRoleDialogOpen(false);
      setRoleDialogUser(null);
      // 重新載入 user list（會一併刷新 userRolesMap）
      await fetchUsers();
    } catch (err) {
      console.error("Failed to set roles:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== 訂閱續約 ==========
  const handleOpenRenew = (user: AdminUser) => {
    if (!user.facility_id) return;
    const facility = facilityMap.get(user.facility_id);
    if (!facility) return;
    setRenewFacility(facility);
    setRenewDialogOpen(true);
  };

  const handleRenewed = (updated: MedicalFacility) => {
    // 更新本地 facilities，這樣 renderSubscriptionCell 立即反映新到期日
    setFacilities((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f)),
    );
    setRenewFacility(null);
  };

  // ========== 解除 LINE 綁定 ==========
  const handleOpenUnbind = (user: AdminUser) => {
    setUnbindUser(user);
    setUnbindDialogOpen(true);
  };

  const handleUnbind = async () => {
    if (!unbindUser) return;
    setIsSubmitting(true);
    try {
      const res = await adminUsersApi.unbindLine(unbindUser.id);
      setUnbindDialogOpen(false);
      setUnbindUser(null);
      alert(`已清除 ${res.deleted_count} 筆 LINE 綁定`);
    } catch (err) {
      console.error("Failed to unbind LINE:", err);
      alert("解除失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== 刪除使用者 ==========
  const handleOpenDelete = (user: AdminUser) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setIsSubmitting(true);
    try {
      await adminUsersApi.delete(deletingUser.id);
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      await fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={lumaPageContainer}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className={lumaSectionTitle}>使用者管理</h1>
          <p className={lumaSectionDesc}>管理系統使用者帳號、角色與權限</p>
        </div>
        {tab === "staff" && (
          <Button onClick={handleOpenCreate}>
            <PlusIcon className="mr-2 size-4" />
            新增使用者
          </Button>
        )}
      </div>

      {/* 分頁切換：員工 / 一般使用者 */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as UserTab)}>
        <TabsList>
          <TabsTrigger value="staff">
            員工帳號
            <Badge variant="outline" className="ml-2 text-xs">
              {tabCounts.staff}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="patient">
            一般使用者
            <Badge variant="outline" className="ml-2 text-xs">
              {tabCounts.patient}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 搜尋 */}
      <div className={cn(lumaCardInner, "p-3")}>
        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜尋電子信箱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      {/* 使用者列表 */}
      {error ? (
        <AdminEmptyState
          icon={UsersIcon}
          title={error}
          action={
            <Button variant="outline" onClick={fetchUsers}>
              重試
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <AdminEmptyState
          icon={UsersIcon}
          title="尚無使用者資料"
          description="點擊「新增使用者」開始建立"
          action={
            <Button onClick={handleOpenCreate}>
              <PlusIcon className="mr-2 size-4" />
              新增使用者
            </Button>
          }
        />
      ) : (
        <div className={lumaTableShell}>
          <Table>
            <TableHeader className={lumaTableHeader}>
              <TableRow>
                <TableHead>電子信箱</TableHead>
                <TableHead>狀態</TableHead>
                {tab === "staff" ? (
                  <>
                    <TableHead>角色</TableHead>
                    <TableHead>所屬院所</TableHead>
                    <TableHead>訂閱到期</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>電話</TableHead>
                    <TableHead>最後登入</TableHead>
                    <TableHead>家屬人數</TableHead>
                  </>
                )}
                <TableHead>建立時間</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className={lumaTableRowHover}>
                  <TableCell className="font-medium text-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "secondary" : "outline"}>
                      {user.is_active ? "啟用" : "停用"}
                    </Badge>
                  </TableCell>
                  {tab === "staff" ? (
                    <>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(userRolesMap[user.id] || []).length > 0 ? (
                            userRolesMap[user.id].map((role) => (
                              <Badge key={role.id} variant="outline">
                                {role.display_name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              無角色
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getFacilityName(user.facility_id)}
                      </TableCell>
                      <TableCell>
                        {renderSubscriptionCell(user.facility_id)}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        {user.phone_number ? (
                          <span className="text-sm text-foreground">
                            {user.phone_number}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.last_login ? (
                          <span className="text-sm text-foreground">
                            {formatDate(user.last_login)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.member_patients_count > 0 ? (
                          <span className="text-sm text-foreground">
                            {user.member_patients_count}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </>
                  )}
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {tab === "staff" && user.facility_id && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenRenew(user)}
                          title="續約訂閱"
                        >
                          <CalendarPlus className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenEdit(user)}
                        title="編輯"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      {tab === "staff" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenRoles(user)}
                          title="角色管理"
                        >
                          <ShieldIcon className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenUnbind(user)}
                        title="解除 LINE 綁定"
                      >
                        <Link2Off className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenDelete(user)}
                        title="刪除"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogs */}
      <UserFormDialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setEditingUser(null);
        }}
        user={editingUser}
        roles={roles}
        facilities={facilities}
        kind={editingUser && tab === "patient" ? "patient" : "staff"}
        onSubmit={editingUser ? handleUpdate : handleCreate}
        isLoading={isSubmitting}
      />

      <UserRoleDialog
        open={roleDialogOpen}
        onOpenChange={(open) => {
          setRoleDialogOpen(open);
          if (!open) setRoleDialogUser(null);
        }}
        user={roleDialogUser}
        allRoles={roles}
        currentRoleIds={(userRolesMap[roleDialogUser?.id || ""] || []).map(
          (r) => r.id
        )}
        onConfirm={handleSetRoles}
        isLoading={isSubmitting}
      />

      <RenewSubscriptionDialog
        open={renewDialogOpen}
        onOpenChange={(open) => {
          setRenewDialogOpen(open);
          if (!open) setRenewFacility(null);
        }}
        facility={renewFacility}
        onRenewed={handleRenewed}
      />

      <UserDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeletingUser(null);
        }}
        user={deletingUser}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />

      <UserLineUnbindDialog
        open={unbindDialogOpen}
        onOpenChange={(open) => {
          setUnbindDialogOpen(open);
          if (!open) setUnbindUser(null);
        }}
        user={unbindUser}
        onConfirm={handleUnbind}
        isLoading={isSubmitting}
      />
    </div>
  );
}

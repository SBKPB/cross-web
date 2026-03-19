"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  SearchIcon,
  UsersIcon,
  PencilIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/admin/users";
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminUsersApi.list();
      setUsers(data);
    } catch (err) {
      setError("無法載入使用者資料");
      console.error("Failed to fetch users:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const fetchUserRoles = useCallback(
    async (userList: AdminUser[]) => {
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
        })
      );
      setUserRolesMap(map);
    },
    []
  );

  useEffect(() => {
    fetchUsers();
    fetchRolesAndFacilities();
  }, [fetchUsers, fetchRolesAndFacilities]);

  useEffect(() => {
    if (users.length > 0) {
      fetchUserRoles(users);
    }
  }, [users, fetchUserRoles]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter((user) => user.email.toLowerCase().includes(term))
      );
    }
  }, [users, searchTerm]);

  const getFacilityName = (facilityId: string | null) => {
    if (!facilityId) return "—";
    const facility = facilities.find((f) => f.id === facilityId);
    return facility?.name || "未知";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
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
      // 重新載入角色
      await fetchUserRoles(users);
    } catch (err) {
      console.error("Failed to set roles:", err);
      throw err;
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
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">使用者管理</h1>
          <p className="text-muted-foreground text-sm">
            管理系統使用者帳號、角色與權限
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <PlusIcon className="mr-2 size-4" />
          新增使用者
        </Button>
      </div>

      {/* 搜尋 */}
      <div className="relative mb-6">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="搜尋電子信箱..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 使用者列表 */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-2">{error}</p>
          <Button variant="outline" onClick={fetchUsers}>
            重試
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="border-primary size-8 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <UsersIcon className="text-muted-foreground mb-4 size-12" />
          <p className="text-muted-foreground">尚無使用者資料</p>
          <p className="text-muted-foreground mb-4 text-sm">
            點擊「新增使用者」開始建立
          </p>
          <Button onClick={handleOpenCreate}>
            <PlusIcon className="mr-2 size-4" />
            新增使用者
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>電子信箱</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>所屬院所</TableHead>
                <TableHead>建立時間</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.is_active ? "default" : "secondary"}
                    >
                      {user.is_active ? "啟用" : "停用"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(userRolesMap[user.id] || []).length > 0 ? (
                        userRolesMap[user.id].map((role) => (
                          <Badge key={role.id} variant="outline">
                            {role.display_name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          無角色
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getFacilityName(user.facility_id)}</TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(user)}
                        title="編輯"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenRoles(user)}
                        title="角色管理"
                      >
                        <ShieldIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
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
    </div>
  );
}

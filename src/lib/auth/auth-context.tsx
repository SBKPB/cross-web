"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { onTokenExpired } from "@/lib/auth/auth-events";
import { SessionExpiredDialog } from "@/components/auth/session-expired-dialog";
import type { User } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionExpiredMessage: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearSessionExpiredMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);
  const [showSessionExpiredDialog, setShowSessionExpiredDialog] = useState(false);
  const router = useRouter();
  const isHandlingExpiry = useRef(false);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.me();
      setUser(userData);
    } catch {
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }, []);

  // 處理 token 過期 - 顯示提示對話框
  const handleTokenExpired = useCallback(() => {
    // 防止重複處理
    if (isHandlingExpiry.current) return;
    isHandlingExpiry.current = true;

    // 清除認證資訊
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);

    // 顯示過期提示對話框（不直接跳轉）
    setShowSessionExpiredDialog(true);
  }, []);

  // 用戶確認後導向登入頁
  const handleSessionExpiredConfirm = useCallback(() => {
    setShowSessionExpiredDialog(false);
    setSessionExpiredMessage("您的登入已過期，請重新登入");
    router.push("/admin/login");

    // 重置標記
    setTimeout(() => {
      isHandlingExpiry.current = false;
    }, 1000);
  }, [router]);

  // 監聽 token 過期事件
  useEffect(() => {
    const unsubscribe = onTokenExpired(handleTokenExpired);
    return unsubscribe;
  }, [handleTokenExpired]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial auth check on mount
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    // 清除過期訊息
    setSessionExpiredMessage(null);
    const tokens = await authApi.login(email, password);
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    await refreshUser();
    router.push("/");
  };

  const register = async (email: string, password: string) => {
    await authApi.register({ email, password });
    // 註冊成功後自動登入
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setSessionExpiredMessage(null);
    router.push("/login");
  };

  // 清除過期訊息
  const clearSessionExpiredMessage = useCallback(() => {
    setSessionExpiredMessage(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        sessionExpiredMessage,
        login,
        register,
        logout,
        refreshUser,
        clearSessionExpiredMessage,
      }}
    >
      {children}
      <SessionExpiredDialog
        open={showSessionExpiredDialog}
        onConfirm={handleSessionExpiredConfirm}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

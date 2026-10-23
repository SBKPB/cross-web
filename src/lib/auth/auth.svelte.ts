import { getContext, setContext } from "svelte";
import { goto } from "$app/navigation";
import { authApi } from "#lib/api/auth.ts";
import { memberApi } from "#lib/api/member.ts";
import { onTokenExpired } from "#lib/auth/auth-events.ts";
import { canAccessAdmin, getAdminHomePath, isSystemAdmin } from "#lib/auth/roles.ts";
import type { User } from "#lib/types/auth.ts";

/**
 * 登入狀態（移植自舊版 auth-context.tsx，行為相同）。
 * token 存 localStorage（access_token / refresh_token）；每個請求（SSR）各自一份實例，透過 context 取得。
 */
export class Auth {
	user = $state<User | null>(null);
	isLoading = $state(true);
	sessionExpiredMessage = $state<string | null>(null);
	/** 「登入已過期」對話框是否開啟（由 root layout 的 SessionExpiredDialog 顯示） */
	showSessionExpiredDialog = $state(false);
	isAuthenticated = $derived(!!this.user);

	#isHandlingExpiry = false;

	/** 瀏覽器端初始化：監聽 token 過期事件並載入目前使用者。回傳清除函式。 */
	init(): () => void {
		const unsubscribe = onTokenExpired(() => this.#handleTokenExpired());
		if (localStorage.getItem("access_token")) {
			this.refreshUser().finally(() => (this.isLoading = false));
		} else {
			this.isLoading = false;
		}
		return unsubscribe;
	}

	refreshUser = async (): Promise<void> => {
		try {
			this.user = await authApi.me();
		} catch {
			this.user = null;
			localStorage.removeItem("access_token");
			localStorage.removeItem("refresh_token");
		}
	};

	// 處理 token 過期 - 顯示提示對話框
	#handleTokenExpired() {
		// 防止重複處理
		if (this.#isHandlingExpiry) return;
		this.#isHandlingExpiry = true;

		// 清除認證資訊
		localStorage.removeItem("access_token");
		localStorage.removeItem("refresh_token");
		this.user = null;

		// 顯示過期提示對話框（不直接跳轉）
		this.showSessionExpiredDialog = true;
	}

	/** 使用者在過期對話框按下確認後導向登入頁 */
	confirmSessionExpired = () => {
		this.showSessionExpiredDialog = false;
		this.sessionExpiredMessage = "您的登入已過期，請重新登入";
		goto("/admin/login");

		// 重置標記
		setTimeout(() => {
			this.#isHandlingExpiry = false;
		}, 1000);
	};

	#storeTokens(tokens: { access_token: string; refresh_token: string }) {
		localStorage.setItem("access_token", tokens.access_token);
		localStorage.setItem("refresh_token", tokens.refresh_token);
	}

	login = async (email: string, password: string): Promise<User> => {
		// 清除過期訊息
		this.sessionExpiredMessage = null;
		this.#storeTokens(await authApi.login(email, password));
		const userData = await authApi.me();
		this.user = userData;
		return userData;
	};

	loginWithGoogle = async (idToken: string): Promise<User> => {
		this.sessionExpiredMessage = null;
		this.#storeTokens(await memberApi.googleAuth(idToken));
		const userData = await authApi.me();
		this.user = userData;
		return userData;
	};

	loginWithApple = async (idToken: string, userName?: string): Promise<User> => {
		this.sessionExpiredMessage = null;
		this.#storeTokens(await memberApi.appleAuth(idToken, userName));
		const userData = await authApi.me();
		this.user = userData;
		return userData;
	};

	register = async (email: string, password: string): Promise<void> => {
		await authApi.register({ email, password });
		// 註冊成功後自動登入並導向民眾端首頁
		await this.login(email, password);
		goto("/");
	};

	logout = (redirectTo: string = "/"): void => {
		localStorage.removeItem("access_token");
		localStorage.removeItem("refresh_token");
		this.user = null;
		this.sessionExpiredMessage = null;
		goto(redirectTo);
	};

	// 清除過期訊息
	clearSessionExpiredMessage = (): void => {
		this.sessionExpiredMessage = null;
	};
}

const AUTH_KEY = Symbol("auth");

/** root layout 呼叫一次，建立本次請求／分頁的 Auth 實例 */
export function setAuth(): Auth {
	return setContext(AUTH_KEY, new Auth());
}

export function getAuth(): Auth {
	const auth = getContext<Auth | undefined>(AUTH_KEY);
	if (!auth) throw new Error("getAuth 必須在 root layout 之下使用");
	return auth;
}

/**
 * 民眾端頁面守衛（與 {@link requireSystemAdmin} 對稱，移植自 use-require-member.ts）：
 * - 未登入 → 導向 /auth?next=<目前頁>
 * - 後台帳號（系統管理員 / 院所使用者）→ 導回其後台首頁，避免後台帳號出現在民眾端
 *
 * 需在元件初始化時呼叫。
 * @param nextPath 回傳「未登入時登入完成後要返回的路徑」的 getter，例如 `() => "/member/appointments/" + id`。
 *   在 $effect 內讀取：路徑改變（例如 [id] 參數換了）時守衛會重跑，對應舊版 useEffect 依賴 nextPath。
 * @returns ready — 是否已確認為「可顯示民眾端內容」的狀態，用來 gate 畫面與資料請求
 */
export function requireMember(nextPath: () => string): { readonly ready: boolean } {
	const auth = getAuth();
	const ready = $derived(!auth.isLoading && auth.isAuthenticated && !canAccessAdmin(auth.user));

	$effect(() => {
		const next = nextPath();
		if (auth.isLoading) return;
		if (!auth.isAuthenticated) {
			goto(`/auth?next=${encodeURIComponent(next)}`, { replaceState: true });
			return;
		}
		if (canAccessAdmin(auth.user)) {
			goto(getAdminHomePath(auth.user), { replaceState: true });
		}
	});

	return {
		get ready() {
			return ready;
		},
	};
}

/** 系統管理員頁面守衛（移植自 use-require-system-admin.ts，舊版就沒有參數）。需在元件初始化時呼叫。 */
export function requireSystemAdmin(): void {
	const auth = getAuth();

	$effect(() => {
		if (auth.isLoading) return;
		if (!auth.isAuthenticated) return;
		if (!isSystemAdmin(auth.user)) {
			goto(getAdminHomePath(auth.user), { replaceState: true });
		}
	});
}

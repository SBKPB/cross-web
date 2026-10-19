import { emitTokenExpired } from "../auth/auth-events.ts";

// 一律使用同源路徑，經 src/routes/api/v1/[...path]/+server.ts 代理到後端（後端網址只在該處）。
// 伺服器端 load 須傳入 SvelteKit 的 fetch（options.fetch），相對路徑才會在內部解析到代理路由。
const API_BASE_URL = "";

// 不需要觸發 silent refresh 的端點（避免遞迴或登入態重置）
const AUTH_ENDPOINTS = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
];

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  /** server 端 load 傳入 SvelteKit 的 fetch；瀏覽器端不傳，預設用全域 fetch */
  fetch?: typeof globalThis.fetch;
  /** 內部用：標記此 request 已嘗試過 refresh，避免無限遞迴 */
  _retried?: boolean;
}

// 不用 constructor 參數屬性：node --test 的型別剝除只支援可抹除語法
class ApiError extends Error {
  status: number;
  statusText: string;
  data?: unknown;

  constructor(status: number, statusText: string, data?: unknown) {
    super(`API Error: ${status} ${statusText}`);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

/**
 * server 端呼叫沒傳 SvelteKit 的 fetch（相對路徑必定打不到代理）。這是程式錯誤，
 * serviceCategoriesApi.get / getAllClinics 等「任何錯誤都降級」的包裝必須讓它穿透，不能靜默吞掉。
 */
class MissingFetchError extends Error {
  constructor(endpoint: string) {
    super(`[api] server 端呼叫 ${endpoint} 未傳入 SvelteKit 的 fetch`);
    this.name = "MissingFetchError";
  }
}

// ---------- Silent refresh：dedupe 並行 refresh 請求 ----------
// 多個 request 同時 401 時，只跑一次 /auth/refresh，其他人 await 同一個 promise
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(fetchImpl: typeof globalThis.fetch): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;

  try {
    const res = await fetchImpl(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
    };
    localStorage.setItem("access_token", data.access_token);
    // rolling refresh：refresh_token 也輪替
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
    return true;
  } catch {
    return false;
  }
}

function startRefresh(fetchImpl: typeof globalThis.fetch): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken(fetchImpl).finally(() => {
      // 短暫保留結果讓並行 401 共用，next tick 再清掉
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    });
  }
  return refreshPromise;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  // server 端沒傳 SvelteKit 的 fetch：相對路徑必定打不到代理。丟 MissingFetchError（非 ApiError），
  // 讓 serviceCategoriesApi.get / getAllClinics 的 fallback 不會把漏傳靜默吞掉
  if (typeof window === "undefined" && !options.fetch) {
    throw new MissingFetchError(endpoint);
  }
  const { params, _retried, fetch: fetchImpl = globalThis.fetch, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {};

  // Copy existing headers
  if (fetchOptions.headers) {
    const existingHeaders = fetchOptions.headers;
    if (existingHeaders instanceof Headers) {
      existingHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(existingHeaders)) {
      existingHeaders.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, existingHeaders);
    }
  }

  // Add auth token if available
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Add Content-Type for JSON requests (not for FormData)
  if (!(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetchImpl(url, {
      ...fetchOptions,
      headers,
    });
  } catch (error) {
    // 網路錯誤（伺服器無法連線、CORS 問題等）
    throw new ApiError(0, "Network Error", {
      message: "無法連線到伺服器，請檢查網路連線或稍後再試",
      originalError: error instanceof Error ? error.message : String(error),
    });
  }

  if (!response.ok) {
    // 401 Unauthorized：先試 silent refresh 換 access token，成功就 retry 一次
    // - 排除 auth 端點自身（避免遞迴）
    // - 排除已 retry 過的（避免無限迴圈）
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) =>
      endpoint.startsWith(ep),
    );
    if (response.status === 401 && !isAuthEndpoint && !_retried) {
      const refreshed = await startRefresh(fetchImpl);
      if (refreshed) {
        return request<T>(endpoint, { ...options, _retried: true });
      }
      // refresh 也失敗 → 真的過期，提示重登
      emitTokenExpired();
    } else if (response.status === 401 && !isAuthEndpoint) {
      // 重試後仍 401（多半是 refresh 也過期）
      emitTokenExpired();
    }

    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, data);
  }

  // 204 No Content（DELETE 等端點）無 body，不能直接 .json()
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

export { ApiError, MissingFetchError };

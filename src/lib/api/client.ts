import { emitTokenExpired } from "@/lib/auth/auth-events";

// 瀏覽器端使用同源路徑（透過 Next.js rewrites 代理），避免 CORS 問題
// 伺服器端直接連後端
const API_BASE_URL =
  typeof window !== "undefined"
    ? ""
    : process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 不需要觸發 token 過期事件的端點
const AUTH_ENDPOINTS = ["/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/refresh"];

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

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
    response = await fetch(url, {
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
    const data = await response.json().catch(() => null);

    // 401 Unauthorized: Token 過期或無效
    // 排除登入/註冊等認證端點本身的 401 錯誤
    if (response.status === 401 && !AUTH_ENDPOINTS.some((ep) => endpoint.startsWith(ep))) {
      emitTokenExpired();
    }

    throw new ApiError(response.status, response.statusText, data);
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

export { ApiError };

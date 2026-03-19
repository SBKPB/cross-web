/**
 * 認證相關事件
 * 用於 API client 和 Auth context 之間的通訊
 */

export const AUTH_EVENTS = {
  TOKEN_EXPIRED: "auth:token-expired",
  UNAUTHORIZED: "auth:unauthorized",
} as const;

/**
 * 發送 token 過期事件
 */
export function emitTokenExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_EVENTS.TOKEN_EXPIRED));
  }
}

/**
 * 監聽 token 過期事件
 */
export function onTokenExpired(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => callback();
  window.addEventListener(AUTH_EVENTS.TOKEN_EXPIRED, handler);

  // 返回取消監聽的函數
  return () => window.removeEventListener(AUTH_EVENTS.TOKEN_EXPIRED, handler);
}

import { NextResponse } from "next/server";

/**
 * 民眾端路由保護 (placeholder)
 *
 * 目前 token 存在 localStorage（不是 cookie），middleware 在 edge runtime 看不到。
 * 真正的保護在 client-side 的 AuthProvider + 各頁面 useEffect 做。
 *
 * 這個 middleware 保留作為：
 * 1. 未來改用 httpOnly cookie 後可立刻啟用
 * 2. 其他 request-level 攔截（rate limit、bot detection 等）
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|webp|avif)).*)",
  ],
};

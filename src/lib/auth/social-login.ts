// Google / Apple 登入的純邏輯，移植自舊版 app/auth/page.tsx 與 components/auth/social-login-buttons.tsx。
// 舊版經 @react-oauth/google（GoogleLogin）與 react-apple-signin-auth 1.2.1；新版直接載 GIS / Apple JS SDK，
// 這裡保留兩個套件實際送給 SDK 的參數與回呼行為。相對路徑 import：node --test 可直接載入本檔。

/** /auth?next= 的安全檢查（舊版 AuthContent）：只接受站內絕對路徑，擋 //host、反斜線與控制字元 */
export function safeNextUrl(requested: string | null | undefined): string {
  const next = requested || "/member";
  // 刻意比對控制字元（\x00-\x1f）：換行等字元可能被瀏覽器忽略而組出 //host
  // eslint-disable-next-line no-control-regex
  return next.startsWith("/") && !next.startsWith("//") && !/[\\\x00-\x1f]/.test(next) ? next : "/member";
}

/** 登入後要回到預約頁（顯示「返回選擇時段」與預約版說明） */
export function isBookingNext(nextUrl: string): boolean {
  return nextUrl.startsWith("/booking/");
}

// ─── Google（Google Identity Services）───

/** @react-oauth/google useLoadGsiScript 載入的 script（沒有 locale、nonce） */
export const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

/** GoogleLogin 的 renderButton 參數（舊版只指定 shape、size、width，其餘為套件預設或 undefined） */
export const GOOGLE_BUTTON_OPTIONS = {
  type: "standard",
  theme: "outline",
  size: "large",
  text: undefined,
  shape: "rectangular",
  logo_alignment: undefined,
  width: "400",
  locale: undefined,
  click_listener: undefined,
  state: undefined,
} as const;

/** GoogleLogin 容器高度（containerHeightMap.large） */
export const GOOGLE_BUTTON_HEIGHT = 40;

export interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
  clientId?: string;
  client_id?: string;
}

/** GoogleLogin 的 google.accounts.id.initialize 參數 */
export function googleInitOptions(clientId: string, callback: (response?: GoogleCredentialResponse) => void) {
  return { client_id: clientId, callback, login_hint: undefined };
}

/**
 * GIS 回呼：沒有 credential → onError（套件行為）；有 credential 且按鈕未停用才交給 onSuccess（舊版 GoogleSignInButton）。
 * isDisabled 在回呼當下讀取（套件以 ref 保存最新的 onSuccess）。
 */
export function googleCredentialCallback(handlers: {
  onSuccess: (idToken: string) => void;
  onError?: () => void;
  isDisabled: () => boolean;
}): (response?: GoogleCredentialResponse) => void {
  return (response) => {
    if (!response?.credential) {
      handlers.onError?.();
      return;
    }
    if (!handlers.isDisabled()) handlers.onSuccess(response.credential);
  };
}

// ─── Apple（Sign in with Apple JS）───

/** react-apple-signin-auth 的 APPLE_SCRIPT_SRC */
export const APPLE_SCRIPT_SRC =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

export interface AppleAuthOptions {
  clientId: string;
  scope: string;
  redirectURI: string;
  usePopup: boolean;
}

/** 舊版 AppleSignin 的 authOptions */
export function appleAuthOptions(clientId: string, redirectURI: string): AppleAuthOptions {
  return { clientId, scope: "name email", redirectURI, usePopup: true };
}

/** NEXT_PUBLIC_APPLE_REDIRECT_URI 未設定時用目前來源的 /auth（舊版 ?? 語意：空字串不退回） */
export function appleRedirectUri(configured: string | undefined, origin: string): string {
  return configured ?? `${origin}/auth`;
}

export interface AppleSigninResponse {
  authorization?: { id_token?: string };
  user?: { name?: { firstName?: string; lastName?: string } };
}

/** Apple 只在首次授權回傳姓名：姓在前、名在後直接相連 */
export function buildAppleUserName(user?: AppleSigninResponse["user"]): string | undefined {
  if (!user?.name) return undefined;
  const { firstName, lastName } = user.name;
  const joined = [lastName, firstName].filter(Boolean).join("");
  return joined || undefined;
}

/** 舊版 AppleSignInButton 的 onSuccess（disabled 為點擊當下的值） */
export function appleResponseHandler(handlers: {
  disabled: boolean;
  onSuccess: (idToken: string, userName?: string) => void;
  onError?: (message?: string) => void;
}): (response: AppleSigninResponse) => void {
  return (response) => {
    if (handlers.disabled) return;
    const idToken = response.authorization?.id_token;
    if (!idToken) {
      handlers.onError?.("Apple 未回傳授權，請重試");
      return;
    }
    handlers.onSuccess(idToken, buildAppleUserName(response.user));
  };
}

/** 舊版 AppleSignInButton 的 onError：使用者自己關掉彈窗不算錯誤 */
export function appleErrorHandler(onError?: (message?: string) => void): (err: unknown) => void {
  return (err) => {
    const code = (err as { error?: string } | null)?.error;
    if (code === "popup_closed_by_user") return;
    onError?.();
  };
}

type WaitOptions = { pollFrequency?: number; retries?: number; parent?: object };

/** react-apple-signin-auth 的 waitForVar：每 pollFrequency 毫秒檢查一次，最多 retries 次，等不到回 undefined */
export function waitForVar(name: string, opts: WaitOptions = {}): Promise<unknown> {
  const { pollFrequency = 1000, retries = 100, parent = globalThis } = opts;
  if (parent && Object.prototype.hasOwnProperty.call(parent, name)) {
    return Promise.resolve((parent as Record<string, unknown>)[name]);
  }
  if (!retries) return Promise.resolve(undefined);
  return new Promise((resolve) => setTimeout(resolve, pollFrequency)).then(() =>
    waitForVar(name, { pollFrequency, retries: retries - 1, parent }),
  );
}

interface AppleIdGlobal {
  auth: { init: (options: AppleAuthOptions) => void; signIn: () => Promise<AppleSigninResponse> };
}

/**
 * react-apple-signin-auth 的 appleAuthHelpers.signIn（usePopup 版本）：等 SDK 的 AppleID 出現 → init → signIn()，
 * 成功交 onSuccess、任何錯誤（含 SDK 一直沒載入）交 onError。
 */
export function appleSignIn(args: {
  authOptions: AppleAuthOptions;
  onSuccess: (response: AppleSigninResponse) => void;
  onError: (err: unknown) => void;
  parent?: object;
  wait?: Omit<WaitOptions, "parent">;
}): Promise<AppleSigninResponse | null> {
  const parent = (args.parent ?? globalThis) as { AppleID?: AppleIdGlobal };
  return waitForVar("AppleID", { ...args.wait, parent })
    .then(() => {
      if (!parent.AppleID) console.error(new Error("Error loading apple script"));
      (parent.AppleID as AppleIdGlobal).auth.init(args.authOptions);
      return (parent.AppleID as AppleIdGlobal).auth
        .signIn()
        .then((response) => {
          args.onSuccess(response);
          return response;
        })
        .catch((err: unknown) => {
          args.onError(err);
          return null;
        });
    })
    .catch((err: unknown) => {
      args.onError(err);
      return null;
    });
}

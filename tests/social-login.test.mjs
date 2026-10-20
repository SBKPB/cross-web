import assert from "node:assert/strict";
import test from "node:test";
import {
  APPLE_SCRIPT_SRC,
  GOOGLE_BUTTON_HEIGHT,
  GOOGLE_BUTTON_OPTIONS,
  GSI_SCRIPT_SRC,
  appleAuthOptions,
  appleErrorHandler,
  appleRedirectUri,
  appleResponseHandler,
  appleSignIn,
  buildAppleUserName,
  googleCredentialCallback,
  googleInitOptions,
  isBookingNext,
  safeNextUrl,
  waitForVar,
} from "../src/lib/auth/social-login.ts";

// 移植自舊版 app/auth/page.tsx 與 components/auth/social-login-buttons.tsx（@react-oauth/google 1.x、
// react-apple-signin-auth 1.2.1 的實際呼叫參數）。

test("/auth 的 next：只接受站內絕對路徑，其餘一律回 /member（舊版開放轉址防護）", () => {
  assert.equal(safeNextUrl(null), "/member");
  assert.equal(safeNextUrl(""), "/member");
  assert.equal(safeNextUrl("/booking/abc"), "/booking/abc");
  assert.equal(safeNextUrl("/member/favorites?x=1#y"), "/member/favorites?x=1#y");
  assert.equal(safeNextUrl("//evil.example"), "/member");
  assert.equal(safeNextUrl("https://evil.example"), "/member");
  assert.equal(safeNextUrl("member"), "/member");
  assert.equal(safeNextUrl("/\\evil.example"), "/member");
  assert.equal(safeNextUrl("/a\nb"), "/member");
  assert.equal(safeNextUrl("/a\x00b"), "/member");
  assert.equal(safeNextUrl("/a\x1fb"), "/member");
});

test("next 指向預約頁時顯示「返回選擇時段」與預約版說明", () => {
  assert.equal(isBookingNext("/booking/abc"), true);
  assert.equal(isBookingNext("/booking"), false);
  assert.equal(isBookingNext("/member"), false);
});

test("Google：與 @react-oauth/google GoogleLogin 相同的 script、initialize 與 renderButton 參數", () => {
  assert.equal(GSI_SCRIPT_SRC, "https://accounts.google.com/gsi/client");
  assert.deepEqual(GOOGLE_BUTTON_OPTIONS, {
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
  });
  // size="large" 的容器高度（containerHeightMap.large）
  assert.equal(GOOGLE_BUTTON_HEIGHT, 40);
  const callback = () => {};
  assert.deepEqual(googleInitOptions("cid.apps.googleusercontent.com", callback), {
    client_id: "cid.apps.googleusercontent.com",
    callback,
    login_hint: undefined,
  });
});

test("Google 回呼：有 credential 交給 onSuccess；沒有 → onError；停用中（登入進行中）不送", () => {
  const calls = [];
  let disabled = false;
  const cb = googleCredentialCallback({
    onSuccess: (token) => calls.push(["success", token]),
    onError: () => calls.push(["error"]),
    isDisabled: () => disabled,
  });
  cb({ credential: "id-token-1", select_by: "btn" });
  cb({});
  cb(undefined);
  disabled = true;
  cb({ credential: "id-token-2" });
  assert.deepEqual(calls, [["success", "id-token-1"], ["error"], ["error"]]);
});

test("Apple：script、authOptions（usePopup）、redirectURI 預設為目前來源的 /auth", () => {
  assert.equal(APPLE_SCRIPT_SRC, "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js");
  assert.deepEqual(appleAuthOptions("com.twinhao.cross.web", "https://cross.twinhao.com/auth"), {
    clientId: "com.twinhao.cross.web",
    scope: "name email",
    redirectURI: "https://cross.twinhao.com/auth",
    usePopup: true,
  });
  assert.equal(appleRedirectUri(undefined, "https://preview.example"), "https://preview.example/auth");
  assert.equal(appleRedirectUri("https://cross.twinhao.com/auth", "https://preview.example"), "https://cross.twinhao.com/auth");
});

test("Apple 姓名：姓在前、名在後直接相連；沒有姓名回 undefined", () => {
  assert.equal(buildAppleUserName(undefined), undefined);
  assert.equal(buildAppleUserName({}), undefined);
  assert.equal(buildAppleUserName({ name: {} }), undefined);
  assert.equal(buildAppleUserName({ name: { firstName: "小明", lastName: "王" } }), "王小明");
  assert.equal(buildAppleUserName({ name: { firstName: "Ming" } }), "Ming");
  assert.equal(buildAppleUserName({ name: { lastName: "Wang" } }), "Wang");
});

test("Apple 回應：有 id_token 交給 onSuccess（含姓名）；沒有 → 「Apple 未回傳授權，請重試」；停用中略過", () => {
  const calls = [];
  const handlers = {
    onSuccess: (token, name) => calls.push(["success", token, name]),
    onError: (msg) => calls.push(["error", msg]),
  };
  appleResponseHandler({ ...handlers, disabled: false })({
    authorization: { id_token: "apple-1" },
    user: { name: { firstName: "小明", lastName: "王" } },
  });
  appleResponseHandler({ ...handlers, disabled: false })({ authorization: { id_token: "apple-2" } });
  appleResponseHandler({ ...handlers, disabled: false })({ authorization: {} });
  appleResponseHandler({ ...handlers, disabled: true })({ authorization: { id_token: "apple-3" } });
  assert.deepEqual(calls, [
    ["success", "apple-1", "王小明"],
    ["success", "apple-2", undefined],
    ["error", "Apple 未回傳授權，請重試"],
  ]);
});

test("Apple 錯誤：使用者關掉彈窗不顯示錯誤；其他錯誤呼叫 onError()（不帶訊息 → 頁面用預設文字）", () => {
  const calls = [];
  const handle = appleErrorHandler((msg) => calls.push(msg));
  handle({ error: "popup_closed_by_user" });
  handle({ error: "user_cancelled_authorize" });
  handle(new Error("boom"));
  handle(null);
  assert.deepEqual(calls, [undefined, undefined, undefined]);
});

test("waitForVar：已存在立即回傳；之後才出現則輪詢等到；重試用完回 undefined", async () => {
  const parent = { AppleID: { ok: 1 } };
  assert.deepEqual(await waitForVar("AppleID", { parent, pollFrequency: 1, retries: 3 }), { ok: 1 });

  const later = {};
  setTimeout(() => (later.AppleID = "late"), 5);
  assert.equal(await waitForVar("AppleID", { parent: later, pollFrequency: 2, retries: 50 }), "late");

  assert.equal(await waitForVar("AppleID", { parent: {}, pollFrequency: 1, retries: 3 }), undefined);
});

test("appleSignIn：等 AppleID 載入 → init(authOptions) → signIn()；成功交 onSuccess、失敗交 onError", async () => {
  const authOptions = appleAuthOptions("svc", "https://x.example/auth");
  const inits = [];
  const ok = { authorization: { id_token: "t" } };
  const parent = {
    AppleID: { auth: { init: (o) => inits.push(o), signIn: () => Promise.resolve(ok) } },
  };
  const results = [];
  await appleSignIn({
    authOptions,
    onSuccess: (r) => results.push(["success", r]),
    onError: (e) => results.push(["error", e]),
    parent,
    wait: { pollFrequency: 1, retries: 2 },
  });
  assert.deepEqual(inits, [authOptions]);
  assert.deepEqual(results, [["success", ok]]);

  const err = { error: "popup_closed_by_user" };
  parent.AppleID.auth.signIn = () => Promise.reject(err);
  results.length = 0;
  await appleSignIn({
    authOptions,
    onSuccess: (r) => results.push(["success", r]),
    onError: (e) => results.push(["error", e]),
    parent,
    wait: { pollFrequency: 1, retries: 2 },
  });
  assert.deepEqual(results, [["error", err]]);
});

test("appleSignIn：SDK 一直沒載入（被擋）→ onError 收到錯誤，不會卡住", async (t) => {
  t.mock.method(console, "error", () => {});
  const results = [];
  await appleSignIn({
    authOptions: appleAuthOptions("svc", "https://x.example/auth"),
    onSuccess: () => results.push("success"),
    onError: (e) => results.push(e instanceof Error ? "error" : e),
    parent: {},
    wait: { pollFrequency: 1, retries: 2 },
  });
  assert.deepEqual(results, ["error"]);
});

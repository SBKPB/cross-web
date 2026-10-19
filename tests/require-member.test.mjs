import assert from "node:assert/strict";
import { register } from "node:module";
import { beforeEach, test } from "node:test";

// requireMember(nextPath: () => string)：nextPath 在 $effect 內讀取，頁面參數改變（例如 /member/appointments/[id]）
// 時守衛會以新路徑重跑，對應舊版 useEffect 的 [nextPath] 依賴。用真正的 Svelte runes 執行（見 support/svelte-hooks.mjs）。
register("./support/svelte-hooks.mjs", import.meta.url);
const { mountRequireMember } = await import("./support/require-member-harness.svelte.js");
const { gotoCalls } = await import("./support/app-navigation.mjs");

const member = { id: "u1", email: "m@example.com", roles: ["patient"], facility_id: null };
const admin = { id: "u2", email: "a@example.com", roles: ["admin"], facility_id: null };

beforeEach(() => {
  gotoCalls.length = 0;
});

test("載入中不導向；確認未登入後導向 /auth?next=<目前頁>", () => {
  const h = mountRequireMember("/member/appointments/1");
  assert.deepEqual(gotoCalls, []);
  h.update((auth) => (auth.isLoading = false));
  assert.deepEqual(gotoCalls, [["/auth?next=%2Fmember%2Fappointments%2F1", { replaceState: true }]]);
  assert.equal(h.ready, false);
  h.destroy();
});

test("nextPath 改變時以新路徑重跑（舊版 useEffect 依賴 nextPath）", () => {
  const h = mountRequireMember("/member/appointments/1");
  h.update((auth) => (auth.isLoading = false));
  h.setPath("/member/appointments/2");
  assert.deepEqual(gotoCalls.map(([url]) => url), [
    "/auth?next=%2Fmember%2Fappointments%2F1",
    "/auth?next=%2Fmember%2Fappointments%2F2",
  ]);
  h.destroy();
});

test("後台帳號導回後台首頁，ready 為 false", () => {
  const h = mountRequireMember("/member");
  h.update((auth) => {
    auth.user = admin;
    auth.isLoading = false;
  });
  assert.deepEqual(gotoCalls, [["/admin/dashboard", { replaceState: true }]]);
  assert.equal(h.ready, false);
  h.destroy();
});

test("一般會員：不導向，ready 為 true", () => {
  const h = mountRequireMember("/member");
  h.update((auth) => {
    auth.user = member;
    auth.isLoading = false;
  });
  assert.deepEqual(gotoCalls, []);
  assert.equal(h.ready, true);
  h.destroy();
});

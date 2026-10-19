import assert from "node:assert/strict";
import test from "node:test";
import { api } from "../src/lib/api/client.ts";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("傳入的 fetch 會被使用，且不出現在送出的 RequestInit", async () => {
  const calls = [];
  const fake = async (url, init) => { calls.push([url, init]); return json({}); };
  await api.get("/api/v1/ping", { fetch: fake });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "/api/v1/ping");
  assert.equal("fetch" in calls[0][1], false);
});

test("並行三個 401 只呼叫一次 /auth/refresh", async (t) => {
  // 模擬瀏覽器：window（auth-events 用）與 localStorage（token 存放處）
  const store = new Map([["access_token", "old"], ["refresh_token", "r1"]]);
  const localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  Object.defineProperty(globalThis, "window", { value: new EventTarget(), configurable: true, writable: true });
  Object.defineProperty(globalThis, "localStorage", { value: localStorage, configurable: true, writable: true });
  t.after(() => { delete globalThis.window; delete globalThis.localStorage; });

  const refreshBodies = [];
  const authHeaders = [];
  const fake = async (url, init) => {
    if (url === "/api/v1/auth/refresh") {
      refreshBodies.push(JSON.parse(init.body));
      // 刻意延遲，讓三個 401 都在 refresh 進行中抵達
      await new Promise((r) => setTimeout(r, 20));
      return json({ access_token: "new", refresh_token: "r2" });
    }
    authHeaders.push(init.headers.Authorization);
    return init.headers.Authorization === "Bearer new" ? json({ path: url }) : json({ detail: "expired" }, 401);
  };

  const results = await Promise.all(
    ["/api/v1/a", "/api/v1/b", "/api/v1/c"].map((p) => api.get(p, { fetch: fake })),
  );

  assert.equal(refreshBodies.length, 1);
  assert.deepEqual(refreshBodies[0], { refresh_token: "r1" });
  assert.deepEqual(results, [{ path: "/api/v1/a" }, { path: "/api/v1/b" }, { path: "/api/v1/c" }]);
  assert.deepEqual(authHeaders, ["Bearer old", "Bearer old", "Bearer old", "Bearer new", "Bearer new", "Bearer new"]);
  assert.equal(store.get("access_token"), "new");
  assert.equal(store.get("refresh_token"), "r2");
});

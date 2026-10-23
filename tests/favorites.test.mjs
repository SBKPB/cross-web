import assert from "node:assert/strict";
import { register } from "node:module";
import { afterEach, beforeEach, test } from "node:test";

// 收藏狀態（移植自 use-favorites.ts）：模組級單一實例、只載入一次、樂觀更新與回滾，
// 以及 root layout 在使用者 id 變動時重置快取（舊版 AuthProvider 的 useEffect [user?.id]，防跨帳號外洩）。
// 用真正的 Svelte runes 執行（見 support/svelte-hooks.mjs）。
register("./support/svelte-hooks.mjs", import.meta.url);
const { mountFavorites } = await import("./support/favorites-harness.svelte.js");
const { resetFavoritesCache } = await import("../src/lib/hooks/favorites.svelte.ts");

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** 後端最小 clinic（transformClinic 需要的欄位） */
const clinic = (id) => ({ id, name: `診所 ${id}`, departments: [], hospital_level: "clinic" });

const tick = () => new Promise((r) => setTimeout(r, 0));

let calls;
let handler;
let mounted;

beforeEach(() => {
  // 模擬瀏覽器：window（auth-events）、localStorage（token）、全域 fetch（client 預設）
  const store = new Map([["access_token", "t"]]);
  globalThis.window = new EventTarget();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  calls = [];
  handler = async () => json([]);
  globalThis.fetch = async (url, init) => {
    calls.push(`${init.method} ${url}`);
    return handler(url, init);
  };
  resetFavoritesCache();
  mounted = [];
});

afterEach(async () => {
  for (const m of mounted) m.destroy();
  await tick();
  delete globalThis.window;
  delete globalThis.localStorage;
});

function mount(options) {
  const m = mountFavorites(options);
  mounted.push(m);
  return m;
}

test("多個元件共用同一實例：並行只發一次 GET /favorites，載入後 ready 且 isFavorite 正確", async () => {
  handler = async () => json([clinic("a"), clinic("b")]);
  const m = mount({ user: { id: "u1" }, consumers: 3 });
  assert.equal(m.favorites.ready, false);
  await tick();
  assert.deepEqual(calls, ["GET /api/v1/member/favorites"]);
  for (const s of m.stores) {
    assert.equal(s, m.favorites, "所有消費者拿到同一個實例");
    assert.equal(s.ready, true);
    assert.equal(s.isFavorite("a"), true);
    assert.equal(s.isFavorite("c"), false);
  }
});

test("未啟用（未登入／後台帳號）不發請求；啟用後才載入", async () => {
  const m = mount({ user: null, enabled: false });
  await tick();
  assert.deepEqual(calls, []);
  handler = async () => json([clinic("a")]);
  m.setEnabled(true);
  await tick();
  assert.deepEqual(calls, ["GET /api/v1/member/favorites"]);
  assert.equal(m.favorites.isFavorite("a"), true);
});

test("載入失敗維持空集合且 ready，不阻塞畫面", async () => {
  handler = async () => json({ detail: "boom" }, 500);
  const m = mount({ user: { id: "u1" } });
  await tick();
  await tick();
  assert.equal(m.favorites.ready, true);
  assert.equal(m.favorites.isFavorite("a"), false);
});

test("toggleFavorite 樂觀更新：請求送出前畫面已變，成功回傳切換後狀態", async () => {
  const m = mount({ user: { id: "u1" } });
  await tick();
  let release;
  handler = (url, init) =>
    init.method === "POST" ? new Promise((r) => (release = () => r(new Response(null, { status: 204 })))) : json([]);
  const pending = m.favorites.toggleFavorite("x");
  assert.equal(m.favorites.isFavorite("x"), true, "樂觀更新應立即生效");
  await tick();
  release();
  assert.equal(await pending, true);
  assert.ok(calls.includes("POST /api/v1/member/favorites/x"));

  handler = async () => new Response(null, { status: 204 });
  assert.equal(await m.favorites.toggleFavorite("x"), false);
  assert.equal(m.favorites.isFavorite("x"), false);
  assert.ok(calls.includes("DELETE /api/v1/member/favorites/x"));
});

test("toggleFavorite 失敗回滾並拋錯；401 回滾後回傳原狀態（過期流程由 client 處理）", async () => {
  const m = mount({ user: { id: "u1" } });
  await tick();
  handler = async () => json({ detail: "boom" }, 500);
  await assert.rejects(m.favorites.toggleFavorite("x"), { name: "ApiError", status: 500 });
  assert.equal(m.favorites.isFavorite("x"), false);

  handler = async () => json({ detail: "expired" }, 401);
  globalThis.localStorage.removeItem("refresh_token");
  assert.equal(await m.favorites.toggleFavorite("x"), false);
  assert.equal(m.favorites.isFavorite("x"), false);
});

test("root layout：使用者 id 變動（換帳號／登出）即重置收藏快取，避免上一位使用者的收藏殘留", async () => {
  handler = async () => json([clinic("a")]);
  const m = mount({ user: { id: "u1" } });
  await tick();
  assert.equal(m.favorites.isFavorite("a"), true);

  m.setUser({ id: "u2" });
  assert.equal(m.favorites.isFavorite("a"), false, "換帳號後不得看到上一位的收藏");
  assert.equal(m.favorites.ready, false);

  // 再次載入後登出
  handler = async () => json([clinic("b")]);
  m.setEnabled(false);
  m.setEnabled(true);
  await tick();
  assert.equal(m.favorites.isFavorite("b"), true);
  m.setUser(null);
  assert.equal(m.favorites.isFavorite("b"), false, "登出後清空");
});

test("root layout：同一位使用者換成新物件（例如 refreshUser）不重置，收藏不會消失", async () => {
  handler = async () => json([clinic("a")]);
  const m = mount({ user: { id: "u1" } });
  await tick();
  assert.equal(m.favorites.isFavorite("a"), true);
  m.setUser({ id: "u1" });
  assert.equal(m.favorites.isFavorite("a"), true);
  assert.equal(m.favorites.ready, true);
  assert.deepEqual(calls, ["GET /api/v1/member/favorites"], "不重新載入");
});

test("isFavorite 是響應式的：載入、切換、回滾、重置都會讓讀取它的 effect 重跑", async () => {
  handler = async () => json([clinic("x")]);
  const m = mount({ user: { id: "u1" }, watchId: "x" });
  const { flushSync } = await import("svelte");
  await tick();
  flushSync();
  assert.deepEqual(m.watched, [false, true], "載入後變 true");

  handler = async () => new Response(null, { status: 204 });
  await m.favorites.toggleFavorite("x");
  flushSync();
  assert.deepEqual(m.watched, [false, true, false], "取消收藏");

  handler = async () => json({ detail: "boom" }, 500);
  await assert.rejects(m.favorites.toggleFavorite("x"));
  flushSync();
  assert.deepEqual(m.watched, [false, true, false, true, false], "樂觀加入後回滾");

  handler = async () => new Response(null, { status: 204 });
  await m.favorites.toggleFavorite("x");
  flushSync();
  m.setUser({ id: "u2" });
  assert.deepEqual(m.watched.slice(-2), [true, false], "換帳號重置後變 false");
});

test("root layout 以 auth.user?.id 掛上 resetFavoritesOnUserChange（舊版 AuthProvider 行為）", async () => {
  const { readFile } = await import("node:fs/promises");
  const layout = await readFile(new URL("../src/routes/+layout.svelte", import.meta.url), "utf8");
  assert.match(layout, /import \{ resetFavoritesOnUserChange \} from "\#lib\/hooks\/favorites\.svelte\.ts";/);
  assert.match(layout, /resetFavoritesOnUserChange\(\(\) => auth\.user\?\.id\);/);
});

import assert from "node:assert/strict";
import test from "node:test";
import { createSmoothScrollPause, isHashOnlyNavigation } from "../src/lib/navigation/smooth-scroll.ts";

// 對應舊版 <html data-scroll-behavior="smooth">（Next 換頁捲動時暫時改成 auto，純 hash 變化除外）。
// root layout 在 beforeNavigate 呼叫；這裡用假的 navigation 物件驗證暫停／還原的時機。

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function nav(from, to, { willUnload = false } = {}) {
  const d = deferred();
  return {
    navigation: {
      from: from && { url: new URL(from, "https://cross.twinhao.com") },
      to: to && { url: new URL(to, "https://cross.twinhao.com") },
      willUnload,
      complete: d.promise,
    },
    ...d,
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

function setup() {
  const root = { style: { scrollBehavior: "" } };
  return { root, pause: createSmoothScrollPause(() => root) };
}

test("isHashOnlyNavigation：只有同 path + search 且目標帶 hash 才算", () => {
  const u = (s) => new URL(s, "https://cross.twinhao.com");
  assert.equal(isHashOnlyNavigation(u("/terms"), u("/terms#s6")), true);
  assert.equal(isHashOnlyNavigation(u("/terms#a"), u("/terms#b")), true);
  assert.equal(isHashOnlyNavigation(u("/terms?x=1"), u("/terms?x=1#a")), true);
  assert.equal(isHashOnlyNavigation(u("/terms"), u("/pricing#a")), false);
  assert.equal(isHashOnlyNavigation(u("/terms?x=1"), u("/terms?x=2#a")), false);
  assert.equal(isHashOnlyNavigation(u("/terms#a"), u("/terms")), false);
  assert.equal(isHashOnlyNavigation(u("/terms"), new URL("https://example.com/terms#a")), false);
});

test("換頁：導航期間暫停平滑捲動，完成後還原", async () => {
  const { root, pause } = setup();
  const n = nav("/terms", "/pricing");
  pause(n.navigation);
  assert.equal(root.style.scrollBehavior, "auto");
  await tick();
  assert.equal(root.style.scrollBehavior, "auto", "尚未完成前要維持 auto");
  n.resolve();
  await tick();
  assert.equal(root.style.scrollBehavior, "");
});

test("同 path 只改 search 也算換頁（會重新載入並捲回頂端）", async () => {
  const { root, pause } = setup();
  const n = nav("/search?q=a", "/search?q=b");
  pause(n.navigation);
  assert.equal(root.style.scrollBehavior, "auto");
  n.resolve();
  await tick();
  assert.equal(root.style.scrollBehavior, "");
});

test("純 hash 導航：不暫停，維持平滑捲動", () => {
  const { root, pause } = setup();
  pause(nav("/terms", "/terms#s6").navigation);
  assert.equal(root.style.scrollBehavior, "");
});

test("導航被取消（complete reject）也會還原，且不留未處理的 rejection", async () => {
  const { root, pause } = setup();
  const n = nav("/terms", "/pricing");
  pause(n.navigation);
  n.navigation.complete.catch(() => {}); // SvelteKit 自己也會掛 catch
  n.reject(new Error("navigation cancelled"));
  await tick();
  assert.equal(root.style.scrollBehavior, "");
});

test("前一個導航被新導航中止：新導航完成前維持 auto", async () => {
  const { root, pause } = setup();
  const a = nav("/terms", "/pricing");
  const b = nav("/terms", "/refund");
  pause(a.navigation);
  pause(b.navigation);
  a.navigation.complete.catch(() => {});
  a.reject(new Error("navigation aborted"));
  await tick();
  assert.equal(root.style.scrollBehavior, "auto", "b 還在進行中");
  b.resolve();
  await tick();
  assert.equal(root.style.scrollBehavior, "");
});

test("離開本站（willUnload）或沒有目標：不動 scroll-behavior（complete 永遠不會 settle）", () => {
  const { root, pause } = setup();
  pause(nav("/terms", "https://example.com/", { willUnload: true }).navigation);
  pause(nav("/terms", null, { willUnload: true }).navigation);
  assert.equal(root.style.scrollBehavior, "");
});

// 換頁若改走整頁載入（例如 SvelteKit 判斷目標要原生導航），beforeNavigate 已把 scroll-behavior 改成 auto、計數加一，
// 但 complete 永遠不會 settle；之後按上一頁從 bfcache 還原時頁面還是 auto，計數也卡住，之後的換頁再也還原不了。
// pageshow（event.persisted）時重置計數並還原平滑捲動。
const pageshow = (persisted) => Object.assign(new Event("pageshow"), { persisted });

test("bfcache 還原（pageshow persisted）：重置卡住的暫停，之後的換頁照常還原", async () => {
  const root = { style: { scrollBehavior: "" } };
  const win = new EventTarget();
  const pause = createSmoothScrollPause(() => root, win);
  // 頁面被整頁導航帶走：complete 永遠不 settle
  pause(nav("/terms", "/admin").navigation);
  assert.equal(root.style.scrollBehavior, "auto");

  // 一般 pageshow（首次載入，不是從 bfcache）不動
  win.dispatchEvent(pageshow(false));
  assert.equal(root.style.scrollBehavior, "auto");

  win.dispatchEvent(pageshow(true));
  assert.equal(root.style.scrollBehavior, "", "從 bfcache 回來恢復平滑捲動");

  // 計數已歸零：下一次換頁完成後要還原（沒重置的話計數停在 1，永遠是 auto）
  const n = nav("/terms", "/pricing");
  pause(n.navigation);
  assert.equal(root.style.scrollBehavior, "auto");
  n.resolve();
  await tick();
  assert.equal(root.style.scrollBehavior, "");
});

test("沒有傳入 window（SSR 期間建立）：不註冊 pageshow，照常運作", async () => {
  const { root, pause } = setup();
  const n = nav("/terms", "/pricing");
  pause(n.navigation);
  n.resolve();
  await tick();
  assert.equal(root.style.scrollBehavior, "");
});

test("bfcache 還原前的導航之後才 settle：不影響還原後進行中的換頁", async () => {
  const root = { style: { scrollBehavior: "" } };
  const win = new EventTarget();
  const pause = createSmoothScrollPause(() => root, win);
  const stale = nav("/terms", "/admin");
  pause(stale.navigation);
  win.dispatchEvent(pageshow(true));
  const b = nav("/terms", "/pricing");
  pause(b.navigation);
  stale.resolve();
  await tick();
  assert.equal(root.style.scrollBehavior, "auto", "還原前的導航不算在新的計數裡，b 還在進行中");
  b.resolve();
  await tick();
  assert.equal(root.style.scrollBehavior, "");
});

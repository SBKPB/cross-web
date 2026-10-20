import assert from "node:assert/strict";
import { register } from "node:module";
import { beforeEach, test } from "node:test";

// 頁籤可見才輪詢（移植自 use-poll-on-visible.ts）：每 intervalMs 觸發一次（僅在 document 可見時），
// 切回可見立即補一次；enabled=false 或卸載時清掉 timer 與 listener。用真正的 Svelte runes 執行。
register("./support/svelte-hooks.mjs", import.meta.url);
const { mountPoll } = await import("./support/poll-on-visible-harness.svelte.js");

let doc;
beforeEach(() => {
  doc = new EventTarget();
  doc.visibilityState = "visible";
  globalThis.document = doc;
});


test("啟用時每 15 秒輪詢一次；頁籤隱藏時跳過；切回可見立即補一次", (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  let polls = 0;
  const h = mountPoll(() => polls++, 15_000, true);
  assert.equal(polls, 0, "掛載當下不立即輪詢（舊版行為）");
  t.mock.timers.tick(15_000);
  assert.equal(polls, 1);
  doc.visibilityState = "hidden";
  doc.dispatchEvent(new Event("visibilitychange"));
  t.mock.timers.tick(15_000);
  assert.equal(polls, 1, "隱藏時不輪詢");
  doc.visibilityState = "visible";
  doc.dispatchEvent(new Event("visibilitychange"));
  assert.equal(polls, 2, "切回可見立即補一次");
  h.destroy();
  t.mock.timers.tick(60_000);
  doc.dispatchEvent(new Event("visibilitychange"));
  assert.equal(polls, 2, "卸載後不再輪詢、不再監聽");
});

test("enabled 變成 false 即停止；未啟用時不設 timer 也不監聽", (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  let polls = 0;
  const h = mountPoll(() => polls++, 1_000, false);
  t.mock.timers.tick(5_000);
  doc.dispatchEvent(new Event("visibilitychange"));
  assert.equal(polls, 0);
  h.setEnabled(true);
  t.mock.timers.tick(2_000);
  assert.equal(polls, 2);
  h.setEnabled(false);
  t.mock.timers.tick(5_000);
  doc.dispatchEvent(new Event("visibilitychange"));
  assert.equal(polls, 2);
  h.destroy();
});

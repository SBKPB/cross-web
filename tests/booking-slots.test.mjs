import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";

// 可預約時段的載入狀態（移植自舊版 booking-flow.tsx 的 loadSlots + slotsRequest ref）：
// 只採用最新一次請求的結果；effect 清除（換服務／人員、離開第 3 步）後，進行中的請求結果與 loading 結束都不再套用。
register("./support/svelte-hooks.mjs", import.meta.url);
const { AvailableSlots } = await import("../src/lib/booking/available-slots.svelte.ts");

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => ((resolve = res), (reject = rej)));
  return { promise, resolve, reject };
}
const flush = () => new Promise((r) => setTimeout(r, 0));
const day = (date) => ({ date, dayOfWeek: "一", dayNumber: 1, isToday: false, isAvailable: true, slots: [] });

test("初始：沒有日期、未載入、無錯誤", () => {
  const s = new AvailableSlots();
  assert.deepEqual(s.dates, []);
  assert.equal(s.isLoading, false);
  assert.equal(s.error, false);
});

test("載入中 → 成功：設定日期並結束 loading；重新載入時先清錯誤", async () => {
  const s = new AvailableSlots();
  s.error = true;
  const d = deferred();
  s.load(() => d.promise);
  assert.equal(s.isLoading, true);
  assert.equal(s.error, false);
  d.resolve([day("2026-10-21")]);
  await flush();
  assert.deepEqual(s.dates.map((x) => x.date), ["2026-10-21"]);
  assert.equal(s.isLoading, false);
});

test("失敗：顯示錯誤、清空日期、結束 loading", async (t) => {
  const errors = t.mock.method(console, "error", () => {});
  const s = new AvailableSlots();
  s.dates = [day("2026-10-21")];
  s.load(() => Promise.reject(new Error("500")));
  await flush();
  assert.equal(s.error, true);
  assert.deepEqual(s.dates, []);
  assert.equal(s.isLoading, false);
  assert.equal(errors.mock.callCount(), 1);
});

test("較早的請求晚回來不覆蓋較新的結果", async () => {
  const s = new AvailableSlots();
  const first = deferred();
  const second = deferred();
  s.load(() => first.promise);
  s.load(() => second.promise);
  second.resolve([day("2026-10-22")]);
  await flush();
  first.resolve([day("2026-10-21")]);
  await flush();
  assert.deepEqual(s.dates.map((x) => x.date), ["2026-10-22"]);
  assert.equal(s.isLoading, false);
});

test("cancel 之後進行中的請求不再套用（loading 也維持原狀，同舊版）", async (t) => {
  t.mock.method(console, "error", () => {});
  const s = new AvailableSlots();
  const d = deferred();
  s.load(() => d.promise);
  s.cancel();
  d.reject(new Error("late"));
  await flush();
  assert.equal(s.error, false);
  assert.equal(s.isLoading, true);
  assert.deepEqual(s.dates, []);
});

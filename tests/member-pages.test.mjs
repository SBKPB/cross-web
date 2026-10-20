import assert from "node:assert/strict";
import test from "node:test";
import {
  STATUS_HERO,
  STATUS_VARIANT,
  applyQueueStatus,
  formatFullDate,
  formatMemberSince,
  formatMonthDay,
  formatTime,
  formatWeekday,
  getInitials,
  groupMemberAppointments,
  memberDisplayName,
  queueFlags,
} from "../src/lib/member/appointments.ts";

// 移植自舊版 app/member/page.tsx 與 app/member/appointments/[id]/page.tsx 的純邏輯

const appt = (id, appointment_date, status, extra = {}) => ({
  id,
  facility_name: "測試診所",
  staff_name: null,
  appointment_date,
  appointment_time: "09:30:00",
  status,
  booking_number: `BK-${id}`,
  queue_number: null,
  check_in_time: null,
  ...extra,
});

test("預約分頁：全部新到舊；已預約（含已報到／看診中）舊到新；已完成新到舊；已取消含未到診、新到舊", () => {
  const list = [
    appt("a", "2026-10-20", "completed"),
    appt("b", "2026-10-25", "confirmed"),
    appt("c", "2026-10-22", "checked_in"),
    appt("d", "2026-10-18", "cancelled"),
    appt("e", "2026-10-23", "no_show"),
    appt("f", "2026-10-21", "in_progress"),
    appt("g", "2026-10-24", "completed"),
  ];
  const g = groupMemberAppointments(list);
  assert.deepEqual(g.all.map((x) => x.id), ["b", "g", "e", "c", "f", "a", "d"]);
  assert.deepEqual(g.confirmed.map((x) => x.id), ["f", "c", "b"]);
  assert.deepEqual(g.completed.map((x) => x.id), ["g", "a"]);
  assert.deepEqual(g.cancelled.map((x) => x.id), ["e", "d"]);
  // 不改動原陣列
  assert.deepEqual(list.map((x) => x.id), ["a", "b", "c", "d", "e", "f", "g"]);
});

test("日期與時間格式（以本地時區解析 YYYY-MM-DD，與舊版相同）", () => {
  assert.equal(formatMonthDay("2026-10-05"), "10/5");
  assert.equal(formatWeekday("2026-10-05"), "週一");
  assert.equal(formatWeekday("2026-10-04"), "週日");
  assert.equal(formatTime("09:30:00"), "09:30");
  assert.equal(formatFullDate("2026-10-05"), "2026 年 10 月 5 日（週一）");
  assert.equal(formatMemberSince("2026-03-15T12:00:00"), "2026/03");
});

test("頭像字：中文取最後一字；英文／email 取首字母大寫；空白回 U", () => {
  assert.equal(getInitials("王小明"), "明");
  assert.equal(getInitials("alice"), "A");
  assert.equal(getInitials("  bob  "), "B");
  assert.equal(getInitials("   "), "U");
  assert.equal(getInitials(""), "U");
});

test("會員顯示名稱：display_name → email 帳號 → 「會員」", () => {
  assert.equal(memberDisplayName({ display_name: "王小明", email: "x@example.com" }), "王小明");
  assert.equal(memberDisplayName({ display_name: null, email: "wang@example.com" }), "wang");
  assert.equal(memberDisplayName({ display_name: "", email: "" }), "會員");
  assert.equal(memberDisplayName(null), "會員");
});

test("狀態徽章與詳情頁 hero 底色對照", () => {
  assert.deepEqual(STATUS_VARIANT, {
    confirmed: "default",
    checked_in: "default",
    in_progress: "default",
    completed: "secondary",
    cancelled: "destructive",
    no_show: "outline",
  });
  assert.deepEqual(STATUS_HERO, {
    confirmed: "from-primary to-blue-700",
    checked_in: "from-teal-500 to-cyan-700",
    in_progress: "from-indigo-500 to-blue-700",
    completed: "from-emerald-500 to-teal-600",
    cancelled: "from-slate-500 to-slate-700",
    no_show: "from-amber-500 to-orange-600",
  });
});

test("叫號進度：今日且進行中才輪詢（首次失敗也繼續重試，院所未開通才停）；有開通才顯示進度卡", () => {
  const today = (d) => d === "2026-10-21";
  const a = appt("x", "2026-10-21", "confirmed");
  const qs = (over = {}) => ({ enabled: true, status: "checked_in", queue_number: 3, ...over });

  assert.deepEqual(queueFlags(null, null, today), { shouldPollQueue: false, showQueueCard: false });
  assert.deepEqual(queueFlags(a, null, today), { shouldPollQueue: true, showQueueCard: false });
  assert.deepEqual(queueFlags(a, qs(), today), { shouldPollQueue: true, showQueueCard: true });
  assert.deepEqual(queueFlags(a, qs({ enabled: false }), today), { shouldPollQueue: false, showQueueCard: false });
  // 進度卡看的是進度回應的狀態
  assert.deepEqual(queueFlags(a, qs({ status: "completed" }), today), { shouldPollQueue: true, showQueueCard: false });
  // 不是今天
  assert.deepEqual(queueFlags(appt("y", "2026-10-22", "confirmed"), qs(), today), {
    shouldPollQueue: false,
    showQueueCard: false,
  });
  // 預約本體已結束
  assert.deepEqual(queueFlags(appt("z", "2026-10-21", "completed"), qs(), today), {
    shouldPollQueue: false,
    showQueueCard: true,
  });
});

test("進度回應的狀態較新時回寫到預約本體；相同狀態保留原物件", () => {
  const a = appt("x", "2026-10-21", "confirmed");
  assert.equal(applyQueueStatus(null, { status: "checked_in" }), null);
  assert.equal(applyQueueStatus(a, { status: "confirmed" }), a);
  assert.deepEqual(applyQueueStatus(a, { status: "in_progress" }), { ...a, status: "in_progress" });
});

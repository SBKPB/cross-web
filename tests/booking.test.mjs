import assert from "node:assert/strict";
import test from "node:test";
import { bookingReducer, initialBookingState } from "../src/lib/booking/booking-reducer.ts";
import {
  bookingAuthPath,
  bookingSuccessPath,
  canProceed,
  groupDatesByMonth,
  groupServicesByCategory,
  groupSlotsByPeriod,
  loadBookingPage,
  nextButtonLabel,
  submitHint,
} from "../src/lib/booking/booking-flow.ts";
import {
  appleCalendarData,
  escapeIcsText,
  formatDateForCalendar,
  googleCalendarUrl,
  isAppleDevice,
} from "../src/lib/booking/calendar.ts";
import { patientSaveErrorMessage, pickDefaultPatient, sortPatients } from "../src/lib/patient.ts";
import { ApiError } from "../src/lib/api/client.ts";
import { NO_PREFERENCE_DOCTOR } from "../src/lib/constants/booking-constants.ts";

// 預約流程的純邏輯（移植自舊版 components/booking/booking-context.tsx、booking-flow.tsx、date-picker.tsx、
// time-slot-grid.tsx、service-list.tsx、calendar-buttons.tsx、app/booking/[clinic-id]/page.tsx 與
// components/patient/*）：預期值逐條對照舊版程式。

const service = { id: "s1", name: "一般門診", description: "", price: 150, duration_minutes: 30, category: "一般服務" };
const service2 = { ...service, id: "s2", name: "健檢" };
const doctor = { id: "d1", name: "王志明", title: "家醫科" };
const slot = { id: "2026-10-21-09:00", time: "09:00", period: "morning", isAvailable: true };

// ---------- booking-context reducer ----------

test("初始狀態：未選服務、不指定人員、第 1 步、備註空白且未同意", () => {
  assert.deepEqual(initialBookingState, {
    selection: { service: null, doctor: NO_PREFERENCE_DOCTOR, date: null, timeSlot: null },
    formData: { notes: "", privacyAccepted: false },
    currentStep: 1,
  });
});

test("選服務、選人員會清掉日期與時段；選日期清掉時段；選時段只改時段", () => {
  let s = { ...initialBookingState, selection: { ...initialBookingState.selection, date: "2026-10-21", timeSlot: slot } };
  s = bookingReducer(s, { type: "SET_SERVICE", payload: service });
  assert.deepEqual(s.selection, { service, doctor: NO_PREFERENCE_DOCTOR, date: null, timeSlot: null });
  s = bookingReducer({ ...s, selection: { ...s.selection, date: "2026-10-21", timeSlot: slot } }, { type: "SET_DOCTOR", payload: doctor });
  assert.deepEqual(s.selection, { service, doctor, date: null, timeSlot: null });
  s = bookingReducer({ ...s, selection: { ...s.selection, timeSlot: slot } }, { type: "SET_DATE", payload: "2026-10-22" });
  assert.deepEqual(s.selection, { service, doctor, date: "2026-10-22", timeSlot: null });
  s = bookingReducer(s, { type: "SET_TIME_SLOT", payload: slot });
  assert.deepEqual(s.selection, { service, doctor, date: "2026-10-22", timeSlot: slot });
});

test("選擇動作保留沒變的欄位的同一個物件（下游以參照判斷是否重抓時段）", () => {
  const s1 = bookingReducer(initialBookingState, { type: "SET_SERVICE", payload: service });
  const s2 = bookingReducer(s1, { type: "SET_DATE", payload: "2026-10-22" });
  assert.equal(s2.selection.service, s1.selection.service);
  assert.equal(s2.selection.doctor, s1.selection.doctor);
  assert.equal(s2.formData, s1.formData);
  assert.notEqual(s2.selection, s1.selection);
  assert.notEqual(s2, s1);
});

test("表單資料合併；步驟前後移動夾在 1～3；GO_TO_STEP 直接跳；RESET 回初始", () => {
  let s = bookingReducer(initialBookingState, { type: "SET_FORM_DATA", payload: { notes: "過敏" } });
  s = bookingReducer(s, { type: "SET_FORM_DATA", payload: { privacyAccepted: true } });
  assert.deepEqual(s.formData, { notes: "過敏", privacyAccepted: true });
  assert.equal(bookingReducer(s, { type: "PREV_STEP" }).currentStep, 1);
  s = bookingReducer(s, { type: "NEXT_STEP" });
  s = bookingReducer(s, { type: "NEXT_STEP" });
  assert.equal(s.currentStep, 3);
  assert.equal(bookingReducer(s, { type: "NEXT_STEP" }).currentStep, 3);
  assert.equal(bookingReducer(s, { type: "PREV_STEP" }).currentStep, 2);
  assert.equal(bookingReducer(s, { type: "GO_TO_STEP", payload: 1 }).currentStep, 1);
  assert.equal(bookingReducer(s, { type: "RESET" }), initialBookingState);
  assert.equal(bookingReducer(s, { type: "UNKNOWN" }), s);
});

test("RESTORE_SELECTION：以暫存選擇取代、表單回初始、直接到第 3 步", () => {
  const restored = { service, doctor, date: "2026-10-21", timeSlot: { ...slot, id: "restored", isAvailable: false } };
  const dirty = { ...initialBookingState, formData: { notes: "x", privacyAccepted: true }, currentStep: 2 };
  assert.deepEqual(bookingReducer(dirty, { type: "RESTORE_SELECTION", payload: restored }), {
    selection: restored,
    formData: { notes: "", privacyAccepted: false },
    currentStep: 3,
  });
});

// ---------- booking-flow 判斷 ----------

const base = {
  currentStep: 3,
  selection: { service, doctor, date: "2026-10-21", timeSlot: slot },
  privacyAccepted: true,
  hasPatient: true,
  validSlot: true,
  authLoading: false,
  isAuthenticated: true,
  isDemo: false,
};

test("能否下一步：第 1 步要選服務；第 2 步要有人員（含不指定）", () => {
  assert.equal(canProceed({ ...base, currentStep: 1, selection: { ...base.selection, service: null } }), false);
  assert.equal(canProceed({ ...base, currentStep: 1 }), true);
  assert.equal(canProceed({ ...base, currentStep: 2, selection: { ...base.selection, doctor: null } }), false);
  assert.equal(canProceed({ ...base, currentStep: 2, selection: { ...base.selection, doctor: NO_PREFERENCE_DOCTOR } }), true);
});

test("能否送出（第 3 步）：非示範、時段有效、登入狀態已確定；已登入還要有看診對象並同意條款", () => {
  assert.equal(canProceed(base), true);
  assert.equal(canProceed({ ...base, isDemo: true }), false);
  assert.equal(canProceed({ ...base, validSlot: false }), false);
  assert.equal(canProceed({ ...base, authLoading: true }), false);
  assert.equal(canProceed({ ...base, hasPatient: false }), false);
  assert.equal(canProceed({ ...base, privacyAccepted: false }), false);
  // 未登入：只要時段有效即可按「登入並繼續預約」
  assert.equal(canProceed({ ...base, isAuthenticated: false, hasPatient: false, privacyAccepted: false }), true);
  assert.equal(canProceed({ ...base, currentStep: 4 }), false);
});

test("下一步按鈕文字", () => {
  assert.equal(nextButtonLabel(1, false, false), "選擇人員");
  assert.equal(nextButtonLabel(2, true, true), "選擇時間");
  assert.equal(nextButtonLabel(3, true, true), "示範流程，不會建立預約");
  assert.equal(nextButtonLabel(3, true, false), "確認送出預約");
  assert.equal(nextButtonLabel(3, false, false), "登入並繼續預約");
  assert.equal(nextButtonLabel(4, false, false), "下一步");
});

test("選取摘要：服務・指定人員・（第 3 步）日期 時段；不指定人員不列出；什麼都沒選回 undefined", () => {
  assert.equal(submitHint(initialBookingState.selection, 1), undefined);
  assert.equal(submitHint({ ...base.selection, doctor: NO_PREFERENCE_DOCTOR }, 3), "一般門診・2026-10-21 09:00");
  assert.equal(submitHint(base.selection, 2), "一般門診・王志明");
  assert.equal(submitHint(base.selection, 3), "一般門診・王志明・2026-10-21 09:00");
  assert.equal(submitHint({ ...base.selection, timeSlot: null }, 3), "一般門診・王志明");
  assert.equal(submitHint({ ...base.selection, doctor: { id: "d2", name: "", title: "" } }, 1), "一般門診");
});

test("導向網址：成功頁帶 id 與預約編號（不編碼，同舊版）；登入頁帶 next", () => {
  assert.equal(bookingSuccessPath("c1", "a1", "B-001"), "/booking/c1/success?id=a1&number=B-001");
  assert.equal(bookingAuthPath("/booking/c1"), "/auth?next=%2Fbooking%2Fc1");
});

// ---------- date-picker / time-slot-grid / service-list 分組 ----------

const day = (date, extra = {}) => ({
  date,
  dayOfWeek: "一",
  dayNumber: Number(date.slice(8)),
  isToday: false,
  isAvailable: true,
  slots: [],
  ...extra,
});

test("日期依年月分組，標籤「2026年10月」（月份不補零），連續相同年月才併在一組", () => {
  const dates = [day("2026-10-30"), day("2026-10-31"), day("2026-11-01"), day("2026-10-15"), day("2027-01-02")];
  assert.deepEqual(
    groupDatesByMonth(dates).map((g) => [g.yearMonth, g.label, g.dates.map((d) => d.date)]),
    [
      ["2026-10", "2026年10月", ["2026-10-30", "2026-10-31"]],
      ["2026-11", "2026年11月", ["2026-11-01"]],
      ["2026-10", "2026年10月", ["2026-10-15"]],
      ["2027-01", "2027年1月", ["2027-01-02"]],
    ],
  );
  assert.deepEqual(groupDatesByMonth([]), []);
});

test("時段依上午／下午／晚間分組", () => {
  const slots = [
    { id: "a", time: "18:00", period: "evening", isAvailable: true },
    { id: "b", time: "09:00", period: "morning", isAvailable: false },
    { id: "c", time: "09:30", period: "morning", isAvailable: true },
  ];
  const groups = groupSlotsByPeriod(slots);
  assert.deepEqual(Object.keys(groups), ["morning", "afternoon", "evening"]);
  assert.deepEqual(groups.morning.map((s) => s.id), ["b", "c"]);
  assert.deepEqual(groups.afternoon, []);
  assert.deepEqual(groups.evening.map((s) => s.id), ["a"]);
});

test("服務依分類分組（空分類歸「其他」；分類順序同舊版 Object.keys，整數字樣的分類排最前）", () => {
  const services = [
    { ...service, id: "1", category: "一般服務" },
    { ...service, id: "2", category: "" },
    { ...service, id: "3", category: "一般服務" },
    { ...service, id: "4", category: "2024" },
  ];
  assert.deepEqual(
    groupServicesByCategory(services).map(([category, list]) => [category, list.map((s) => s.id)]),
    [
      ["2024", ["4"]],
      ["一般服務", ["1", "3"]],
      ["其他", ["2"]],
    ],
  );
});

// ---------- app/booking/[clinic-id]/page.tsx 的載入判斷 ----------

const config = { id: "c1", clinic_name: "測試診所", primary_color: "#1d4ed8", phone: null, address: null, online_booking_enabled: true, payment_type: "self_pay" };
const api = (overrides = {}) => ({
  getClinicConfig: async () => config,
  getServices: async () => [service],
  getDoctors: async () => [doctor],
  ...overrides,
});

test("載入成功：付款方式取自 config（缺值為 undefined）", async () => {
  assert.deepEqual(await loadBookingPage(api(), "c1"), {
    kind: "ok",
    clinicConfig: config,
    services: [service],
    doctors: [doctor],
    paymentType: "self_pay",
  });
  const noPayment = { ...config, payment_type: null };
  const r = await loadBookingPage(api({ getClinicConfig: async () => noPayment }), "c1");
  assert.equal(r.kind, "ok");
  assert.equal(r.paymentType, undefined);
});

test("任一請求失敗 → 伺服器異常；config 為空 → 404；未開通線上預約 → 導回診所頁", async (t) => {
  t.mock.method(console, "error", () => {});
  assert.deepEqual(await loadBookingPage(api({ getDoctors: async () => { throw new Error("x"); } }), "c1"), { kind: "error" });
  assert.deepEqual(await loadBookingPage(api({ getClinicConfig: async () => null }), "c1"), { kind: "notFound" });
  assert.deepEqual(
    await loadBookingPage(api({ getClinicConfig: async () => ({ ...config, online_booking_enabled: false }) }), "c1"),
    { kind: "redirect", to: "/clinic/c1" },
  );
  // 沒有這個欄位（undefined）不算未開通
  const r = await loadBookingPage(api({ getClinicConfig: async () => ({ ...config, online_booking_enabled: undefined }) }), "c1");
  assert.equal(r.kind, "ok");
});

// ---------- calendar-buttons ----------

const booking = {
  id: "a1",
  booking_number: "B20261021-001",
  status: "confirmed",
  clinic: { name: "康健診所", address: "台北市信義區市府路45號", phone: "02" },
  service: { name: "一般門診", duration_minutes: 30 },
  doctor: { name: "王志明", title: "家醫科" },
  appointment_datetime: "2026-10-21T09:00:00",
  patient_name: "測試",
};

test("行事曆時間格式：UTC、去掉 - : 與毫秒", () => {
  assert.equal(formatDateForCalendar(new Date("2026-10-21T01:00:00.000Z")), "20261021T010000Z");
});

test("ICS 文字跳脫反斜線、換行、逗號、分號", () => {
  assert.equal(escapeIcsText("a\\b\r\nc\nd,e;f"), "a\\\\b\\nc\\nd\\,e\\;f");
});

test("Google 日曆連結與舊版逐字相同", () => {
  const start = new Date(booking.appointment_datetime);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const expected =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent("一般門診 - 康健診所")}` +
    `&dates=${formatDateForCalendar(start)}/${formatDateForCalendar(end)}` +
    `&details=${encodeURIComponent("預約編號：B20261021-001\n服務項目：一般門診\n醫師：王志明")}` +
    `&location=${encodeURIComponent("台北市信義區市府路45號")}`;
  assert.equal(googleCalendarUrl(booking), expected);
  // 沒有醫師、沒有地址
  const url = googleCalendarUrl({ ...booking, doctor: null, clinic: { ...booking.clinic, address: null } });
  assert.ok(url.includes(`&details=${encodeURIComponent("預約編號：B20261021-001\n服務項目：一般門診")}&location=`));
  assert.ok(url.endsWith("&location="));
});

test("Apple 日曆 ICS：CRLF、UID／DTSTAMP／PRODID、文字跳脫", () => {
  const now = new Date("2026-10-20T08:00:00.000Z");
  const start = new Date(booking.appointment_datetime);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  assert.equal(
    appleCalendarData({ ...booking, clinic: { ...booking.clinic, name: "康健,診所" } }, now),
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Cross//Twinhao//ZH-TW",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:appointment-B20261021-001@cross.twinhao.com",
      "DTSTAMP:20261020T080000Z",
      `DTSTART:${formatDateForCalendar(start)}`,
      `DTEND:${formatDateForCalendar(end)}`,
      "SUMMARY:一般門診 - 康健\\,診所",
      "DESCRIPTION:預約編號：B20261021-001\\n服務項目：一般門診\\n醫師：王志明",
      "LOCATION:台北市信義區市府路45號",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n"),
  );
});

test("Apple 裝置判斷：iPhone／iPad／iPod、Macintosh、觸控 Mac；其他為否；沒有 navigator 為否", () => {
  assert.equal(isAppleDevice({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", maxTouchPoints: 5 }), true);
  assert.equal(isAppleDevice({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", maxTouchPoints: 0 }), true);
  assert.equal(isAppleDevice({ userAgent: "Mozilla/5.0 (Linux; Android 14)", maxTouchPoints: 5 }), false);
  assert.equal(isAppleDevice({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", maxTouchPoints: 0 }), false);
  assert.equal(isAppleDevice(undefined), false);
});

// ---------- patient-selector / new-patient-dialog ----------

const p = (id, relation) => ({ id, relation, name: id, identifier_type: "national_id", identifier_last4: "1234", birth_date: "1990-01-01", gender: "M", phone: null });

test("看診對象排序：本人排第一，其餘維持原順序", () => {
  assert.deepEqual(sortPatients([p("a", "child"), p("b", "self"), p("c", "spouse")]).map((x) => x.id), ["b", "a", "c"]);
});

test("預設看診對象：上次預約的 → 本人 → 第一位；空清單為 undefined", () => {
  const list = [p("a", "child"), p("b", "self"), p("c", "spouse")];
  assert.equal(pickDefaultPatient(list, "c").id, "c");
  assert.equal(pickDefaultPatient(list, "missing").id, "b");
  assert.equal(pickDefaultPatient(list, null).id, "b");
  assert.equal(pickDefaultPatient([p("a", "child"), p("c", "spouse")], undefined).id, "a");
  assert.equal(pickDefaultPatient([], "a"), undefined);
});

test("新增看診對象錯誤訊息：後端 detail／message 字串優先；含「已經是」改為固定文字；其他為預設", () => {
  assert.equal(patientSaveErrorMessage(new ApiError(400, "Bad", { detail: "最多只能新增 10 位看診對象" })), "最多只能新增 10 位看診對象");
  assert.equal(patientSaveErrorMessage(new ApiError(0, "Network Error", { message: "無法連線到伺服器" })), "無法連線到伺服器");
  assert.equal(patientSaveErrorMessage(new ApiError(409, "Conflict", { detail: "此身分證已經是看診對象" })), "此身分識別碼已存在");
  assert.equal(patientSaveErrorMessage(new ApiError(422, "Unprocessable", { detail: [{ msg: "x" }] })), "儲存失敗，請稍後再試");
  assert.equal(patientSaveErrorMessage(new ApiError(500, "Error", null)), "儲存失敗，請稍後再試");
  assert.equal(patientSaveErrorMessage(new Error("boom")), "儲存失敗，請稍後再試");
});

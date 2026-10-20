import assert from "node:assert/strict";
import test from "node:test";
import { restoreBookingDraft, saveBookingDraft } from "../src/lib/booking/booking-flow.ts";
import { formatAppointmentDateTime } from "../src/lib/booking/calendar.ts";
import { bookingDraftKey, encodeBookingDraft } from "../src/lib/booking-draft.ts";
import { canSubmitPatientForm, identifierErrorOnChange, patientSummary } from "../src/lib/patient.ts";

// 預約流程元件內的小邏輯（移植自舊版 booking-flow.tsx 的暫存還原／暫存、success-card.tsx 的日期格式、
// patient-selector.tsx 的看診對象摘要、new-patient-dialog.tsx 的證件即時驗證與送出鈕條件）。

const service = { id: "s1", name: "一般門診", description: "", price: 150, duration_minutes: 30, category: "一般服務" };
const doctor = { id: "d1", name: "王志明", title: "家醫科" };
const selection = { service, doctor, date: "2026-10-21", timeSlot: { id: "x", time: "09:00", period: "morning", isAvailable: true } };

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  const calls = [];
  return {
    calls,
    data,
    getItem: (k) => (calls.push(["get", k]), data.has(k) ? data.get(k) : null),
    setItem: (k, v) => (calls.push(["set", k]), data.set(k, String(v))),
    removeItem: (k) => (calls.push(["remove", k]), data.delete(k)),
  };
}

// ---------- 登入後回到原本選取的時段 ----------

test("還原暫存：讀出後立即刪除，回傳以現行服務／人員還原的選擇", () => {
  const key = bookingDraftKey("c1");
  const storage = memoryStorage({ [key]: encodeBookingDraft(selection) });
  const restored = restoreBookingDraft(() => storage, "c1", [service], [doctor]);
  assert.equal(restored.service, service);
  assert.equal(restored.doctor, doctor);
  assert.equal(restored.date, "2026-10-21");
  assert.equal(restored.timeSlot.time, "09:00");
  assert.equal(restored.timeSlot.isAvailable, false);
  assert.deepEqual(storage.calls, [["get", key], ["remove", key]]);
  assert.equal(storage.data.has(key), false);
});

test("還原暫存：沒有或無效的暫存回 null，但一樣刪除該鍵；只動自己院所的鍵", () => {
  const other = bookingDraftKey("c2");
  const storage = memoryStorage({ [other]: encodeBookingDraft(selection) });
  assert.equal(restoreBookingDraft(() => storage, "c1", [service], [doctor]), null);
  assert.deepEqual(storage.calls, [["get", bookingDraftKey("c1")], ["remove", bookingDraftKey("c1")]]);
  assert.equal(storage.data.has(other), true);
  const broken = memoryStorage({ [bookingDraftKey("c1")]: "{" });
  assert.equal(restoreBookingDraft(() => broken, "c1", [service], [doctor]), null);
  assert.equal(broken.data.size, 0);
});

test("還原暫存：瀏覽器停用儲存（取得 storage、讀、刪任一步丟錯）時回 null 不丟錯", () => {
  assert.equal(restoreBookingDraft(() => { throw new Error("SecurityError"); }, "c1", [service], [doctor]), null);
  const throwsOnGet = { getItem: () => { throw new Error("x"); }, removeItem: () => {} };
  assert.equal(restoreBookingDraft(() => throwsOnGet, "c1", [service], [doctor]), null);
  // 舊版：讀出並解析後才刪除，刪除丟錯就整段放棄（不還原）
  const throwsOnRemove = { getItem: () => encodeBookingDraft(selection), removeItem: () => { throw new Error("x"); } };
  assert.equal(restoreBookingDraft(() => throwsOnRemove, "c1", [service], [doctor]), null);
});

test("暫存選擇：寫入該院所的鍵；儲存不可用時靜默略過", () => {
  const storage = memoryStorage();
  saveBookingDraft(() => storage, "c1", selection, 1_000);
  assert.equal(storage.data.get(bookingDraftKey("c1")), encodeBookingDraft(selection, 1_000));
  assert.doesNotThrow(() => saveBookingDraft(() => { throw new Error("SecurityError"); }, "c1", selection));
  assert.doesNotThrow(() =>
    saveBookingDraft(() => ({ setItem: () => { throw new Error("QuotaExceededError"); } }), "c1", selection),
  );
});

// ---------- success-card 的日期時間 ----------

test("預約成功卡的日期與時間：zh-TW 長日期含星期、24 小時制時:分", () => {
  assert.deepEqual(formatAppointmentDateTime("2026-10-21T09:05:00"), {
    date: new Date("2026-10-21T09:05:00").toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }),
    time: new Date("2026-10-21T09:05:00").toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  });
  const { date, time } = formatAppointmentDateTime("2026-10-21T14:30:00");
  assert.equal(date, "2026年10月21日星期三");
  assert.equal(time, "14:30");
});

// ---------- patient-selector 的看診對象摘要 ----------

const patient = {
  id: "p1",
  user_id: "u1",
  name: "王小明",
  identifier_type: "national_id",
  identifier_last4: "6789",
  birth_date: "1990-01-02",
  gender: "M",
  phone: null,
  relation: "self",
  is_active: true,
};

test("看診對象摘要：證件類型 ****末四碼 · 生日 · 性別（M 為男，其餘為女）", () => {
  assert.equal(patientSummary(patient), "身分證 ****6789 · 1990-01-02 · 男");
  assert.equal(patientSummary({ ...patient, identifier_type: "passport", gender: "F" }), "護照 ****6789 · 1990-01-02 · 女");
  assert.equal(patientSummary({ ...patient, identifier_type: "arc", gender: "other" }), "居留證 ****6789 · 1990-01-02 · 女");
  // 舊版 JSX 對 undefined／null 不輸出文字
  assert.equal(patientSummary({ ...patient, identifier_type: "unknown", identifier_last4: null }), " **** · 1990-01-02 · 男");
});

// ---------- new-patient-dialog ----------

test("證件號碼即時驗證：未滿 6 碼不提示；6 碼以上依類型驗證", () => {
  assert.equal(identifierErrorOnChange("national_id", "A1234"), null);
  assert.equal(identifierErrorOnChange("national_id", "  A1234  "), null);
  assert.equal(identifierErrorOnChange("national_id", "A123456789"), null);
  assert.equal(identifierErrorOnChange("national_id", "A123456788"), "身分證字號格式錯誤或檢查碼不正確");
  assert.equal(identifierErrorOnChange("arc", "A12345"), "居留證統一證號格式錯誤或檢查碼不正確");
  assert.equal(identifierErrorOnChange("passport", "AB1234"), null);
  assert.equal(identifierErrorOnChange("passport", "AB-123"), "護照號碼格式錯誤（限 6-20 碼英數字）");
});

const form = { isSubmitting: false, isEdit: false, name: "王小明", identifierValue: "A123456789", birthDate: "1990-01-02", gender: "M", phone: "0912345678" };

test("新增看診對象送出鈕：送出中、姓名／證件／手機空白（僅空白也算）、未填生日或性別時停用；編輯不需證件", () => {
  assert.equal(canSubmitPatientForm(form), true);
  assert.equal(canSubmitPatientForm({ ...form, isSubmitting: true }), false);
  assert.equal(canSubmitPatientForm({ ...form, name: "  " }), false);
  assert.equal(canSubmitPatientForm({ ...form, identifierValue: " " }), false);
  assert.equal(canSubmitPatientForm({ ...form, birthDate: "" }), false);
  assert.equal(canSubmitPatientForm({ ...form, gender: "" }), false);
  assert.equal(canSubmitPatientForm({ ...form, phone: "   " }), false);
  assert.equal(canSubmitPatientForm({ ...form, isEdit: true, identifierValue: "" }), true);
});

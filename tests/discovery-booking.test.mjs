import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_CLINIC_ID, isDemoClinic, matchesClinicSearch } from "../src/lib/clinic-discovery.ts";
import { availableSlotForSelection, bookingDraftKey, decodeBookingDraft, encodeBookingDraft } from "../src/lib/booking-draft.ts";

const clinic = {
  id: "clinic-a", clinic_name: "安心診所", address: "臺北市信義區",
  departments: ["family_medicine"],
  members: [{ name: "王志明", specialties: ["預防保健"] }],
};
const labels = { family_medicine: "家醫科" };

test("可搜尋醫師、專長、分類，並正規化台／臺與空白", () => {
  for (const query of ["王志明", "預防保健", "家醫科", " 台北 王志明 ", "安心"])
    assert.equal(matchesClinicSearch(clinic, query, labels), true, query);
  assert.equal(matchesClinicSearch(clinic, "高雄 王志明", labels), false);
  assert.equal(matchesClinicSearch(clinic, "頭痛", labels), false);
  assert.equal(matchesClinicSearch(clinic, "   ", labels), true);
  assert.equal(matchesClinicSearch({ ...clinic, members: undefined, address: null }, "王志明", labels), false);
});

test("只排除明確指定的示範院所", () => {
  assert.equal(isDemoClinic(DEMO_CLINIC_ID), true);
  assert.equal(isDemoClinic("clinic-a"), false);
});

const service = { id: "service-a", name: "一般門診", price: 150, description: "", duration_minutes: 30, category: "一般" };
const doctor = { id: "doctor-a", name: "測試醫師", title: "家醫科" };
const selection = { service, doctor, date: "2026-09-20", timeSlot: { id: "slot-old", time: "09:00", period: "morning", isAvailable: true } };
const savedAt = 1_000_000;

test("暫存只包含選擇，不含個資，返回時以現行服務、人員資料還原", () => {
  const raw = encodeBookingDraft(selection, savedAt);
  assert.deepEqual(Object.keys(JSON.parse(raw)).sort(), ["date", "doctorId", "savedAt", "serviceId", "time"]);
  const restored = decodeBookingDraft(raw, [{ ...service, price: 200 }], [doctor], savedAt + 1000);
  assert.equal(restored.service.price, 200);
  assert.equal(restored.timeSlot.isAvailable, false);
  assert.equal(restored.timeSlot.time, "09:00");
  assert.notEqual(bookingDraftKey("clinic-a"), bookingDraftKey("clinic-b"));
  const noPreference = decodeBookingDraft(encodeBookingDraft({ ...selection, doctor: { id: null } }, savedAt), [service], [], savedAt);
  assert.equal(noPreference.doctor.id, null);
});

test("拒絕過期、毀損、已下架的服務／人員與不合法的時間", () => {
  const raw = encodeBookingDraft(selection, savedAt);
  assert.equal(decodeBookingDraft(raw, [service], [doctor], savedAt + 30 * 60 * 1000 + 1), null);
  assert.equal(decodeBookingDraft(raw, [service], [doctor], savedAt - 1), null);
  assert.equal(decodeBookingDraft(raw, [], [doctor], savedAt), null);
  assert.equal(decodeBookingDraft(raw, [service], [], savedAt), null);
  for (const input of [null, "{", "null", "[]", JSON.stringify({ ...JSON.parse(raw), time: "25:99" })])
    assert.equal(decodeBookingDraft(input, [service], [doctor], savedAt), null);
});

test("暫存時段須通過最新名額核對，額滿或日期關閉不可送出", () => {
  const dates = [{ date: selection.date, isAvailable: true, slots: [{ ...selection.timeSlot, id: "slot-new" }] }];
  assert.equal(availableSlotForSelection(dates, selection).id, "slot-new");
  assert.equal(availableSlotForSelection([{ ...dates[0], isAvailable: false }], selection), undefined);
  assert.equal(availableSlotForSelection([{ ...dates[0], slots: [{ ...selection.timeSlot, isAvailable: false }] }], selection), undefined);
  assert.equal(availableSlotForSelection([], selection), undefined);
});

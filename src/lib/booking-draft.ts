import type { BookableDate, BookingSelection, DoctorOption, ServiceOption } from "@/types/booking";

const MAX_AGE = 30 * 60 * 1000;

export function bookingDraftKey(clinicId: string): string {
  return `cross:booking-draft:${clinicId}`;
}

export function availableSlotForSelection(dates: BookableDate[], selection: BookingSelection) {
  return dates.find((date) => date.date === selection.date && date.isAvailable)
    ?.slots.find((slot) => slot.time === selection.timeSlot?.time && slot.isAvailable);
}

/** 僅暫存服務與時段；不保存看診對象、聯絡資料、備註或同意狀態。 */
export function encodeBookingDraft(selection: BookingSelection, now = Date.now()): string {
  return JSON.stringify({
    savedAt: now,
    serviceId: selection.service?.id,
    doctorId: selection.doctor?.id ?? null,
    date: selection.date,
    time: selection.timeSlot?.time,
  });
}

export function decodeBookingDraft(raw: string | null, services: ServiceOption[], doctors: DoctorOption[], now = Date.now()): BookingSelection | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw);
    if (!draft || typeof draft.savedAt !== "number" || draft.savedAt > now || now - draft.savedAt > MAX_AGE) return null;
    const service = services.find((item) => item.id === draft.serviceId);
    const doctor = draft.doctorId === null ? { id: null, name: "不指定", title: "由院所安排" } : doctors.find((item) => item.id === draft.doctorId);
    if (!service || !doctor || typeof draft.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || typeof draft.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) return null;
    // 回來後須重新查詢實際名額，暫存資料本身不能授權送出預約。
    return { service, doctor, date: draft.date, timeSlot: { id: "restored", time: draft.time, period: "morning", isAvailable: false } };
  } catch {
    return null;
  }
}

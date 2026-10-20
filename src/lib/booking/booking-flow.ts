import type {
  BookableDate,
  BookingSelection,
  ClinicConfig,
  DoctorOption,
  ServiceOption,
  TimeOfDay,
  TimeSlot,
} from "../types/booking.ts";
import type { PaymentType } from "../types/clinic.ts";
import { bookingDraftKey, decodeBookingDraft, encodeBookingDraft } from "../booking-draft.ts";

// 預約流程的純邏輯，移植自舊版：
// - app/booking/[clinic-id]/page.tsx 的 loadBookingData 與 notFound / redirect 判斷 → loadBookingPage
// - components/booking/booking-flow.tsx 的 canProceed / nextButtonLabel / submitHint 與兩個導向網址
// - date-picker.tsx、time-slot-grid.tsx、service-list.tsx 的分組
// 相對路徑 import：node --test 可直接載入本檔。

// ---------- 頁面資料 ----------

export type BookingPageResult =
  | { kind: "error" }
  | { kind: "notFound" }
  | { kind: "redirect"; to: string }
  | {
      kind: "ok";
      clinicConfig: ClinicConfig;
      services: ServiceOption[];
      doctors: DoctorOption[];
      /** 院所付款方式（健保 / 自費 / 兩者）；服務的健保 badge 依此 gating */
      paymentType?: PaymentType;
    };

export interface BookingPageApi {
  getClinicConfig: (clinicId: string) => Promise<ClinicConfig | null>;
  getServices: (clinicId: string) => Promise<ServiceOption[]>;
  getDoctors: (clinicId: string) => Promise<DoctorOption[]>;
}

/**
 * 載入預約頁資料並決定要顯示什麼（舊版 server component 的順序）：
 * 任一請求失敗 → 伺服器異常（BookingError）；config 為空 → 404；未開通線上預約 → 導回院所頁（顯示現場 / 電話預約）。
 */
export async function loadBookingPage(api: BookingPageApi, clinicId: string): Promise<BookingPageResult> {
  let clinicConfig: ClinicConfig | null;
  let services: ServiceOption[];
  let doctors: DoctorOption[];
  try {
    [clinicConfig, services, doctors] = await Promise.all([
      api.getClinicConfig(clinicId),
      api.getServices(clinicId),
      api.getDoctors(clinicId),
    ]);
  } catch (error) {
    console.error("Failed to load booking data:", error);
    return { kind: "error" };
  }
  if (!clinicConfig) return { kind: "notFound" };
  // 線上預約為付費功能：未開通的院所導回院所頁（顯示現場 / 電話預約）
  if (clinicConfig.online_booking_enabled === false) return { kind: "redirect", to: `/clinic/${clinicId}` };
  // payment_type 由 config 端點直接帶出；缺值維持 undefined＝下游視為 nhi
  const paymentType = clinicConfig.payment_type ?? undefined;
  return { kind: "ok", clinicConfig, services, doctors, paymentType };
}

// ---------- 步驟判斷 ----------

export interface ProceedInput {
  currentStep: number;
  selection: BookingSelection;
  privacyAccepted: boolean;
  /** 已選看診對象（舊版 selectedPatient !== null） */
  hasPatient: boolean;
  /** 選取的時段在最新名額中仍可預約，且不在載入中、沒有錯誤 */
  validSlot: boolean;
  authLoading: boolean;
  isAuthenticated: boolean;
  isDemo: boolean;
}

/** 判斷是否可以進入下一步（第 3 步為送出／登入） */
export function canProceed(input: ProceedInput): boolean {
  switch (input.currentStep) {
    case 1:
      return input.selection.service !== null;
    case 2:
      return input.selection.doctor !== null;
    case 3:
      return (
        !input.isDemo &&
        input.validSlot &&
        !input.authLoading &&
        (!input.isAuthenticated || (input.hasPatient && input.privacyAccepted))
      );
    default:
      return false;
  }
}

/** 下一步按鈕文字 */
export function nextButtonLabel(currentStep: number, isAuthenticated: boolean, isDemo: boolean): string {
  switch (currentStep) {
    case 1:
      return "選擇人員";
    case 2:
      return "選擇時間";
    case 3:
      return isDemo ? "示範流程，不會建立預約" : isAuthenticated ? "確認送出預約" : "登入並繼續預約";
    default:
      return "下一步";
  }
}

/** sticky 按鈕上方的選取摘要提示 */
export function submitHint(selection: BookingSelection, currentStep: number): string | undefined {
  const parts: string[] = [];
  if (selection.service) parts.push(selection.service.name);
  if (selection.doctor?.name && selection.doctor.id !== null) {
    parts.push(selection.doctor.name);
  }
  if (currentStep === 3 && selection.date && selection.timeSlot) {
    parts.push(`${selection.date} ${selection.timeSlot.time}`);
  }
  return parts.length > 0 ? parts.join("・") : undefined;
}

// ---------- 登入前後的選擇暫存（sessionStorage） ----------

/** 取得瀏覽器儲存的 getter：在 try 內呼叫，停用儲存時存取 sessionStorage 本身就可能丟錯 */
export type DraftStorage = () => Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * 登入後回到原本選取的時段（舊版 BookingFlow 掛載時的 effect）：讀出並解析後立即刪除；
 * 任何一步丟錯（停用瀏覽器儲存）就不還原，仍可正常選擇及預約。重新取得名額後才允許送出。
 */
export function restoreBookingDraft(
  storage: DraftStorage,
  clinicId: string,
  services: ServiceOption[],
  doctors: DoctorOption[],
): BookingSelection | null {
  try {
    const store = storage();
    const key = bookingDraftKey(clinicId);
    const draft = decodeBookingDraft(store.getItem(key), services, doctors);
    store.removeItem(key);
    return draft;
  } catch {
    return null;
  }
}

/** 未登入按下送出前暫存服務與時段；無法暫存時，登入後仍可重新選取時段 */
export function saveBookingDraft(storage: DraftStorage, clinicId: string, selection: BookingSelection, now?: number): void {
  try {
    storage().setItem(bookingDraftKey(clinicId), encodeBookingDraft(selection, now));
  } catch {
    /* 無法暫存時，登入後仍可重新選取時段。 */
  }
}

/** 送出成功導向的成功頁（同舊版，不編碼參數） */
export function bookingSuccessPath(clinicId: string, id: string, bookingNumber: string): string {
  return `/booking/${clinicId}/success?id=${id}&number=${bookingNumber}`;
}

/** 未登入按下送出：登入後回到目前頁 */
export function bookingAuthPath(pathname: string): string {
  return `/auth?next=${encodeURIComponent(pathname)}`;
}

// ---------- 分組 ----------

export interface DateGroup {
  yearMonth: string;
  label: string;
  dates: BookableDate[];
}

/** 日期依月份分組（date-picker.tsx：只與前一筆比較，連續同年月才併組） */
export function groupDatesByMonth(dates: BookableDate[]): DateGroup[] {
  const groups: DateGroup[] = [];
  let currentYearMonth = "";

  for (const dateInfo of dates) {
    const [year, monthStr] = dateInfo.date.split("-");
    const yearMonth = `${year}-${monthStr}`;
    const label = `${year}年${parseInt(monthStr, 10)}月`;

    if (yearMonth !== currentYearMonth) {
      groups.push({ yearMonth, label, dates: [dateInfo] });
      currentYearMonth = yearMonth;
    } else {
      groups[groups.length - 1].dates.push(dateInfo);
    }
  }

  return groups;
}

/** 時段依上午／下午／晚間分組（time-slot-grid.tsx） */
export function groupSlotsByPeriod(slots: TimeSlot[]): Record<TimeOfDay, TimeSlot[]> {
  const groups: Record<TimeOfDay, TimeSlot[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };
  for (const slot of slots) groups[slot.period].push(slot);
  return groups;
}

/** 服務依分類分組（service-list.tsx）；分類順序沿用舊版 Object.keys 的物件鍵順序 */
export function groupServicesByCategory(services: ServiceOption[]): [string, ServiceOption[]][] {
  const groups: Record<string, ServiceOption[]> = {};
  for (const service of services) {
    const category = service.category || "其他";
    if (!groups[category]) groups[category] = [];
    groups[category].push(service);
  }
  return Object.keys(groups).map((category) => [category, groups[category]]);
}

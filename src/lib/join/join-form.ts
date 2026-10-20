import { JOIN_CATEGORIES } from "../constants/join-constants.ts";
import type { PaymentType } from "../types/clinic.ts";
import type { JoinApplication, JoinCategory } from "../types/join.ts";

// 夥伴加入表單（/join/apply）與驗證信設定密碼（/join/verify）的純邏輯，
// 移植自舊版 components/join/join-form.tsx 與 verify-form.tsx。相對路徑 import：node --test 可直接載入本檔。

export interface JoinFormState {
  category: JoinCategory;
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  team_size: string;
  service_categories: string[]; // 主要服務子類別 code（多選）
  payment_type: PaymentType;
  services: string;
  message: string;
  hp: string; // 蜜罐
}

export const INITIAL_JOIN_FORM: JoinFormState = {
  category: "clinic",
  business_name: "",
  contact_name: "",
  phone: "",
  email: "",
  city: "",
  address: "",
  team_size: "",
  service_categories: [],
  payment_type: "nhi",
  services: "",
  message: "",
  hp: "",
};

/** 區段標題：序號圓點 + 標題 */
export const JOIN_STEPS = [
  { title: "商家類型", hint: "你經營的是哪一種？" },
  { title: "基本資料", hint: "怎麼聯絡到你" },
  { title: "服務資訊", hint: "提供哪些服務（可略過）" },
];

/**
 * 驗證碼階段只活在記憶體：手機切去收信或不小心重整，回來就是空白表單、手上的碼無處可輸。
 * 把「已送出＋表單內容」存進 sessionStorage，重整後回到輸碼畫面（驗證碼與密碼仍需重新輸入，不落地）。
 */
export const JOIN_PENDING_STORAGE_KEY = "cross_join_pending";

/** 驗證信設定的後台密碼最短長度 */
export const MIN_PASSWORD = 8;

/**
 * 第二步（基本資料）還缺什麼：回傳欄位 id 與名稱（依畫面順序），供錯誤訊息與聚焦第一個問題欄位。
 * 第二步的 fieldset 到第三步會被 disabled，連帶跳過 type="email" 的原生檢查，所以 Email 格式在這裡擋。
 */
export function missingInStep1(form: JoinFormState): { id: string; label: string }[] {
  const miss: { id: string; label: string }[] = [];
  if (!form.business_name.trim()) miss.push({ id: "business_name", label: "商家名稱" });
  if (!form.contact_name.trim()) miss.push({ id: "contact_name", label: "聯絡人姓名" });
  if (!form.phone.trim()) miss.push({ id: "phone", label: "聯絡電話" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    miss.push({ id: "email", label: form.email.trim() ? "Email 格式" : "Email" });
  if (!form.city) miss.push({ id: "city", label: "縣市" });
  return miss;
}

/** POST /api/join 的內容 */
export function buildJoinPayload(form: JoinFormState): JoinApplication {
  const selected = JOIN_CATEGORIES.find((c) => c.value === form.category)!;
  return {
    category: form.category,
    facility_type: selected.facilityType,
    business_name: form.business_name.trim(),
    contact_name: form.contact_name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    city: form.city,
    address: form.address.trim() || undefined,
    team_size: form.team_size || undefined,
    message: form.message.trim() || undefined,
    hp: form.hp || undefined,
    // 主分類改為多選 service_categories（四大類皆送）
    service_categories: form.service_categories.length > 0 ? form.service_categories : undefined,
    // 補充說明自由文字（與多選並存）
    services: form.services.trim() || undefined,
    // 付費類型為診所專屬
    ...(form.category === "clinic" ? { payment_type: form.payment_type } : {}),
  };
}

/** 切換商家類型：清空已選服務子類別、並重設付款方式（避免殘留別類的 code / 付款別） */
export function selectJoinCategory(form: JoinFormState, value: JoinCategory): JoinFormState {
  return { ...form, category: value, service_categories: [], payment_type: "nhi" };
}

/** 切換單一服務子類別 code 的選取狀態 */
export function toggleServiceCategory(form: JoinFormState, code: string): JoinFormState {
  return {
    ...form,
    service_categories: form.service_categories.includes(code)
      ? form.service_categories.filter((c) => c !== code)
      : [...form.service_categories, code],
  };
}

/** 送出後同頁輸入驗證碼＋設定密碼：回傳錯誤訊息，通過回 null */
export function validateOtpForm(code: string, password: string, confirm: string): string | null {
  if (!/^\d{6}$/.test(code)) return "請輸入信中的 6 位數驗證碼";
  if (password.length < 8) return "密碼至少 8 碼";
  if (password !== confirm) return "兩次輸入的密碼不一致";
  return null;
}

/** verify-code 失敗訊息：只有字串才拿來當訊息；422 的 detail 是陣列，直接顯示會壞 */
export function verifyCodeErrorMessage(json: { detail?: unknown } | null): string {
  return typeof json?.detail === "string" ? json.detail : "驗證失敗，請稍後再試";
}

/** 驗證信連結設定密碼：回傳錯誤訊息，通過回 null */
export function validateVerifyPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD) return `密碼至少 ${MIN_PASSWORD} 碼`;
  if (password !== confirm) return "兩次輸入的密碼不一致";
  return null;
}

/** 讀回 sessionStorage 的「已送出」表單：有 email 才算；無痕視窗 / 壞資料當作全新填寫 */
export function restorePendingJoin(raw: string | null): JoinFormState | null {
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw) as { form?: JoinFormState } | null;
    return saved?.form?.email ? saved.form : null;
  } catch {
    return null;
  }
}

import { ApiError } from "./api/client.ts";
import { IDENTIFIER_ERROR_MESSAGES, IDENTIFIER_TYPE_LABELS } from "./constants/patient-constants.ts";
import type { IdentifierType, MemberPatientRead } from "./types/member-patient.ts";
import { validateIdentifier } from "./validation/tw-identifier.ts";

// 看診對象的純邏輯，移植自舊版 components/patient/patient-selector.tsx 與 new-patient-dialog.tsx。
// 相對路徑 import：node --test 可直接載入本檔。

/** 本人優先排在最前，其餘維持原順序 */
export function sortPatients(patients: MemberPatientRead[]): MemberPatientRead[] {
  return [...patients].sort((a, b) => {
    if (a.relation === "self" && b.relation !== "self") return -1;
    if (a.relation !== "self" && b.relation === "self") return 1;
    return 0;
  });
}

/** 預設看診對象：上次預約的 → 本人（self）→ 第一位 */
export function pickDefaultPatient(
  patients: MemberPatientRead[],
  lastBookedId: string | null | undefined,
): MemberPatientRead | undefined {
  return (
    patients.find((p) => p.id === lastBookedId) ||
    patients.find((p) => p.relation === "self") ||
    patients[0]
  );
}

/**
 * 新增／編輯看診對象失敗時的訊息：
 * 優先讀後端回傳的繁中錯誤訊息（ApiError.data.detail，如「最多只能新增 10 位看診對象」），
 * 避免顯示英文 "API Error: 400 ..."；網路錯誤則讀 data.message
 */
export function patientSaveErrorMessage(err: unknown): string {
  let msg = "儲存失敗，請稍後再試";
  if (err instanceof ApiError) {
    const data = err.data as { detail?: unknown; message?: unknown } | null;
    const detail = data?.detail ?? data?.message;
    if (typeof detail === "string") msg = detail;
  }
  return msg.includes("已經是") ? "此身分識別碼已存在" : msg;
}

/**
 * 看診對象清單每列的摘要「身分證 ****1234 · 1990-01-01 · 男」（patient-selector.tsx）。
 * 舊版 JSX 對 undefined／null 不輸出文字，故對不到的證件類型、缺末四碼都輸出空字串；性別只有 M 顯示男，其餘顯示女（同舊版）。
 */
export function patientSummary(patient: MemberPatientRead): string {
  const type = IDENTIFIER_TYPE_LABELS[patient.identifier_type as IdentifierType] ?? "";
  const last4 = patient.identifier_last4 ?? "";
  return `${type} ****${last4} · ${patient.birth_date} · ${patient.gender === "M" ? "男" : "女"}`;
}

/** 證件號碼輸入中的即時驗證（new-patient-dialog.tsx）：滿 6 碼（去頭尾空白）才驗證，未滿不提示 */
export function identifierErrorOnChange(type: IdentifierType, value: string): string | null {
  if (value.trim().length >= 6) {
    return validateIdentifier(type, value) ? null : IDENTIFIER_ERROR_MESSAGES[type];
  }
  return null;
}

/** 新增／編輯看診對象的送出鈕是否可按（new-patient-dialog.tsx）；編輯模式不改證件，不需證件號碼 */
export function canSubmitPatientForm(form: {
  isSubmitting: boolean;
  isEdit: boolean;
  name: string;
  identifierValue: string;
  birthDate: string;
  gender: string;
  phone: string;
}): boolean {
  return !(
    form.isSubmitting ||
    !form.name.trim() ||
    (!form.isEdit && !form.identifierValue.trim()) ||
    !form.birthDate ||
    !form.gender ||
    !form.phone.trim()
  );
}

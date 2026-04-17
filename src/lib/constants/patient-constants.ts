import type { IdentifierType } from "@/types/member-patient";

/** 患者關係顯示名稱 */
export const RELATION_LABELS: Record<string, string> = {
  self: "本人",
  spouse: "配偶",
  child: "子女",
  parent: "父母",
  other: "其他",
};

/** 身分識別類型顯示名稱 */
export const IDENTIFIER_TYPE_LABELS: Record<IdentifierType, string> = {
  national_id: "身分證",
  arc: "居留證",
  passport: "護照",
};

/** 身分識別類型 placeholder */
export const IDENTIFIER_PLACEHOLDERS: Record<IdentifierType, string> = {
  national_id: "A123456789",
  arc: "A800000014 或 AA00000009",
  passport: "護照號碼",
};

/** 身分識別驗證失敗的錯誤訊息 */
export const IDENTIFIER_ERROR_MESSAGES: Record<IdentifierType, string> = {
  national_id: "身分證字號格式錯誤或檢查碼不正確",
  arc: "居留證統一證號格式錯誤或檢查碼不正確",
  passport: "護照號碼格式錯誤（限 6-20 碼英數字）",
};

import { parseDate, type DateValue } from "@internationalized/date";

/** 日期以日曆日保存，不經過 UTC／本地時間轉換。 */
export function calendarDate(value: string | undefined): DateValue | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
  try {
    const date = parseDate(value);
    return date.toString() === value ? date : undefined;
  } catch {
    return;
  }
}

export function dateInputError(
  value: string,
  min?: string,
  max?: string,
  required = false,
): string {
  if (!value) return required ? "請選擇日期。" : "";
  const date = calendarDate(value);
  if (!date) return "請輸入有效日期（YYYY-MM-DD）。";
  const lower = calendarDate(min),
    upper = calendarDate(max);
  if (lower && date.compare(lower) < 0) return `請選擇 ${min} 或之後的日期。`;
  if (upper && date.compare(upper) > 0) return `請選擇 ${max} 或之前的日期。`;
  return "";
}

import type { TimeOfDay, Gender, DoctorOption } from "@/types/booking";

// 時段定義
export const TIME_PERIODS: Record<
  TimeOfDay,
  { label: string; startHour: number; endHour: number }
> = {
  morning: { label: "上午", startHour: 9, endHour: 12 },
  afternoon: { label: "下午", startHour: 13, endHour: 17 },
  evening: { label: "晚間", startHour: 18, endHour: 21 },
};

// 性別選項
export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "M", label: "男" },
  { value: "F", label: "女" },
];

// 不指定人員選項
export const NO_PREFERENCE_DOCTOR: DoctorOption = {
  id: null,
  name: "不指定",
  title: "由系統安排",
};

// 預約步驟
export const BOOKING_STEPS = [
  { step: 1, label: "選擇服務" },
  { step: 2, label: "選擇人員" },
  { step: 3, label: "選擇時間" },
] as const;

// 星期對照
export const WEEKDAY_MAP: Record<number, string> = {
  0: "日",
  1: "一",
  2: "二",
  3: "三",
  4: "四",
  5: "五",
  6: "六",
};

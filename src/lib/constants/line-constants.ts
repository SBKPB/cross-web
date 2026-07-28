export const LINE_BRAND_COLOR = "#06C755";
export const LINE_FRIEND_URL =
  process.env.NEXT_PUBLIC_LINE_FRIEND_URL || "";
export const LINE_OA_ID = process.env.NEXT_PUBLIC_LINE_OA_ID || "";
export const BINDING_STEPS = [
  { step: 1, title: "加入好友", description: "加入 LINE 官方帳號" },
  { step: 2, title: "綁定帳號", description: "輸入手機號碼完成綁定" },
  { step: 3, title: "查詢預約", description: "在聊天中查詢與取消預約" },
] as const;

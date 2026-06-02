import { NextRequest, NextResponse } from "next/server";

import {
  API_MEDICAL_DEPARTMENTS,
  PAYMENT_TYPES,
} from "@/lib/constants/clinic-constants";
import {
  JOIN_CATEGORIES,
  JOIN_CATEGORY_LABELS,
} from "@/lib/constants/join-constants";
import type { FacilityType } from "@/types/clinic";
import type { JoinApplication, JoinCategory } from "@/types/join";

// 夥伴加入申請接收端
//
// 後端目前沒有加入申請 endpoint，故由前端 route handler 直接接收並「以 email 通知營運團隊」。
// 通知採環境變數驅動，以 fetch 呼叫 Resend、無額外相依套件；未設定就略過，
// 此時仍會把申請寫進 server log（與後端 email_service 的 stub 行為一致），
// 確保表單在 dev / 尚未設定時也能正常送出成功。
//
// 可設定的環境變數（在 Vercel 專案設定）：
//   RESEND_API_KEY   + JOIN_NOTIFY_EMAIL → 以 Resend 寄 email 給營運信箱
//   JOIN_NOTIFY_FROM （選填，預設 onboarding@cross.twinhao.com）

const FACILITY_BY_CATEGORY = Object.fromEntries(
  JOIN_CATEGORIES.map((c) => [c.value, c.facilityType]),
) as Record<JoinCategory, FacilityType>;

const VALID_CATEGORIES: JoinCategory[] = JOIN_CATEGORIES.map((c) => c.value);

interface ValidationResult {
  ok: boolean;
  error?: string;
  data?: JoinApplication;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validate(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "格式錯誤" };
  }
  const body = raw as Record<string, unknown>;

  // 蜜罐：機器人填了隱藏欄位 → 假裝成功，不通知
  if (isNonEmptyString(body.hp)) {
    return { ok: false, error: "spam" };
  }

  if (!VALID_CATEGORIES.includes(body.category as JoinCategory)) {
    return { ok: false, error: "請選擇商家類型" };
  }
  if (!isNonEmptyString(body.business_name)) {
    return { ok: false, error: "請填寫商家名稱" };
  }
  if (!isNonEmptyString(body.contact_name)) {
    return { ok: false, error: "請填寫聯絡人姓名" };
  }
  if (!isNonEmptyString(body.phone)) {
    return { ok: false, error: "請填寫聯絡電話" };
  }
  if (
    !isNonEmptyString(body.email) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
  ) {
    return { ok: false, error: "請填寫正確的 Email" };
  }
  if (!isNonEmptyString(body.city)) {
    return { ok: false, error: "請選擇縣市" };
  }

  const category = body.category as JoinCategory;
  const data: JoinApplication = {
    category,
    facility_type: FACILITY_BY_CATEGORY[category],
    business_name: (body.business_name as string).trim(),
    contact_name: (body.contact_name as string).trim(),
    phone: (body.phone as string).trim(),
    email: (body.email as string).trim(),
    city: (body.city as string).trim(),
    address: isNonEmptyString(body.address)
      ? (body.address as string).trim()
      : undefined,
    team_size: isNonEmptyString(body.team_size)
      ? (body.team_size as string).trim()
      : undefined,
    medical_department: isNonEmptyString(body.medical_department)
      ? (body.medical_department as JoinApplication["medical_department"])
      : undefined,
    payment_type: isNonEmptyString(body.payment_type)
      ? (body.payment_type as JoinApplication["payment_type"])
      : undefined,
    services: isNonEmptyString(body.services)
      ? (body.services as string).trim()
      : undefined,
    message: isNonEmptyString(body.message)
      ? (body.message as string).trim()
      : undefined,
  };

  return { ok: true, data };
}

function buildNotificationText(data: JoinApplication): string {
  const lines = [
    "【Cross 新夥伴加入申請】",
    "",
    `商家類型：${JOIN_CATEGORY_LABELS[data.category]}`,
    `商家名稱：${data.business_name}`,
    `聯絡人：${data.contact_name}`,
    `電話：${data.phone}`,
    `Email：${data.email}`,
    `縣市：${data.city}`,
  ];
  if (data.address) lines.push(`地址：${data.address}`);
  if (data.team_size) lines.push(`規模：${data.team_size}`);
  if (data.medical_department) {
    lines.push(
      `主要科別：${API_MEDICAL_DEPARTMENTS[data.medical_department] ?? data.medical_department}`,
    );
  }
  if (data.payment_type) {
    lines.push(`付費類型：${PAYMENT_TYPES[data.payment_type] ?? data.payment_type}`);
  }
  if (data.services) lines.push(`主要服務：${data.services}`);
  if (data.message) lines.push(`備註：${data.message}`);
  return lines.join("\n");
}

async function sendEmail(text: string, businessName: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.JOIN_NOTIFY_EMAIL;
  if (!apiKey || !to) return;

  const from = process.env.JOIN_NOTIFY_FROM || "Cross <onboarding@cross.twinhao.com>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: to.split(",").map((s) => s.trim()),
        subject: `【Cross 夥伴加入申請】${businessName}`,
        text,
      }),
    });
    if (!res.ok) {
      console.error("[join] Resend email failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("[join] Resend email error", err);
  }
}

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "格式錯誤" }, { status: 400 });
  }

  const result = validate(raw);

  // 蜜罐命中：對機器人回 200，但不做任何通知
  if (!result.ok && result.error === "spam") {
    return NextResponse.json({ ok: true });
  }
  if (!result.ok || !result.data) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "格式錯誤" },
      { status: 400 },
    );
  }

  const data = result.data;
  const text = buildNotificationText(data);

  // server log fallback（永遠記錄，方便沒設定通知管道時也追得到申請）
  console.info("[join] new application", {
    category: data.category,
    business_name: data.business_name,
    contact_name: data.contact_name,
    phone: data.phone,
    email: data.email,
    city: data.city,
  });

  // 送出 email 通知，失敗不影響回應
  await sendEmail(text, data.business_name);

  return NextResponse.json({ ok: true });
}

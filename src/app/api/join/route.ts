import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

import {
  categoryLabel,
  serviceCategoriesApi,
} from "@/lib/api/service-categories";
import { PAYMENT_TYPES } from "@/lib/constants/clinic-constants";
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

  // service_categories：只收非空字串，過濾後若為空陣列則視為未填
  const serviceCategories = Array.isArray(body.service_categories)
    ? body.service_categories.filter(
        (c): c is string => typeof c === "string" && c.trim().length > 0,
      )
    : [];

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
    service_categories:
      serviceCategories.length > 0 ? serviceCategories : undefined,
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

async function buildNotificationText(data: JoinApplication): Promise<string> {
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
  if (data.service_categories && data.service_categories.length > 0) {
    // 以 service-categories taxonomy 把 code 攤成中文 label（Node server 可直接 await）
    const taxonomy = await serviceCategoriesApi.get();
    const labels = data.service_categories.map((code) =>
      categoryLabel(taxonomy, code),
    );
    lines.push(`主要服務：${labels.join("、")}`);
  }
  if (data.payment_type) {
    lines.push(`付費類型：${PAYMENT_TYPES[data.payment_type] ?? data.payment_type}`);
  }
  if (data.services) lines.push(`其他服務：${data.services}`);
  if (data.message) lines.push(`備註：${data.message}`);
  return lines.join("\n");
}

async function sendEmail(
  to: string,
  subject: string,
  text: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
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
        to: to.split(",").map((x) => x.trim()),
        subject,
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

/** 建立申請單，回傳驗證 token（供組驗證連結）。失敗時回傳可顯示給使用者的訊息。 */
async function createApplication(
  data: JoinApplication,
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const res = await fetch(`${BACKEND_URL}/api/v1/facility-applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      business_name: data.business_name,
      contact_name: data.contact_name,
      phone: data.phone,
      email: data.email,
      city: data.city,
      address: data.address,
      team_size: data.team_size,
      facility_type: FACILITY_BY_CATEGORY[data.category],
      payment_type: data.payment_type ?? "nhi",
      service_categories: data.service_categories ?? [],
      services: data.services,
      message: data.message,
    }),
  });
  if (res.ok) {
    const json = (await res.json()) as { verification_token: string };
    return { ok: true, token: json.verification_token };
  }
  // 後端已把「這個信箱已經有帳號」之類的訊息寫成可直接顯示的中文
  const detail = await res
    .json()
    .then((j: { detail?: string }) => j.detail)
    .catch(() => undefined);
  return { ok: false, error: detail ?? "送出失敗，請稍後再試" };
}

function verificationEmail(businessName: string, link: string): string {
  return [
    `${businessName} 您好，`,
    "",
    "感謝您申請加入 Cross。請點下面的連結驗證信箱並設定後台密碼：",
    link,
    "",
    "連結 72 小時內有效。",
    "",
    "設定完成後，我們會盡快審核您的申請；審核通過才會開通後台，屆時會再以此信箱通知您。",
    "",
    "如果這不是您本人的申請，請忽略這封信——在您設定密碼之前，不會有任何帳號被建立。",
  ].join("\n");
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

  // 先建立申請單。失敗（例如信箱已有帳號）要如實回報給使用者，
  // 不能像通知信那樣默默吞掉——否則對方會以為申請成功卻永遠等不到信。
  const created = await createApplication(data);
  if (!created.ok) {
    return NextResponse.json({ ok: false, error: created.error }, { status: 400 });
  }

  const origin = req.nextUrl.origin;
  const link = `${origin}/join/verify?token=${encodeURIComponent(created.token)}`;

  console.info("[join] new application", {
    business_name: data.business_name,
    email: data.email,
  });

  // 兩封信：申請人的驗證信（關鍵路徑）、營運團隊的通知信（純告知）
  await sendEmail(
    data.email,
    "【Cross】請驗證信箱並設定密碼",
    verificationEmail(data.business_name, link),
  );
  const notifyTo = process.env.JOIN_NOTIFY_EMAIL;
  if (notifyTo) {
    await sendEmail(
      notifyTo,
      `【Cross 夥伴加入申請】${data.business_name}`,
      await buildNotificationText(data),
    );
  }

  return NextResponse.json({ ok: true });
}

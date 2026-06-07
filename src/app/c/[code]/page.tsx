import { notFound, permanentRedirect } from "next/navigation";

import { clinicsApi } from "@/lib/api/clinics";

interface ShortLinkPageProps {
  params: Promise<{ code: string }>;
}

// 診所頁短網址：/c/{UUID 前 8 碼} → 轉到完整 /clinic/{id}
// 短碼以 clinic id 前綴比對（8 hex 碰撞機率極低）；找不到則 404。
export default async function ClinicShortLinkPage({ params }: ShortLinkPageProps) {
  const { code } = await params;
  const normalized = code.toLowerCase();

  let targetId: string | null = null;
  try {
    const clinics = await clinicsApi.getClinics();
    targetId =
      clinics.find((c) => c.id.toLowerCase().startsWith(normalized))?.id ?? null;
  } catch {
    targetId = null;
  }

  // 短網址為長期結構 → 用 308 永久轉址，讓 Google 完整傳遞權重給診所頁。
  // permanentRedirect() 會丟出控制流例外，必須在 try/catch 之外呼叫。
  if (targetId) permanentRedirect(`/clinic/${targetId}`);
  notFound();
}

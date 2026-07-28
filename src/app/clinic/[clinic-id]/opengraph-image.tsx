import { ImageResponse } from "next/og";

import { parseCityFromAddress } from "@/lib/constants/clinic-constants";

// 每間診所專屬的分享卡（1200×630）：有 logo 用 logo，沒 logo 也以診所名 + 品牌
// 呈現，讓每次分享都是「該診所自己的」識別，而非千篇一律的 Cross 品牌圖。
// 中文需載入 Noto Sans TC 子集（next/og 內建字型僅 Latin），載入失敗則優雅退化。

export const alt = "診所線上預約掛號 — Cross";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API_BASE_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

interface OgClinic {
  id: string;
  name: string;
  address: string | null;
  logo: string | null;
}

async function getClinic(id: string): Promise<OgClinic | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/booking/clinics`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const arr = (await res.json()) as OgClinic[];
    return arr.find((c) => c.id === id) ?? null;
  } catch {
    return null;
  }
}

// 從 Google Fonts 取「只含所需字元」的 TC 字型子集（用舊版 UA 強制回傳 ttf，
// 因為 Satori 不支援 woff2）。失敗回 null，由呼叫端退化成 Latin-only。
async function loadTcSubset(text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&text=${encodeURIComponent(
      text,
    )}`;
    // 不帶瀏覽器 UA：Google Fonts css2 會回 truetype（Satori 不支援 woff2）
    const css = await (
      await fetch(url, { next: { revalidate: 86400 } })
    ).text();
    const src = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/);
    if (!src) return null;
    return await (await fetch(src[1])).arrayBuffer();
  } catch {
    return null;
  }
}

async function logoDataUrl(logo: string | null): Promise<string | null> {
  if (!logo) return null;
  try {
    const r = await fetch(logo);
    if (!r.ok) return null;
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    // Satori（next/og）僅可靠支援 PNG / JPEG / GIF；AVIF / WebP / SVG 會在 streaming
    // 渲染階段拋錯 → 整張 OG 圖 500（且逃出本檔 try/catch）。診所 logo 目前以 AVIF
    // 提供，故不支援的格式一律退回 null，改用品牌十字記號，確保 OG 圖永不 500。
    if (!/image\/(png|jpe?g|gif)/.test(ct)) return null;
    const buf = await r.arrayBuffer();
    return `data:${ct};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

// 醫療十字品牌記號（用 div 畫，免字型）
function CrossMark({ size: s = 56, color = "#2563EB" }: { size?: number; color?: string }) {
  const bar = Math.round(s * 0.26);
  const off = Math.round((s - bar) / 2);
  return (
    <div style={{ display: "flex", position: "relative", width: s, height: s }}>
      <div
        style={{ position: "absolute", left: off, top: 0, width: bar, height: s, background: color, borderRadius: 6 }}
      />
      <div
        style={{ position: "absolute", left: 0, top: off, width: s, height: bar, background: color, borderRadius: 6 }}
      />
    </div>
  );
}

interface OgImageProps {
  params: Promise<{ "clinic-id": string }>;
}

export default async function ClinicOgImage({ params }: OgImageProps) {
  const { "clinic-id": id } = await params;
  try {
  const clinic = await getClinic(id);

  const name = clinic?.name ?? "診所線上預約";
  const city = parseCityFromAddress(clinic?.address ?? undefined) ?? "";
  const subtitle = `${city ? `${city}・` : ""}線上預約掛號`;

  const [fontData, logo] = await Promise.all([
    // 子集需含「實際會渲染」的所有字元：診所名/副標（中文）+ 頁尾品牌字（Latin
    // 「Cross」「cross.twinhao.com」）。否則 Latin 字在純中文子集下無字形 → 渲染失敗。
    loadTcSubset(`${name}${subtitle}線上預約掛號診所 Cross cross.twinhao.com`),
    logoDataUrl(clinic?.logo ?? null),
  ]);

  const hasFont = !!fontData;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          fontFamily: hasFont ? "Noto Sans TC, sans-serif" : "sans-serif",
        }}
      >
        {/* 頂部品牌色帶 */}
        <div
          style={{ display: "flex", height: 14, background: "linear-gradient(90deg,#2563EB,#1E3A8A)" }}
        />

        {/* 主體 */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            padding: "0 84px",
            gap: 56,
          }}
        >
          {/* logo 或十字記號 */}
          {logo ? (
            <img
              src={logo}
              width={260}
              height={260}
              style={{
                width: 260,
                height: 260,
                borderRadius: 36,
                objectFit: "contain",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
              }}
              alt=""
            />
          ) : (
            <div
              style={{
                display: "flex",
                width: 260,
                height: 260,
                borderRadius: 36,
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)",
                border: "1px solid #BFDBFE",
              }}
            >
              <CrossMark size={120} />
            </div>
          )}

          {/* 文字區 */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {hasFont ? (
              <div
                style={{
                  display: "flex",
                  fontSize: name.length > 12 ? 60 : 76,
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: 1.2,
                }}
              >
                {name}
              </div>
            ) : (
              <div style={{ display: "flex", fontSize: 96, fontWeight: 800, color: "#0f172a", letterSpacing: -2 }}>
                Cross
              </div>
            )}

            <div
              style={{
                display: "flex",
                marginTop: 24,
                fontSize: 38,
                color: "#2563EB",
                fontWeight: 700,
              }}
            >
              {hasFont ? subtitle : "Online Clinic Booking"}
            </div>
          </div>
        </div>

        {/* 頁尾品牌列 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 84px 56px",
          }}
        >
          <CrossMark size={40} />
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: "#1E3A8A", letterSpacing: -1 }}>
            Cross
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#64748b", marginLeft: 8 }}>
            cross.twinhao.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      // 載入失敗時「省略 fonts」讓 next/og 用內建 Latin 字型（傳空陣列會讓
      // Satori 丟 No fonts are loaded 而 500）；此時 JSX 走 Latin 分支。
      ...(fontData
        ? {
            fonts: [
              { name: "Noto Sans TC", data: fontData, style: "normal" as const, weight: 700 as const },
            ],
          }
        : {}),
    },
  );
  } catch {
    // 任何意外（字型 / 圖片 / 渲染）→ 安全退回 Latin 品牌卡，永不 500
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#2563EB,#1E3A8A)",
            color: "#ffffff",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", fontSize: 130, fontWeight: 800, letterSpacing: -3 }}>
            Cross
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 34, color: "rgba(255,255,255,0.85)" }}>
            Online Clinic Booking
          </div>
        </div>
      ),
      { ...size },
    );
  }
}

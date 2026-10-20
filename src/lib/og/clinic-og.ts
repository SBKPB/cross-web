// 每間診所專屬的分享卡（1200×630，移植自舊 Next 的 app/clinic/[clinic-id]/opengraph-image.tsx）：
// 有 logo 用 logo，沒 logo 也以診所名 + 品牌呈現，讓每次分享都是「該診所自己的」識別，而非千篇一律的 Cross 品牌圖。
// 中文需載入 Noto Sans TC 子集（@vercel/og 內建字型僅 Latin），載入失敗則優雅退化。
// 不用 JSX：版面以 Satori 接受的 { type, props } 元素物件描述，樣式與舊版逐項相同。
import { ImageResponse } from "@vercel/og";
import { parseCityFromAddress } from "../constants/clinic-constants.ts";

type Fetch = typeof globalThis.fetch;

export const OG_SIZE = { width: 1200, height: 630 };

/** Satori 元素（對應 React element 的 type / props） */
export interface OgNode {
  type: string;
  props: { style?: Record<string, string | number>; children?: OgChild | OgChild[]; [key: string]: unknown };
}
type OgChild = OgNode | string;

const el = (type: string, props: OgNode["props"]): OgNode => ({ type, props });

interface OgClinic {
  id: string;
  name: string;
  address: string | null;
  logo: string | null;
}

/** 院所清單（後端經 event.fetch 走代理）；任何錯誤回 null，卡片改用預設名稱 */
async function getClinic(fetch: Fetch, id: string): Promise<OgClinic | null> {
  try {
    const res = await fetch("/api/v1/booking/clinics");
    if (!res.ok) return null;
    const arr = (await res.json()) as OgClinic[];
    return arr.find((c) => c.id === id) ?? null;
  } catch {
    return null;
  }
}

// 從 Google Fonts 取「只含所需字元」的 TC 字型子集（用舊版 UA 強制回傳 ttf，
// 因為 Satori 不支援 woff2）。失敗回 null，由呼叫端退化成 Latin-only。
async function loadTcSubset(fetch: Fetch, text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&text=${encodeURIComponent(
      text,
    )}`;
    // 不帶瀏覽器 UA：Google Fonts css2 會回 truetype（Satori 不支援 woff2）
    const css = await (await fetch(url)).text();
    const src = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/);
    if (!src) return null;
    return await (await fetch(src[1])).arrayBuffer();
  } catch {
    return null;
  }
}

async function logoDataUrl(fetch: Fetch, logo: string | null): Promise<string | null> {
  if (!logo) return null;
  try {
    const r = await fetch(logo);
    if (!r.ok) return null;
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    // Satori 僅可靠支援 PNG / JPEG / GIF；AVIF / WebP / SVG 會在渲染階段拋錯。
    // 診所 logo 目前以 AVIF 提供，故不支援的格式一律退回 null，改用品牌十字記號。
    if (!/image\/(png|jpe?g|gif)/.test(ct)) return null;
    const buf = await r.arrayBuffer();
    return `data:${ct};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

// 醫療十字品牌記號（用 div 畫，免字型）
function crossMark(s = 56, color = "#2563EB"): OgNode {
  const bar = Math.round(s * 0.26);
  const off = Math.round((s - bar) / 2);
  return el("div", {
    style: { display: "flex", position: "relative", width: s, height: s },
    children: [
      el("div", {
        style: { position: "absolute", left: off, top: 0, width: bar, height: s, background: color, borderRadius: 6 },
      }),
      el("div", {
        style: { position: "absolute", left: 0, top: off, width: s, height: bar, background: color, borderRadius: 6 },
      }),
    ],
  });
}

/** 診所分享卡版面；hasFont=false 時文字區走 Latin 分支（Cross / Online Clinic Booking） */
export function clinicCardElement({
  name,
  subtitle,
  logo,
  hasFont,
}: {
  name: string;
  subtitle: string;
  logo: string | null;
  hasFont: boolean;
}): OgNode {
  return el("div", {
    style: {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#ffffff",
      fontFamily: hasFont ? "Noto Sans TC, sans-serif" : "sans-serif",
    },
    children: [
      // 頂部品牌色帶
      el("div", {
        style: { display: "flex", height: 14, background: "linear-gradient(90deg,#2563EB,#1E3A8A)" },
      }),

      // 主體
      el("div", {
        style: {
          display: "flex",
          flex: 1,
          alignItems: "center",
          padding: "0 84px",
          gap: 56,
        },
        children: [
          // logo 或十字記號
          logo
            ? el("img", {
                src: logo,
                width: 260,
                height: 260,
                style: {
                  width: 260,
                  height: 260,
                  borderRadius: 36,
                  objectFit: "contain",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                },
                alt: "",
              })
            : el("div", {
                style: {
                  display: "flex",
                  width: 260,
                  height: 260,
                  borderRadius: 36,
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)",
                  border: "1px solid #BFDBFE",
                },
                children: crossMark(120),
              }),

          // 文字區
          el("div", {
            style: { display: "flex", flexDirection: "column", flex: 1 },
            children: [
              hasFont
                ? el("div", {
                    style: {
                      display: "flex",
                      fontSize: name.length > 12 ? 60 : 76,
                      fontWeight: 700,
                      color: "#0f172a",
                      lineHeight: 1.2,
                    },
                    children: name,
                  })
                : el("div", {
                    style: { display: "flex", fontSize: 96, fontWeight: 800, color: "#0f172a", letterSpacing: -2 },
                    children: "Cross",
                  }),

              el("div", {
                style: {
                  display: "flex",
                  marginTop: 24,
                  fontSize: 38,
                  color: "#2563EB",
                  fontWeight: 700,
                },
                children: hasFont ? subtitle : "Online Clinic Booking",
              }),
            ],
          }),
        ],
      }),

      // 頁尾品牌列
      el("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 84px 56px",
        },
        children: [
          crossMark(40),
          el("div", {
            style: { display: "flex", fontSize: 34, fontWeight: 800, color: "#1E3A8A", letterSpacing: -1 },
            children: "Cross",
          }),
          el("div", {
            style: { display: "flex", fontSize: 28, color: "#64748b", marginLeft: 8 },
            children: "cross.twinhao.com",
          }),
        ],
      }),
    ],
  });
}

/** 任何意外時的 Latin 品牌卡 */
function fallbackCardElement(): OgNode {
  return el("div", {
    style: {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg,#2563EB,#1E3A8A)",
      color: "#ffffff",
      fontFamily: "sans-serif",
    },
    children: [
      el("div", {
        style: { display: "flex", fontSize: 130, fontWeight: 800, letterSpacing: -3 },
        children: "Cross",
      }),
      el("div", {
        style: { display: "flex", marginTop: 24, fontSize: 34, color: "rgba(255,255,255,0.85)" },
        children: "Online Clinic Booking",
      }),
    ],
  });
}

/** ImageResponse 在讀取 body 時才渲染；這裡直接讀完，渲染錯誤才會落在呼叫端的 try/catch 內 */
async function renderPng(element: OgNode, options: ConstructorParameters<typeof ImageResponse>[1]): Promise<ArrayBuffer> {
  // @vercel/og 的型別要 ReactElement；Satori 實際接受同形狀的元素物件
  return new ImageResponse(element as never, options).arrayBuffer();
}

/**
 * 產生診所分享卡 PNG。後端資料經 backendFetch（event.fetch，走代理）；
 * Google Fonts 與 logo 是外部網址，用 externalFetch（全域 fetch，不帶這次請求的 cookie）。
 * 任何意外（字型 / 圖片 / 渲染）→ 安全退回 Latin 品牌卡，永不 500。
 */
export async function renderClinicOg(
  clinicId: string,
  { backendFetch, externalFetch }: { backendFetch: Fetch; externalFetch: Fetch },
): Promise<ArrayBuffer> {
  try {
    const clinic = await getClinic(backendFetch, clinicId);

    const name = clinic?.name ?? "診所線上預約";
    const city = parseCityFromAddress(clinic?.address ?? undefined) ?? "";
    const subtitle = `${city ? `${city}・` : ""}線上預約掛號`;

    const [fontData, logo] = await Promise.all([
      // 子集需含「實際會渲染」的所有字元：診所名/副標（中文）+ 頁尾品牌字（Latin
      // 「Cross」「cross.twinhao.com」）。否則 Latin 字在純中文子集下無字形 → 渲染失敗。
      loadTcSubset(externalFetch, `${name}${subtitle}線上預約掛號診所 Cross cross.twinhao.com`),
      logoDataUrl(externalFetch, clinic?.logo ?? null),
    ]);

    const hasFont = !!fontData;

    return await renderPng(clinicCardElement({ name, subtitle, logo, hasFont }), {
      ...OG_SIZE,
      // 載入失敗時「省略 fonts」讓 @vercel/og 用內建 Latin 字型（傳空陣列會讓
      // Satori 丟 No fonts are loaded）；此時版面走 Latin 分支。
      ...(fontData
        ? {
            fonts: [{ name: "Noto Sans TC", data: fontData, style: "normal" as const, weight: 700 as const }],
          }
        : {}),
    });
  } catch {
    return renderPng(fallbackCardElement(), { ...OG_SIZE });
  }
}

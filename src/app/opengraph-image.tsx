import { ImageResponse } from "next/og";

// 全站預設 OG 分享圖（1200×630，程式生成，無需圖檔）。
// 診所頁若有 logo 會用 logo，否則 fallback 到這張品牌圖。
// 註：next/og 內建字型僅含 Latin，故圖內文字採英數避免中文 tofu；
//     分享卡的中文資訊由各頁 title/description 提供。

export const alt = "Cross — 線上預約看診";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          background: "linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* 醫療十字品牌記號 */}
        <div
          style={{
            display: "flex",
            position: "relative",
            width: 92,
            height: 92,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 34,
              top: 0,
              width: 24,
              height: 92,
              background: "#ffffff",
              borderRadius: 8,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 34,
              width: 92,
              height: 24,
              background: "#ffffff",
              borderRadius: 8,
            }}
          />
        </div>

        <div style={{ fontSize: 154, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>
          Cross
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 36,
            fontWeight: 500,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          Online Clinic Booking
        </div>

        <div style={{ marginTop: 52, fontSize: 30, color: "rgba(255,255,255,0.72)" }}>
          cross.twinhao.com
        </div>
      </div>
    ),
    { ...size },
  );
}

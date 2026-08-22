/**
 * 依背景色挑出讀得清楚的前景色。
 *
 * 預約流程把診所品牌色 (`clinicConfig.primary_color`) 直接當底色、上面固定壓白字，
 * 但白字只在深色底才夠亮：黃 #facc15 配白字是 1.53:1、綠 #22c55e 是 2.28:1，
 * 一般文字的 WCAG AA 門檻是 4.5:1。改成依亮度二選一，淺色品牌色自動換深色字。
 */

/** 站上深色墨水（= --foreground 亮色值） */
export const INK_DARK = "#0f172a";
export const INK_LIGHT = "#ffffff";

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

/** WCAG 相對亮度 */
function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** 兩色對比比值（1–21） */
export function contrastRatio(a: string, b: string): number {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return 1;
  const [hi, lo] = [luminance(ca), luminance(cb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * 回傳在 `background` 上讀得最清楚的前景色（白或深墨）。
 * 無法解析的色（含 CSS 變數、rgb() 等）一律回白字，維持原本行為。
 */
export function inkOn(background: string | undefined | null): string {
  if (!background || !parseHex(background)) return INK_LIGHT;
  return contrastRatio(INK_LIGHT, background) >=
    contrastRatio(INK_DARK, background)
    ? INK_LIGHT
    : INK_DARK;
}

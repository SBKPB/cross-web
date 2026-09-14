/** 防止店家資料中的 HTML 結束 JSON-LD script 標籤，並保留原始 JSON 內容。 */
export function serializeJsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

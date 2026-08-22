/**
 * Email HTML 模板。
 *
 * Email client 的 HTML 支援停在 2003 年左右：不能用 flex / grid、外部 CSS 常被
 * 剝掉、Outlook 用 Word 引擎算版。所以這裡一律：table 佈局、樣式全部 inline、
 * line-height 用 px（Outlook 不吃 unitless）、按鈕用 table 包（bulletproof
 * button），且**不放圖片**——多數 client 預設擋圖，logo 變破圖比沒有更糟，
 * 改用文字 wordmark。
 *
 * 每個模板都同時輸出 html 與 text：純文字不是備胎而是必要的，
 * 有些人就是關掉 HTML 在讀信，寄件信譽也吃這個。
 */

const BRAND = "#1d4ed8";
const INK = "#0f172a";
const MUTED = "#586273";
const BORDER = "#e2e8f0";
const CANVAS = "#f1f5f9";
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', Roboto, sans-serif";

/** HTML 轉義：申請人填的內容會進到信裡，不能讓它壞掉版面或夾帶標籤 */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 外框：置中 600px 卡片 + 文字 wordmark 頁首 + 頁尾 */
function shell(preheader: string, inner: string): string {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cross</title>
</head>
<body style="margin:0;padding:0;background:${CANVAS};">
<!-- 收件匣預覽文字：只給列表看，信件內容裡隱藏 -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CANVAS}" style="background:${CANVAS};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td style="padding:0 4px 16px;font-family:${FONT};font-size:15px;font-weight:700;color:${BRAND};letter-spacing:0.3px;">
            Cross
          </td>
        </tr>
        <tr>
          <td bgcolor="#ffffff" style="background:#ffffff;border:1px solid ${BORDER};border-radius:16px;padding:32px;">
${inner}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 4px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">
            這封信由 Cross 自動寄出，請勿直接回覆。<br>
            Cross Healthcare by Twinhao
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function h1(text: string): string {
  return `            <h1 style="margin:0 0 12px;font-family:${FONT};font-size:20px;line-height:28px;font-weight:700;color:${INK};">${esc(text)}</h1>`;
}

function p(text: string): string {
  return `            <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:24px;color:${MUTED};">${text}</p>`;
}

/** bulletproof button：table 包住，Outlook 才吃得到底色 */
function button(label: string, href: string): string {
  return `            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;">
              <tr>
                <td bgcolor="${BRAND}" style="background:${BRAND};border-radius:999px;">
                  <a href="${esc(href)}" style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${esc(label)}</a>
                </td>
              </tr>
            </table>`;
}

/** 資料列：左標籤右內容，窄螢幕會自然堆疊 */
function rows(items: { label: string; value: string }[]): string {
  const body = items
    .map(
      ({ label, value }) => `                <tr>
                  <td style="padding:9px 0;border-bottom:1px solid ${BORDER};font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};white-space:nowrap;vertical-align:top;width:96px;">${esc(label)}</td>
                  <td style="padding:9px 0 9px 16px;border-bottom:1px solid ${BORDER};font-family:${FONT};font-size:14px;line-height:20px;color:${INK};">${esc(value)}</td>
                </tr>`,
    )
    .join("\n");
  return `            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${body}
            </table>`;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/** 寄給申請人：驗證信箱並設定密碼 */
export function verificationEmail(
  businessName: string,
  link: string,
): EmailContent {
  const html = shell(
    "請驗證信箱並設定後台密碼，連結 72 小時內有效。",
    [
      h1("請驗證信箱並設定密碼"),
      p(
        `<strong style="color:${INK};">${esc(businessName)}</strong> 您好，感謝您申請加入 Cross。<br>點下面的按鈕驗證信箱，並設定之後登入院所後台要用的密碼。`,
      ),
      button("驗證信箱並設定密碼", link),
      p(
        `按鈕打不開的話，請複製這個網址到瀏覽器：<br><span style="color:${BRAND};word-break:break-all;">${esc(link)}</span>`,
      ),
      `            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">
              <tr><td style="padding:16px;background:${CANVAS};border-radius:12px;font-family:${FONT};font-size:13px;line-height:21px;color:${MUTED};">
                連結 <strong style="color:${INK};">72 小時</strong>內有效。<br>
                設定完成後我們會盡快審核，<strong style="color:${INK};">審核通過才會開通後台</strong>，屆時再以這個信箱通知您。<br>
                如果這不是您本人的申請，請忽略這封信——在您設定密碼之前，不會有任何帳號被建立。
              </td></tr>
            </table>`,
    ].join("\n"),
  );

  const text = [
    `${businessName} 您好，`,
    "",
    "感謝您申請加入 Cross。請點下面的連結驗證信箱並設定後台密碼：",
    link,
    "",
    "連結 72 小時內有效。",
    "設定完成後我們會盡快審核；審核通過才會開通後台，屆時再以這個信箱通知您。",
    "",
    "如果這不是您本人的申請，請忽略這封信——在您設定密碼之前，不會有任何帳號被建立。",
  ].join("\n");

  return { subject: "【Cross】請驗證信箱並設定密碼", html, text };
}

/** 寄給營運團隊：有新申請進來 */
export function applicationNotificationEmail(
  businessName: string,
  items: { label: string; value: string }[],
  reviewUrl: string,
): EmailContent {
  const html = shell(
    `${businessName} 送出了夥伴加入申請。`,
    [
      h1("新的夥伴加入申請"),
      p(
        `<strong style="color:${INK};">${esc(businessName)}</strong> 送出了申請。<br>對方完成信箱驗證後，這筆會出現在後台的「待審核」。`,
      ),
      rows(items),
      `<div style="height:20px;"></div>`,
      button("到後台查看", reviewUrl),
    ].join("\n"),
  );

  const text = [
    "【Cross 新夥伴加入申請】",
    "",
    ...items.map((i) => `${i.label}：${i.value}`),
    "",
    `到後台查看：${reviewUrl}`,
  ].join("\n");

  return { subject: `【Cross 夥伴加入申請】${businessName}`, html, text };
}

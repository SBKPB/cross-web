// 比對工具共用：讀 PARITY_FETCH_TIMEOUT_MS（每個請求／頁面載入的逾時毫秒數，預設 30 秒）。
// 只接受計時器支援的正整數範圍，避免小數拋錯或溢位被縮成 1 毫秒；錯誤以 exit 2 結束，
// 在發出任何請求之前就停下，不會把設定錯誤誤報成每條路由「抓取失敗」。
export function fetchTimeoutMs() {
  const raw = process.env.PARITY_FETCH_TIMEOUT_MS;
  const ms = Number(raw ?? 30_000);
  if (!Number.isInteger(ms) || ms <= 0 || ms > 2_147_483_647) {
    console.error(`PARITY_FETCH_TIMEOUT_MS 必須是正的有限毫秒數，且為 1–2147483647 的整數（例如 60000），收到「${raw}」`);
    process.exit(2);
  }
  return ms;
}

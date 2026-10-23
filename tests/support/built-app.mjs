// 需要 `pnpm build` 產物的測試共用：檢查產物是否過期、啟動 vite preview。
import { spawn } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
// 每次 build 都會重寫的檔案，用它的修改時間代表「最近一次建置」
const BUILD_STAMP = join(ROOT, ".svelte-kit/output/client/_app/version.json");
// 改了會影響建置產物的來源（app.html 的主題初始化腳本也在其中）
const SOURCES = ["src", "static", "vite.config.ts"];

function newestFile(path) {
  if (!existsSync(path)) return null;
  const stat = statSync(path);
  if (!stat.isDirectory()) return { path, mtimeMs: stat.mtimeMs };
  let newest = null;
  for (const name of readdirSync(path)) {
    const found = newestFile(join(path, name));
    if (found && (!newest || found.mtimeMs > newest.mtimeMs)) newest = found;
  }
  return newest;
}

/**
 * 建置產物不存在或比任何來源檔舊時回傳錯誤訊息（含「請先 pnpm build」），否則 null。
 * 測試對過期產物跑會測到舊碼而靜默通過，所以呼叫端要讓測試明確失敗，不是略過。
 */
export function buildProblem() {
  if (!existsSync(BUILD_STAMP)) return "沒有建置產物（.svelte-kit/output），請先 pnpm build";
  const built = statSync(BUILD_STAMP).mtimeMs;
  let newest = null;
  for (const source of SOURCES) {
    const found = newestFile(join(ROOT, source));
    if (found && (!newest || found.mtimeMs > newest.mtimeMs)) newest = found;
  }
  if (newest && newest.mtimeMs > built) {
    return `建置產物（.svelte-kit/output）比 ${relative(ROOT, newest.path)} 舊，請先 pnpm build，否則測到的是舊碼`;
  }
  return null;
}

/** 對建置產物啟動 vite preview，回傳 { origin, stop } */
export async function startPreview(port) {
  const server = spawn("pnpm", ["exec", "vite", "preview", "--port", String(port), "--strictPort"], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("vite preview 啟動逾時")), 30_000);
    server.stdout.on("data", (chunk) => {
      if (String(chunk).includes(`${port}`)) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on("exit", (code) => reject(new Error(`vite preview 結束（${code}）`)));
  });
  return { origin: `http://localhost:${port}`, stop: () => server.kill() };
}

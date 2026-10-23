// 元件測試共用：以 vite 把 tests/support/<harness>/（index.html + main.js + Harness.svelte）建置成靜態頁，
// 用本機 http 伺服器提供（找不到的路徑一律 404，例如 /api/v1/service-categories → 元件用 fallback 字彙），
// 測試再以系統 Chrome（playwright-core）載入。#lib 指向真正的 src/lib，$app/* 換成 tests/support 的替身。
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { build } from "vite";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SUPPORT = fileURLToPath(new URL("./", import.meta.url));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

/**
 * 以 production 模式建置 tests/support/<name>/ 並啟動靜態伺服器。
 * @param {string} name tests/support 底下的資料夾名稱
 * @returns {Promise<{ origin: string, close: () => Promise<void> }>}
 */
export async function startHarness(name) {
  const harness = join(SUPPORT, name);
  const outDir = await mkdtemp(join(tmpdir(), `${name}-`));
  await build({
    configFile: false,
    root: harness,
    logLevel: "error",
    mode: "production",
    plugins: [svelte({ configFile: false, preprocess: vitePreprocess() })],
    resolve: {
      alias: {
        "#lib": join(ROOT, "src/lib"),
        "$app/navigation": join(SUPPORT, "app-navigation.mjs"),
        "$app/state": join(SUPPORT, "duplicate-keys/app-state.js"),
      },
    },
    build: { outDir, emptyOutDir: true, minify: false },
  });
  const server = createServer(async (req, res) => {
    const path = normalize(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
    try {
      const body = await readFile(join(outDir, path));
      res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: async () => {
      server.close();
      await rm(outDir, { recursive: true, force: true });
    },
  };
}

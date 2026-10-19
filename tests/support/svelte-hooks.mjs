// node 模組 hooks：讓 node --test 能直接載入 src 內含 runes 的 .svelte.ts／.svelte.js 模組並真的跑 $effect。
// - .svelte.ts／.svelte.js：剝除型別後以 svelte/compiler 的 compileModule（client）編譯
// - $lib/*：對應 src/lib/*；$app/navigation：換成記錄呼叫的假模組（app-navigation.mjs）
// - src 內 .svelte.ts 匯入的 svelte：換成 svelte-context.mjs（getContext／setContext 不需元件 context）
// - 其餘 svelte／esm-env：用 browser 條件解析（server 版的 $effect 不會執行）
// 用法：測試檔先 register("./support/svelte-hooks.mjs", import.meta.url)，之後一律用動態 import。
import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath } from "node:url";
import { compileModule } from "svelte/compiler";

// stripTypeScriptTypes 在 Node 22 仍標為實驗功能，每次執行都會印警告；只濾掉這一則，讓測試輸出維持乾淨
const emitWarning = process.emitWarning;
process.emitWarning = (warning, ...rest) =>
  String(warning).includes("stripTypeScriptTypes") ? undefined : emitWarning.call(process, warning, ...rest);

const ROOT = new URL("../../", import.meta.url);
const SRC = new URL("src/", ROOT).href;
const MOCKS = { "$app/navigation": new URL("./app-navigation.mjs", import.meta.url).href };
const SVELTE_CONTEXT = new URL("./svelte-context.mjs", import.meta.url).href;

export async function resolve(specifier, context, next) {
  if (MOCKS[specifier]) return { url: MOCKS[specifier], shortCircuit: true };
  const parent = context.parentURL ?? "";
  if (specifier === "svelte" && parent.startsWith(SRC) && /\.svelte\.(ts|js)$/.test(parent)) {
    return { url: SVELTE_CONTEXT, shortCircuit: true };
  }
  if (specifier.startsWith("$lib/")) {
    const base = new URL(`src/lib/${specifier.slice(5)}`, ROOT).href;
    for (const ext of ["", ".ts", ".svelte.ts", ".js", ".svelte.js"]) {
      const url = new URL(base + ext);
      if (existsSync(url) && statSync(url).isFile()) return { url: url.href, shortCircuit: true };
    }
  }
  if (/^(svelte|esm-env)(\/|$)/.test(specifier) && !specifier.startsWith("svelte/compiler")) {
    return next(specifier, { ...context, conditions: ["browser", ...context.conditions] });
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (/\.svelte\.(ts|js)$/.test(url)) {
    let source = await readFile(new URL(url), "utf8");
    if (url.endsWith(".ts")) source = stripTypeScriptTypes(source);
    const { js } = compileModule(source, { filename: fileURLToPath(url), generate: "client" });
    return { format: "module", source: js.code, shortCircuit: true };
  }
  return next(url, context);
}

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

// 專案設定與死碼的守門測試（第 1 期審查遺留項 c、d）

const pkg = JSON.parse(readFileSync("package.json", "utf8"));

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|js|svelte)$/.test(name) ? [path] : [];
  });
}

// svelte、@sveltejs/kit 是建置時的框架本身，依 SvelteKit 慣例放 devDependencies
const FRAMEWORK = new Set(["svelte", "@sveltejs/kit"]);

test("src 執行期 import 的套件都列在 dependencies（框架本身除外）", () => {
  const misplaced = new Map();
  for (const file of sourceFiles("src")) {
    const source = readFileSync(file, "utf8");
    for (const m of source.matchAll(/^\s*import\s+(type\s+)?(?:[^"';]*?from\s+)?["']([^"']+)["']/gm)) {
      const [, typeOnly, spec] = m;
      if (typeOnly || /^(\.|\$|#|node:)/.test(spec)) continue;
      const name = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
      if (FRAMEWORK.has(name) || pkg.dependencies?.[name]) continue;
      misplaced.set(name, [...(misplaced.get(name) ?? []), file]);
    }
  }
  assert.deepEqual(Object.fromEntries(misplaced), {});
  // 審查點名的兩個（shadcn-svelte 元件在執行期使用）
  for (const name of ["tailwind-variants", "@internationalized/date"]) {
    assert.ok(pkg.dependencies[name], `${name} 應在 dependencies`);
    assert.equal(pkg.devDependencies[name], undefined, `${name} 不應在 devDependencies`);
  }
});

test("pnpm 允許 esbuild 執行安裝腳本（pnpm install 不報 ERR_PNPM_IGNORED_BUILDS）", () => {
  const workspace = readFileSync("pnpm-workspace.yaml", "utf8");
  // pnpm 11+ 讀 allowBuilds；pnpm 10 讀 onlyBuiltDependencies
  assert.match(workspace, /^allowBuilds:\n(?:[ \t]+.*\n)*?[ \t]+esbuild:\s*true\s*$/m);
  assert.match(workspace, /^onlyBuiltDependencies:\n(?:[ \t]+-.*\n)*?[ \t]+-\s*esbuild\s*$/m);
});

test("方案常數僅保留現行三方案與試用天數，未恢復舊版 PricingTable", async () => {
  assert.equal(existsSync("src/lib/components/pricing/PricingTable.svelte"), false);
  const constants = await import("../src/lib/constants/pricing-constants.ts");
  assert.deepEqual(Object.keys(constants), ["PRICING_PLANS", "TRIAL_DAYS"]);
  assert.equal(constants.TRIAL_DAYS, 90);
});

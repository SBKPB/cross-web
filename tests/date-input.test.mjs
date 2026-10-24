import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { readFile, mkdtemp, rm, readdir, mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { join, extname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwind from "@tailwindcss/vite";
import { chromium } from "playwright-core";
import { CHROME } from "./support/built-app.mjs";
import { calendarDate, dateInputError } from "../src/lib/date-input.ts";

let outDir, server, origin, browser;
const root = fileURLToPath(new URL("../", import.meta.url));
before(async () => {
  outDir = await mkdtemp(join(tmpdir(), "cross-date-input-"));
  await build({
    configFile: false,
    root: join(root, "tests/support/date-input"),
    logLevel: "error",
    plugins: [
      tailwind(),
      svelte({ configFile: false, preprocess: vitePreprocess() }),
    ],
    resolve: { alias: { "#lib": join(root, "src/lib") } },
    build: { outDir, emptyOutDir: true },
  });
  server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url, "http://localhost").pathname;
      const data = await readFile(
        join(outDir, path === "/" ? "index.html" : path),
      );
      res.writeHead(200, {
        "content-type":
          {
            ".js": "text/javascript",
            ".css": "text/css",
            ".html": "text/html",
          }[extname(path)] ?? "text/html",
      });
      res.end(data);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath: CHROME });
});
after(async () => {
  await browser?.close();
  server?.close();
  if (outDir) await rm(outDir, { recursive: true, force: true });
});
async function setup(width = 390, theme = "light") {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin);
  await page.evaluate(
    (t) => document.documentElement.classList.toggle("dark", t === "dark"),
    theme,
  );
  return { page, errors };
}
const trigger = (page, id) =>
  page
    .locator(`[data-slot="date-input"]`)
    .filter({ has: page.locator("#" + id) })
    .getByRole("button");

test("日期驗證：閏年、無效日期、大小限制與清除，不轉換時區", () => {
  assert.equal(calendarDate("2024-02-29").toString(), "2024-02-29");
  for (const s of [
    "2025-02-29",
    "2026-02-30",
    "2026-13-01",
    "2026-1-1",
    "2026-10-24T00:00:00Z",
  ])
    assert.equal(calendarDate(s), undefined);
  assert.equal(dateInputError("2026-10-24", "2026-10-24", "2026-10-24"), "");
  assert.match(dateInputError("2026-10-23", "2026-10-24"), /之後/);
  assert.match(dateInputError("2026-10-25", undefined, "2026-10-24"), /之前/);
  assert.equal(dateInputError(""), "");
  assert.match(dateInputError("", undefined, undefined, true), /請選擇/);
});

test("全站不再使用瀏覽器原生日期選擇欄位", async () => {
  async function check(dir) {
    for (const f of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, f.name);
      if (f.isDirectory()) await check(path);
      else if (path.endsWith(".svelte"))
        assert.doesNotMatch(
          await readFile(path, "utf8"),
          /type\s*=\s*["'](?:date|datetime-local|month|week)["']/u,
          path,
        );
    }
  }
  await check(join(root, "src"));
});

test("日期輸入與日曆選擇同步，合法日期立即通知，錯誤日期阻擋儲存", async () => {
  const { page, errors } = await setup();
  try {
    await page.getByLabel("預約日期", { exact: true }).fill("2026-11-03");
    assert.equal(await page.getByTestId("date").textContent(), "2026-11-03");
    assert.equal(
      await page.getByTestId("changes").textContent(),
      '["2026-11-03"]',
    );
    await page.getByLabel("預約日期", { exact: true }).fill("2026-02-30");
    await page.getByRole("button", { name: "儲存", exact: true }).click();
    assert.equal(await page.getByTestId("saved").textContent(), "false");
    await trigger(page, "date").click();
    await page.locator('[data-value="2026-11-05"][role="button"]').click();
    assert.equal(
      await page.getByLabel("預約日期", { exact: true }).inputValue(),
      "2026-11-05",
    );
    await page.getByRole("button", { name: "儲存", exact: true }).click();
    assert.equal(await page.getByTestId("saved").textContent(), "true");
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("鍵盤開啟日曆直接聚焦日期，方向鍵移動並以 Enter 選取", async () => {
  const { page, errors } = await setup();
  try {
    await page.getByLabel("預約日期", { exact: true }).focus();
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("data-value") === "2026-10-24",
    );
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    assert.equal(
      await page.getByLabel("預約日期", { exact: true }).inputValue(),
      "2026-10-25",
    );
    await page.waitForFunction(() => document.activeElement?.id === "date");
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("自訂年月下拉、生日快速跨年、未來日期限制及清除", async () => {
  const { page, errors } = await setup();
  try {
    await trigger(page, "birth").click();
    await page.getByRole("combobox", { name: "選擇年份", exact: true }).click();
    await page.getByRole("option", { name: "1990年", exact: true }).click();
    await page.getByRole("combobox", { name: "選擇月份", exact: true }).click();
    await page.getByRole("option", { name: "5月", exact: true }).click();
    await page.locator('[data-value="1990-05-10"][role="button"]').click();
    assert.equal(
      await page.getByLabel("生日", { exact: true }).inputValue(),
      "1990-05-10",
    );
    await trigger(page, "birth").click();
    await page.getByRole("button", { name: "清除日期", exact: true }).click();
    assert.equal(
      await page.getByLabel("生日", { exact: true }).inputValue(),
      "",
    );
    await page.getByLabel("生日", { exact: true }).fill("2099-01-01");
    await page.getByLabel("生日", { exact: true }).blur();
    await page.getByRole("alert").filter({ hasText: "之前" }).waitFor();
    assert.equal(await page.locator("select").count(), 0);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("巢狀表單內的日曆與下拉可操作，Esc 逐層關閉並恢復焦點", async () => {
  const { page, errors } = await setup();
  try {
    await page.getByRole("button", { name: "開啟表單", exact: true }).click();
    await trigger(page, "nested").click();
    await page.getByRole("combobox", { name: "選擇月份", exact: true }).click();
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator('[data-slot="date-input"] #nested').count(),
      1,
    );
    await page.keyboard.press("Escape");
    assert.equal(await page.getByLabel("表單日期", { exact: true }).count(), 1);
    await page.waitForFunction(() => document.activeElement?.id === "nested");
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("日期上下限、鍵盤操作、禁用、手機亮暗色版面與觸控區", async () => {
  for (const width of [320, 360, 768, 1440])
    for (const theme of ["light", "dark"]) {
      const { page, errors } = await setup(width, theme);
      try {
        assert.equal(await trigger(page, "disabled").isDisabled(), true);
        await page.getByLabel("預約日期", { exact: true }).focus();
        await page.keyboard.press("ArrowDown");
        await page.locator('[data-slot="popover-content"]').waitFor();
        const before = page.locator('[data-value="2026-10-19"][role="button"]');
        assert.equal(await before.getAttribute("aria-disabled"), "true");
        await page.getByRole("button", { name: "下個月", exact: true }).click();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        const box = await page.locator(".date-input-popover").boundingBox();
        assert(box.x >= 0 && box.x + box.width <= width + 1);
        await mkdir("/private/tmp/cross-date-picker-20261024", {
          recursive: true,
        });
        await page.screenshot({
          path: `/private/tmp/cross-date-picker-20261024/${width}-${theme}.png`,
        });
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    }
});

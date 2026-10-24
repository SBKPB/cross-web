import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";
import { startPreview, buildProblem, CHROME } from "./support/built-app.mjs";
import { setupComplete, facilityId } from "./support/admin-complete.mjs";
let preview, browser;
const origin = process.env.ADMIN_SIDEBAR_ORIGIN;
const dir =
  process.env.ADMIN_SIDEBAR_EVIDENCE_DIR ??
  "/private/tmp/cross-admin-sidebar-local-20261024";
const path = (tab) => `/admin/clinics/${facilityId}?tab=${tab}`;
before(async () => {
  if (!origin) assert.equal(buildProblem(), null);
  preview = origin ? { origin, stop() {} } : await startPreview(4403);
  browser = await chromium.launch({ executablePath: CHROME });
  await mkdir(dir, { recursive: true });
});
after(async () => {
  await browser?.close();
  preview?.stop();
});
async function ready(page, collapsed) {
  await page.waitForFunction(
    (value) =>
      document.querySelector("aside")?.getAttribute("data-collapsed") ===
      String(value),
    collapsed,
  );
}
async function noOverflow(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
}

test("桌面側欄可收合並記住偏好，鍵盤換頁及重新整理保留選取與院所", async () => {
  const { page, errors } = await setupComplete(browser, preview.origin, {
    role: "facility_admin",
  });
  try {
    await page.goto(preview.origin + path("appointments"));
    await ready(page, false);
    const nav = page.getByRole("navigation", {
      name: "後台主要導覽",
      exact: true,
    });
    assert.deepEqual(await nav.locator("section>p").allTextContents(), [
      "日常作業",
      "客戶與營運",
      "設定與帳務",
    ]);
    await page.getByRole("button", { name: "收合側邊欄", exact: true }).click();
    await ready(page, true);
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem("cross_admin_sidebar_collapsed"),
      ),
      "true",
    );
    await page.waitForFunction(
      () =>
        Math.round(
          document.querySelector("aside").getBoundingClientRect().width,
        ) === 80,
    );
    const link = nav.getByRole("link", { name: "排班管理", exact: true });
    await link.focus();
    await page.keyboard.press("Enter");
    await page.waitForURL("**tab=schedule**");
    assert.equal(
      await nav
        .getByRole("link", { name: "排班管理", exact: true })
        .getAttribute("aria-current"),
      "page",
    );
    assert(new URL(page.url()).pathname.includes(facilityId));
    await page.reload();
    await ready(page, true);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: dir + "/desktop-collapsed.png",
      animations: "disabled",
    });
    await page.getByRole("button", { name: "修改密碼", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("heading", { name: "修改密碼", exact: true })
      .waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "展開側邊欄", exact: true }).click();
    await ready(page, false);
    await page.reload();
    await ready(page, false);
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem("cross_admin_sidebar_collapsed"),
      ),
      "false",
    );
    await noOverflow(page);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("平板預設窄版，手機完整選單可關閉、換頁與旋轉，長院所名稱及亮暗色無溢出", async () => {
  for (const width of [360, 768, 1440])
    for (const color of ["light", "dark"]) {
      const { page, state, errors } = await setupComplete(
        browser,
        preview.origin,
        { width, role: "facility_admin" },
      );
      state.clinic.name =
        "虛構醫美院所・很長的分院名稱與服務中心・僅供側欄版面測試";
      try {
        await page.addInitScript(
          (mode) => localStorage.setItem("theme", mode),
          color,
        );
        await page.goto(preview.origin + path("patients"));
        await page
          .getByRole("heading", { name: "客戶管理", exact: true })
          .waitFor();
        await ready(page, width < 1024);
        if (width === 360) {
          const more = page
            .getByRole("navigation", { name: "手機後台主要導覽" })
            .getByRole("button", { name: "更多", exact: true });
          await more.click();
          const sheet = page.getByRole("dialog");
          await sheet.waitFor();
          assert.equal(
            await sheet
              .locator("[data-sidebar-compact]")
              .getAttribute("data-sidebar-compact"),
            "false",
          );
          await sheet
            .getByRole("link", { name: "排班管理", exact: true })
            .waitFor();
          await page.waitForLoadState("networkidle");
          await page.screenshot({
            path: `${dir}/${width}-${color}.png`,
            animations: "disabled",
          });
          await page.keyboard.press("Escape");
          await sheet.waitFor({ state: "hidden" });
          await page
            .getByRole("button", { name: "開啟後台選單", exact: true })
            .click();
          await sheet
            .getByRole("link", { name: "排班管理", exact: true })
            .click();
          await sheet.waitFor({ state: "hidden" });
          await page.waitForURL("**tab=schedule**");
          await page
            .getByRole("button", { name: "開啟後台選單", exact: true })
            .click();
          await sheet.waitFor();
          await page.setViewportSize({ width: 1024, height: 600 });
          await sheet.waitFor({ state: "hidden" });
          await page
            .locator("aside")
            .getByRole("link", { name: "預約管理", exact: true })
            .click();
          await page.waitForURL("**tab=appointments**");
        } else {
          const nav = page.locator("aside nav"),
            active = nav.getByRole("link", { name: "客戶管理", exact: true });
          assert.equal(await active.getAttribute("aria-current"), "page");
          assert.notEqual(
            await active.evaluate((e) => getComputedStyle(e).backgroundColor),
            "rgba(0, 0, 0, 0)",
          );
          await page.waitForLoadState("networkidle");
          await page.screenshot({
            path: `${dir}/${width}-${color}.png`,
            animations: "disabled",
          });
        }
        await noOverflow(page);
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    }
});

test("平台與院所側欄清楚區分，品牌返回保留所選院所，短視窗仍可操作帳戶按鈕", async () => {
  const { page, state, errors } = await setupComplete(browser, preview.origin, {
    width: 1440,
  });
  try {
    await page.goto(preview.origin + path("info"));
    await page
      .locator("aside")
      .getByRole("link", { name: "Cross · 今日工作台", exact: true })
      .click();
    await page.waitForURL("**tab=today**");
    assert(new URL(page.url()).pathname.includes(facilityId));
    await page
      .locator("aside")
      .getByRole("link", { name: "返回平台院所管理", exact: true })
      .click();
    await page.waitForURL("**/admin/clinics");
    await page
      .getByRole("navigation", { name: "平台管理導覽", exact: true })
      .getByRole("link", { name: "院所管理", exact: true })
      .waitFor();
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: dir + "/platform.png",
      animations: "disabled",
    });
    state.clinic.name = "虛構短視窗測試院所";
    await page.goto(preview.origin + path("subscription"));
    await page.setViewportSize({ width: 1024, height: 480 });
    for (const name of ["修改密碼", "登出"]) {
      const box = await page
        .locator("aside")
        .getByRole("button", { name, exact: true })
        .boundingBox();
      assert(box.y >= 0 && box.y + box.height <= 480);
    }
    await noOverflow(page);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

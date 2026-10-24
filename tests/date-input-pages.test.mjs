import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";
import { startPreview, buildProblem, CHROME } from "./support/built-app.mjs";
import { setupWorkspace, facilityId } from "./support/admin-workspace.mjs";
import { setupComplete } from "./support/admin-complete.mjs";
let preview, browser;
const origin = process.env.DATE_INPUT_ORIGIN;
const dir =
  process.env.DATE_INPUT_EVIDENCE_DIR ??
  "/private/tmp/cross-date-pages-20261024";
const results = [];
const path = (tab) => `/admin/clinics/${facilityId}?tab=${tab}`;
before(async () => {
  if (!origin) assert.equal(buildProblem(), null);
  preview = origin ? { origin, stop() {} } : await startPreview(4396);
  browser = await chromium.launch({ executablePath: CHROME });
  await mkdir(dir, { recursive: true });
});
after(async () => {
  await browser?.close();
  preview?.stop();
  await writeFile(dir + "/results.json", JSON.stringify(results, null, 2));
});
async function inspect(page, label, scope = page, expected = 1) {
  const fields = scope.locator('[data-slot="date-input"]:visible');
  await fields.first().waitFor();
  assert.equal(await fields.count(), expected, label);
  for (let i = 0; i < expected; i++) {
    const field = fields.nth(i),
      input = field.locator("input");
    await field.getByRole("button").click();
    const popup = page.locator('.date-input-popover[data-state="open"]');
    await popup.waitFor();
    await popup
      .getByRole("combobox", { name: "選擇年份", exact: true })
      .waitFor();
    const box = await popup.boundingBox(),
      viewport = page.viewportSize();
    assert(box.x >= 0 && box.x + box.width <= viewport.width + 1, label);
    assert.equal(await page.locator('input[type="date"]').count(), 0);
    await page.screenshot({ path: `${dir}/${label}-${i}.png` });
    await popup.getByRole("button", { name: "關閉", exact: true }).click();
    await page.waitForFunction(
      (id) => document.activeElement?.id === id,
      await input.getAttribute("id"),
    );
    results.push({ label, field: i, viewport, overflow: false });
  }
}

test("預約篩選、叫號、手機日期管理與批次排班皆使用共用日曆", async () => {
  const { page, errors } = await setupWorkspace(browser, preview.origin, {
    width: 360,
  });
  try {
    await page.goto(preview.origin + path("appointments"));
    await page.getByRole("button", { name: /更多篩選/ }).click();
    await inspect(page, "預約篩選", page, 2);
    await page
      .locator('[data-slot="date-input"]')
      .filter({ has: page.locator("#appointments-start") })
      .getByRole("button")
      .click();
    await page.locator('[data-value="2026-10-24"][role="button"]').click();
    await page.waitForURL(
      (url) => url.searchParams.get("start") === "2026-10-24",
    );
    await page.goto(preview.origin + path("queue"));
    await inspect(page, "叫號日期");
    await page.goto(preview.origin + path("schedule"));
    await inspect(page, "直接管理日期");
    await page.getByRole("button", { name: "智慧排班", exact: true }).click();
    await page.getByLabel("排班方式", { exact: true }).selectOption("copy");
    await inspect(page, "批次排班", page.getByRole("dialog"), 3);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("新增及改期預約的日曆可在對話框內操作，改期選日更新時段", async () => {
  const { page, errors } = await setupWorkspace(browser, preview.origin, {
    width: 390,
  });
  try {
    await page.goto(preview.origin + "/admin/dashboard");
    await page
      .getByRole("button", { name: "＋ 新增預約", exact: true })
      .click();
    await inspect(page, "建立預約", page.getByRole("dialog"));
    await page
      .locator('[data-slot="dialog-footer"]')
      .getByRole("button", { name: "關閉", exact: true })
      .click();
    await page.goto(preview.origin + path("appointments"));
    await page.getByRole("button", { name: "測試客人1", exact: true }).click();
    await page.getByRole("button", { name: "改期", exact: true }).click();
    await inspect(page, "改期預約", page.getByRole("dialog"));
    await page
      .locator('[data-slot="date-input"]')
      .filter({ has: page.locator("#reschedule-date") })
      .getByRole("button")
      .click();
    await page.locator('[data-value="2026-10-24"][role="button"]').click();
    assert.equal(
      await page.locator("#reschedule-date").inputValue(),
      "2026-10-24",
    );
    await page.getByRole("button", { name: "09:00", exact: true }).waitFor();
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("人員休假、訂閱起訖／精選與續約日期皆可使用自訂日曆", async () => {
  const { page, errors } = await setupComplete(browser, preview.origin);
  try {
    await page.goto(preview.origin + path("personnel"));
    await page
      .getByRole("button", { name: "休假管理", exact: true })
      .first()
      .click();
    await inspect(page, "人員休假", page.getByRole("dialog"));
    await page.goto(preview.origin + path("info"));
    await page.getByRole("button", { name: "編輯訂閱", exact: true }).click();
    await inspect(page, "編輯訂閱", page.getByRole("dialog"), 3);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "取消", exact: true })
      .click();
    await page.getByRole("button", { name: "續約訂閱", exact: true }).click();
    await inspect(page, "續約", page.getByRole("dialog"));
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("會員初次建檔與看診對象生日使用相同日曆，手機表單不溢出", async () => {
  const page = await browser.newPage({ viewport: { width: 360, height: 844 } });
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() =>
    localStorage.setItem("access_token", "date-fixture-member"),
  );
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const body =
      path === "/api/v1/auth/me"
        ? {
            id: "fixture-member",
            email: "fixture@example.invalid",
            display_name: "虛構會員",
            roles: ["patient"],
            is_active: true,
          }
        : [];
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  try {
    await page.goto(preview.origin + "/auth/complete-profile");
    await page.locator("#birth-date").waitFor();
    await inspect(page, "初次建檔生日");
    await page.goto(preview.origin + "/member/patients");
    await page
      .getByRole("button", { name: "新增看診對象", exact: true })
      .first()
      .click();
    await inspect(page, "看診對象生日", page.getByRole("dialog"));
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

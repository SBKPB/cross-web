import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";
import { startPreview, buildProblem, CHROME } from "./support/built-app.mjs";
import { setupComplete, facilityId } from "./support/admin-complete.mjs";
import { FALLBACK_TAXONOMY } from "../src/lib/api/service-categories.ts";
import {
  searchFiltersQuery,
  parseSearchFilters,
} from "../src/lib/clinic-search.ts";
const external = process.env.CUSTOMER_JOURNEY_ORIGIN;
const dir =
  process.env.CUSTOMER_JOURNEY_EVIDENCE_DIR ??
  "/private/tmp/cross-journey-local-20261024";
let browser, preview;
const clinics = [
  {
    id: "clinic-phone",
    name: "虛構除毛院所",
    address: "臺北市信義區測試路1號",
    phone: "0200000000",
    facility_type: "aesthetic",
    departments: [],
    service_names: ["elysion冰氛除毛"],
    online_booking_enabled: false,
    phone_booking_enabled: true,
  },
  {
    id: "clinic-online",
    name: "虛構諮詢院所",
    address: "高雄市三民區測試路1號",
    phone: null,
    facility_type: "aesthetic",
    departments: [],
    service_names: ["肌膚諮詢"],
    online_booking_enabled: true,
  },
];
before(async () => {
  if (!external) assert.equal(buildProblem(), null);
  preview = external
    ? { origin: external, stop() {} }
    : await startPreview(4405);
  browser = await chromium.launch({ executablePath: CHROME });
  await mkdir(dir, { recursive: true });
});
after(async () => {
  await browser?.close();
  preview?.stop();
});
async function guest(width = 390, dark = false, member = false) {
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    colorScheme: dark ? "dark" : "light",
  });
  const errors = [],
    writes = [];
  const state = { failMember: true };
  page.setDefaultTimeout(12000);
  page.on("pageerror", (e) => errors.push(e.message));
  if (member)
    await page.addInitScript(() =>
      localStorage.setItem("access_token", "journey-fixture"),
    );
  await page.route("**/api/**", (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname;
    if (!["GET", "HEAD"].includes(req.method()))
      writes.push({ path, body: req.postDataJSON() });
    const user = {
      id: "fixture-member",
      display_name: "虛構會員",
      email: "fixture@example.invalid",
      roles: ["patient"],
      facility_id: null,
      is_active: true,
    };
    let body =
      path === "/api/v1/booking/clinics"
        ? clinics
        : path === "/api/v1/service-categories"
          ? FALLBACK_TAXONOMY
          : path === "/api/v1/auth/me"
            ? user
            : [];
    let status = 200;
    if (path === "/api/join") body = { ok: true };
    if (path === "/api/v1/member/appointments") {
      status = state.failMember ? 500 : 200;
      body = state.failMember
        ? { detail: "虛構讀取失敗" }
        : [
            {
              id: "appointment-fixture",
              facility_name: "虛構預約院所",
              staff_name: "虛構專業人員",
              appointment_date: "2026-12-01",
              appointment_time: "09:00:00",
              status: "confirmed",
              booking_number: "FIXTURE-001",
            },
          ];
    }
    if (path === "/api/v1/member/patients" && state.failMember) {
      status = 500;
      body = { detail: "虛構讀取失敗" };
    }
    return route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  return { page, errors, writes, state };
}
async function fits(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
}

test("公開篩選可序列化並還原療程、地區、分類、預約方式與排序", () => {
  const qs =
    "q=elysion&city=臺北市&type=aesthetic&cat=aes_laser&online=1&sort=name";
  const filters = parseSearchFilters(new URLSearchParams(qs));
  const round = new URLSearchParams(searchFiltersQuery(filters, "name"));
  assert.deepEqual(parseSearchFilters(round), filters);
  assert.equal(round.get("sort"), "name");
});

test("手機及桌面兩端入口、登入轉向與院所示意可操作，亮暗色無溢出", async () => {
  for (const width of [320, 551, 1440])
    for (const dark of [false, true]) {
      const { page, errors, writes } = await guest(width, dark);
      try {
        await page.goto(preview.origin + "/");
        await page
          .getByRole("button", { name: "院所專區", exact: true })
          .click();
        const nav = page.getByRole("navigation", { name: "院所專區導覽" });
        await nav
          .getByRole("link", { name: "院所登入", exact: true })
          .waitFor();
        await fits(page);
        if (!dark)
          await page.screenshot({
            path: `${dir}/entry-${width}.png`,
            animations: "disabled",
          });
        await nav.getByRole("link", { name: "院所登入", exact: true }).click();
        await page.waitForURL("**/admin/login");
        await page
          .getByRole("link", { name: "前往會員登入", exact: true })
          .click();
        await page.waitForURL("**/auth");
        await page
          .getByRole("link", { name: "前往院所登入", exact: true })
          .waitFor();
        await page.goto(preview.origin + "/join#product-preview");
        await page
          .getByRole("tab", { name: "團隊使用的工作台", exact: true })
          .click();
        await page
          .getByText("今日工作台 · 示意資料", { exact: true })
          .waitFor();
        await fits(page);
        if (width !== 551)
          await page
            .locator("#product-preview")
            .screenshot({
              path: `${dir}/showcase-${width}-${dark}.png`,
              animations: "disabled",
            });
        assert.deepEqual(errors, []);
        assert.deepEqual(writes, []);
      } finally {
        await page.close();
      }
    }
});

test("療程搜尋、電話與線上預約的快速檢視、重新整理與返回一致", async () => {
  const { page, errors, writes } = await guest();
  try {
    await page.goto(preview.origin + "/search");
    const input = page.getByRole("textbox", {
      name: "搜尋院所、療程、專業人員或地址",
    });
    await input.fill("elysion");
    await page.getByText("虛構除毛院所", { exact: true }).waitFor();
    await page.waitForURL((url) => url.searchParams.get("q") === "elysion");
    assert.equal(
      await page.getByText("虛構諮詢院所", { exact: true }).count(),
      0,
    );
    await page.getByRole("button", { name: "快速檢視", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("link", { name: "電話預約", exact: true }).waitFor();
    assert.equal(
      await dialog
        .getByRole("link", { name: "查看可約時段", exact: true })
        .count(),
      0,
    );
    await page.keyboard.press("Escape");
    await input.fill("");
    await page
      .getByRole("button", { name: "只看可線上預約", exact: true })
      .click();
    await page.waitForURL((url) => url.searchParams.get("online") === "1");
    await page.reload();
    await page.getByText("虛構諮詢院所", { exact: true }).waitFor();
    assert.equal(
      await page.getByText("虛構除毛院所", { exact: true }).count(),
      0,
    );
    const saved = page.url();
    await page.goto(preview.origin + "/auth");
    await page.goBack();
    await page.getByText("虛構諮詢院所", { exact: true }).waitFor();
    assert.equal(page.url(), saved);
    await page.getByRole("button", { name: "快速檢視", exact: true }).click();
    await dialog
      .getByRole("link", { name: "查看可約時段", exact: true })
      .waitFor();
    await fits(page);
    await page.screenshot({
      path: `${dir}/search-online.png`,
      animations: "disabled",
    });
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
  } finally {
    await page.close();
  }
});

test("選擇方案延續到申請與通知內容，所有送出均為虛構 API", async () => {
  const { page, errors, writes } = await guest();
  try {
    await page.goto(preview.origin + "/pricing");
    await page
      .getByRole("link", { name: "申請院所導入 （專業版）", exact: true })
      .click();
    await page.waitForURL("**/join/apply?plan=pro");
    await page
      .getByText("目前想了解：專業版，可在服務資訊步驟調整。", { exact: true })
      .waitFor();
    await page.getByRole("button", { name: "下一步", exact: true }).click();
    await page.getByLabel("商家名稱").fill("虛構測試診所");
    await page.getByLabel("聯絡人姓名").fill("虛構負責人");
    await page.getByLabel("聯絡電話").fill("0900000000");
    await page
      .getByLabel("Email", { exact: false })
      .fill("fixture@example.invalid");
    await page.getByRole("combobox", { name: "縣市" }).click();
    await page.getByRole("option", { name: "臺北市", exact: true }).click();
    await page.getByRole("button", { name: "下一步", exact: true }).click();
    await page.getByRole("combobox", { name: "想了解的方案" }).click();
    await page
      .getByRole("option", { name: "標準版 NT$3,000／月", exact: true })
      .click();
    await page.getByLabel("備註 / 想了解的服務").fill("虛構需求");
    await page.screenshot({
      path: `${dir}/plan-interest.png`,
      animations: "disabled",
    });
    await page
      .getByRole("button", { name: "送出加入申請", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "輸入驗證碼，立即開通後台", exact: true })
      .waitFor();
    assert.equal(writes.length, 1);
    assert.match(writes[0].body.message, /方案意向：標準版（待確認，非訂購）/);
    assert.match(writes[0].body.message, /虛構需求/);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("會員讀取失敗不偽裝空預約，重試後最近預約位於個人資料之前", async () => {
  const { page, errors, state } = await guest(390, false, true);
  try {
    await page.goto(preview.origin + "/member");
    await page
      .getByRole("button", { name: "重新載入預約", exact: true })
      .waitFor();
    assert.equal(
      await page.getByText("目前沒有即將到來的預約", { exact: true }).count(),
      0,
    );
    assert.equal(await page.locator('[data-slot="tabs-list"]').count(), 0);
    await page.screenshot({
      path: `${dir}/member-error.png`,
      animations: "disabled",
    });
    state.failMember = false;
    await page
      .getByRole("button", { name: "重新載入預約", exact: true })
      .click();
    await page.locator('[role="tabpanel"]:visible').getByText("虛構預約院所", { exact: true }).waitFor();
    const appointment = await page
      .locator('[role="tabpanel"]:visible')
      .getByText("虛構預約院所", { exact: true })
      .boundingBox();
    const profile = await page
      .getByRole("heading", { name: "虛構會員", exact: true })
      .boundingBox();
    assert(appointment.y < profile.y);
    assert(appointment.y < 900);
    await fits(page);
    await page.screenshot({
      path: `${dir}/member-ready.png`,
      animations: "disabled",
    });
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("院所上線清單區分方案與時段，僅查詢 API 且失敗可重試", async () => {
  const { page, state, requests, errors } = await setupComplete(
    browser,
    preview.origin,
    { role: "facility_admin", width: 390, free: true },
  );
  let failSlots = false;
  await page.route("**/api/v1/booking/clinics/*/slots*", (route) =>
    route.fulfill({
      status: failSlots ? 500 : 200,
      contentType: "application/json",
      body: JSON.stringify(
        failSlots
          ? { detail: "虛構錯誤" }
          : [
              {
                date: "2026-12-01",
                slots: [{ id: "slot", time: "09:00", isAvailable: true }],
              },
            ],
      ),
    }),
  );
  try {
    await page.goto(preview.origin + "/admin/dashboard");
    const panel = page
      .locator("details")
      .filter({
        has: page.locator("summary", { hasText: "院所門面與預約上線檢查" }),
      });
    await panel.locator("summary").click();
    await page.waitForFunction(
      () =>
        document.querySelector("details ul")?.getAttribute("aria-busy") ===
        "false",
    );
    assert.match(await panel.innerText(), /免費版可展示門面/);
    assert.equal(
      requests.filter((r) => r.path.endsWith("/start-trial")).length,
      0,
    );
    await panel.screenshot({
      path: `${dir}/readiness-free.png`,
      animations: "disabled",
    });
    state.clinic.subscription_plan = "standard";
    await page.reload();
    await panel.locator("summary").click();
    await page.waitForFunction(() =>
      document
        .querySelector("details ul")
        ?.textContent.includes("已找到可預約時段"),
    );
    failSlots = true;
    await panel
      .getByRole("button", { name: "重新檢查設定", exact: true })
      .click();
    await panel
      .getByText("時段讀取失敗，請重新檢查。", { exact: true })
      .waitFor();
    failSlots = false;
    await panel
      .getByRole("button", { name: "重新檢查設定", exact: true })
      .click();
    await panel
      .getByText("已找到可預約時段；名額以客人送出時為準。", { exact: true })
      .waitFor();
    await fits(page);
    await panel.screenshot({
      path: `${dir}/readiness-paid.png`,
      animations: "disabled",
    });
    assert.deepEqual(errors, []);
    assert.equal(requests.filter((r) => r.method !== "GET").length, 0);
  } finally {
    await page.close();
  }
});

test("慢速載入互動程式時先停用操作，就緒後首次操作可完成", async () => {
  for (const path of ["/", "/search", "/join", "/join/apply"]) {
    const { page, errors } = await guest(390);
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    await page.route("**/_app/immutable/**/*.js", async (route) => { await gate; await route.continue(); });
    try {
      await page.goto(preview.origin + path, { waitUntil: "commit" });
      const control = path === "/" ? page.getByRole("button", { name: "院所專區", exact: true }) : path === "/search" ? page.getByRole("textbox", { name: "搜尋院所、療程、專業人員或地址" }) : path === "/join" ? page.getByRole("tab", { name: "團隊使用的工作台", exact: true }) : page.getByRole("button", { name: "下一步", exact: true });
      await control.waitFor({ state: "visible" });
      assert.equal(await control.isDisabled(), true, path);
      release();
      if (path === "/search") { await control.fill("elysion"); await page.waitForURL((url) => url.searchParams.get("q") === "elysion"); }
      else { await control.click();
        if (path === "/") await page.getByRole("navigation", { name: "院所專區導覽" }).waitFor();
        if (path === "/join") await page.getByText("今日工作台 · 示意資料", { exact: true }).waitFor();
        if (path === "/join/apply") await page.getByRole("heading", { name: "基本資料", exact: true }).waitFor();
      }
      assert.deepEqual(errors, []);
    } finally { release(); await page.close(); }
  }
});

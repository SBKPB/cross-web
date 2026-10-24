import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";
import { buildProblem, CHROME, startPreview } from "./support/built-app.mjs";
import { setupComplete, facilityId } from "./support/admin-complete.mjs";
import { getServicePriceBadge } from "../src/lib/service-price.ts";
let preview, browser;
const origin = process.env.SERVICE_PRICE_ORIGIN;
const dir =
  process.env.SERVICE_PRICE_EVIDENCE_DIR ??
  "/private/tmp/cross-service-price-local-20261024";
before(async () => {
  if (!origin) assert.equal(buildProblem(), null);
  preview = origin ? { origin, stop() {} } : await startPreview(4401);
  browser = await chromium.launch({ executablePath: CHROME });
  await mkdir(dir, { recursive: true });
});
after(async () => {
  await browser?.close();
  preview?.stop();
});

test("隱藏價格不顯示金額、免費或健保標籤，既有公開價格規則仍有效", () => {
  for (const payment of ["nhi", "both", "self_pay", undefined])
    for (const price of [0, 1250])
      assert.equal(getServicePriceBadge(price, payment, false), null);
  assert.equal(getServicePriceBadge(1250, "self_pay").label, "NT$ 1,250");
  assert.equal(getServicePriceBadge(0, "nhi").label, "健保給付");
  assert.equal(getServicePriceBadge(0, "self_pay"), null);
});

test("服務價格設定可儲存與重新開啟，失敗保留表單，預約流程遵守公開開關", async () => {
  for (const width of [360, 1440]) {
    const { page, state, requests, errors } = await setupComplete(
      browser,
      preview.origin,
      { width },
    );
    const service = state.services[0];
    Object.assign(service, {
      service_name: "虛構冰氛除毛",
      price: 1250,
      show_price: true,
    });
    const admin = `${preview.origin}/admin/clinics/${facilityId}?tab=services`;
    const row = () =>
      page
        .getByRole("listitem")
        .filter({
          has: page.getByRole("heading", {
            name: service.service_name,
            exact: true,
          }),
        });
    try {
      await page.goto(admin);
      await row()
        .getByRole("button", { name: "編輯服務", exact: true })
        .click();
      const checkbox = page.getByRole("checkbox", {
        name: "對客戶顯示價格",
        exact: true,
      });
      await checkbox.waitFor();
      assert.equal(await checkbox.isChecked(), true);
      await checkbox.uncheck();
      state.fail = "/services/" + service.id;
      await page.getByRole("button", { name: "儲存服務", exact: true }).click();
      await page
        .getByRole("alert")
        .getByText("虛構測試：暫時儲存失敗")
        .waitFor();
      assert.equal(await checkbox.isChecked(), false);
      assert.equal(service.show_price, true);
      state.fail = "";
      await page.getByRole("button", { name: "儲存服務", exact: true }).click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      await row().getByText("30 分鐘 · 不公開價格", { exact: true }).waitFor();
      assert.equal(service.price, 1250);
      assert.equal(service.show_price, false);
      const patch = requests
        .filter(
          (r) =>
            r.method === "PATCH" && r.path.endsWith("/services/" + service.id),
        )
        .at(-1);
      assert.equal(patch.body.show_price, false);
      assert.equal(patch.body.price, 1250);
      await page.goto(admin);
      await row()
        .getByRole("button", { name: "編輯服務", exact: true })
        .click();
      assert.equal(await checkbox.isChecked(), false);
      assert.equal(
        await page.getByLabel("價格（元）", { exact: true }).inputValue(),
        "1250",
      );
      await page.screenshot({
        path: `${dir}/editor-${width}.png`,
        animations: "disabled",
      });
      await page.getByRole("button", { name: "取消", exact: true }).click();
      await page.route("**/api/v1/booking/**", (route) => {
        const path = new URL(route.request().url()).pathname;
        let body = [];
        if (path.endsWith("/config"))
          body = {
            id: facilityId,
            clinic_name: "虛構價格測試院所",
            online_booking_enabled: true,
            payment_type: "both",
            primary_color: "#1d4ed8",
          };
        if (path.endsWith("/services"))
          body = state.services.map((s) => ({
            ...s,
            price: s.show_price === false ? 0 : s.price,
          }));
        if (path.endsWith("/doctors"))
          body = [
            {
              id: "fixture-doctor",
              name: "虛構醫師",
              title: "醫師",
              is_bookable: true,
            },
          ];
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(body),
        });
      });
      await page.goto(`${preview.origin}/booking/${facilityId}`);
      const card = page.getByRole("button", { name: /虛構冰氛除毛/ });
      await card.waitFor();
      assert.match(await card.innerText(), /30 分鐘/);
      assert.doesNotMatch(await card.innerText(), /NT\$|健保給付|免費/);
      await card.click();
      assert.equal(await card.getAttribute("aria-pressed"), "true");
      await page.screenshot({
        path: `${dir}/booking-hidden-${width}.png`,
        animations: "disabled",
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.goto(admin);
      await row()
        .getByRole("button", { name: "編輯服務", exact: true })
        .click();
      await checkbox.check();
      await page.getByRole("button", { name: "儲存服務", exact: true }).click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      await page.goto(`${preview.origin}/booking/${facilityId}`);
      await page
        .getByRole("button", { name: /虛構冰氛除毛/ })
        .getByText("NT$ 1,250", { exact: true })
        .waitFor();
      await page.goto(admin);
      await page.getByRole("button", { name: "新增服務", exact: true }).click();
      await page
        .getByLabel("服務名稱", { exact: true })
        .fill("虛構不公開金額服務");
      await checkbox.uncheck();
      await page.getByLabel("價格（元）", { exact: true }).fill("");
      await page.getByRole("button", { name: "儲存服務", exact: true }).click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      assert.equal(state.services.at(-1).show_price, false);
      assert.equal(state.services.at(-1).price, 0);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  }
});

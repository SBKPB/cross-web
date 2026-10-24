import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";
import { buildProblem, CHROME, startPreview } from "./support/built-app.mjs";
import { setupComplete, facilityId } from "./support/admin-complete.mjs";
let preview, browser;
const origin = process.env.MAPS_ORIGIN;
const evidence = process.env.MAPS_EVIDENCE_DIR;
const point = { latitude: 25.0339, longitude: 121.5645 };
const full =
  "https://www.google.com/maps/place/Fixture/@24,120,15z/data=!3d25.0339!4d121.5645";
const input = (page) =>
  page.getByLabel("Google 地圖分享連結（選填）", { exact: true });
const path = `/admin/clinics/${facilityId}?tab=info`;
const patch = (requests) =>
  requests
    .filter(
      (r) =>
        r.method === "PATCH" &&
        r.path === `/api/v1/medical-facilities/${facilityId}`,
    )
    .at(-1)?.body;
before(async () => {
  if (!origin) assert.equal(buildProblem(), null);
  preview = origin ? { origin, stop() {} } : await startPreview(4397);
  browser = await chromium.launch({ executablePath: CHROME });
  if (evidence) await mkdir(evidence, { recursive: true });
});
after(async () => {
  await browser?.close();
  preview?.stop();
});
async function edit(page) {
  await page.goto(preview.origin + path);
  await page.getByRole("button", { name: "編輯資訊", exact: true }).click();
}
async function saved(page) {
  await page.getByRole("button", { name: "儲存院所", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
}

test("地圖表單：新增院所貼上完整連結自動取得位置，不需輸入經緯度", async () => {
  const { page, requests, errors } = await setupComplete(
    browser,
    preview.origin,
  );
  try {
    await page.goto(preview.origin + "/admin/clinics");
    await page.getByRole("button", { name: "新增院所", exact: true }).click();
    await page.getByLabel("院所名稱", { exact: true }).fill("虛構地圖測試院所");
    await input(page).fill(full);
    await page
      .getByText("已取得地圖位置，儲存院所後生效。", { exact: true })
      .waitFor();
    assert.equal(await page.getByLabel("緯度", { exact: true }).count(), 0);
    assert.equal(await page.getByLabel("經度", { exact: true }).count(), 0);
    assert.equal(
      await page
        .getByRole("link", { name: "在 Google 地圖確認" })
        .getAttribute("href"),
      "https://www.google.com/maps/search/?api=1&query=25.0339,121.5645",
    );
    await saved(page);
    const body = requests.find(
      (r) => r.method === "POST" && r.path === "/api/v1/medical-facilities/",
    ).body;
    assert.equal(body.latitude, point.latitude);
    assert.equal(body.longitude, point.longitude);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("地圖表單：既有位置保留；取消移除不生效，確認儲存才清除位置", async () => {
  const { page, state, requests, errors } = await setupComplete(
    browser,
    preview.origin,
  );
  Object.assign(state.clinic, point);
  try {
    await edit(page);
    await page.getByText("已設定地圖位置", { exact: true }).waitFor();
    await saved(page);
    assert.equal(patch(requests).latitude, point.latitude);
    await page.getByRole("button", { name: "編輯資訊", exact: true }).click();
    await page.getByRole("button", { name: "移除位置", exact: true }).click();
    await page.getByRole("button", { name: "取消", exact: true }).click();
    await page.getByRole("button", { name: "編輯資訊", exact: true }).click();
    await page.getByText("已設定地圖位置", { exact: true }).waitFor();
    await page.getByRole("button", { name: "移除位置", exact: true }).click();
    await saved(page);
    assert.equal(patch(requests).latitude, null);
    assert.equal(patch(requests).longitude, null);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("地圖表單：短連結失敗可重試，未解析不可儲存，姓名地址不被改寫", async () => {
  const { page, state, requests, errors } = await setupComplete(
    browser,
    preview.origin,
  );
  Object.assign(state.clinic, { latitude: 24, longitude: 120 });
  let calls = 0;
  await page.route("**/api/maps/resolve", (route) => {
    calls++;
    assert.equal(
      route.request().headers().authorization,
      "Bearer fixture-only",
    );
    assert.equal(
      route.request().postDataJSON().url,
      "https://maps.app.goo.gl/FixturePlace",
    );
    return route.fulfill({
      status: calls === 1 ? 422 : 200,
      contentType: "application/json",
      body: JSON.stringify(
        calls === 1 ? { detail: "虛構測試：請重新複製分享連結" } : point,
      ),
    });
  });
  try {
    await edit(page);
    await page.getByLabel("院所名稱", { exact: true }).fill("保留的院所名稱");
    await page.getByLabel("地址", { exact: true }).fill("保留的院所地址");
    await input(page).fill("https://maps.app.goo.gl/FixturePlace");
    await page
      .getByRole("alert")
      .filter({ hasText: "請重新複製分享連結" })
      .waitFor();
    await page.getByRole("button", { name: "儲存院所", exact: true }).click();
    assert.equal(patch(requests), undefined);
    await page.getByRole("button", { name: "解析位置", exact: true }).click();
    await page
      .getByText("已取得地圖位置，儲存院所後生效。", { exact: true })
      .waitFor();
    await saved(page);
    assert.equal(patch(requests).latitude, point.latitude);
    assert.equal(patch(requests).name, "保留的院所名稱");
    assert.equal(patch(requests).address, "保留的院所地址");
    assert.equal(calls, 2);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("地圖表單：更換連結忽略遲到結果，解析中不能儲存，清空失敗輸入可保留既有位置", async () => {
  const { page, state, requests, errors } = await setupComplete(
    browser,
    preview.origin,
  );
  Object.assign(state.clinic, { latitude: 24, longitude: 120 });
  let held, received;
  const ready = new Promise((resolve) => {
    received = resolve;
  });
  await page.route("**/api/maps/resolve", (route) => {
    held = route;
    received();
  });
  try {
    await edit(page);
    await input(page).fill("https://maps.app.goo.gl/SlowFixture");
    await ready;
    assert.equal(
      await page
        .getByRole("button", { name: "位置解析中…", exact: true })
        .isDisabled(),
      true,
    );
    await input(page).fill(full);
    await page
      .getByText("已取得地圖位置，儲存院所後生效。", { exact: true })
      .waitFor();
    await held
      .fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ latitude: 23, longitude: 119 }),
      })
      .catch(() => {});
    await saved(page);
    assert.equal(patch(requests).latitude, point.latitude);
    await page.getByRole("button", { name: "編輯資訊", exact: true }).click();
    await input(page).fill("https://example.invalid/not-maps");
    await page.getByRole("alert").filter({ hasText: "位置解析失敗" }).waitFor();
    await input(page).fill("");
    await saved(page);
    assert.equal(patch(requests).latitude, point.latitude);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("地圖表單：手機／平板／桌機亮暗色可貼上及核對，沒有橫向溢出", async () => {
  for (const width of [360, 768, 1440])
    for (const theme of ["light", "dark"]) {
      const { page, errors } = await setupComplete(browser, preview.origin, {
        width,
      });
      try {
        await page.addInitScript(
          (value) => localStorage.setItem("theme", value),
          theme,
        );
        await edit(page);
        await input(page).fill(full);
        await page
          .getByText("已取得地圖位置，儲存院所後生效。", { exact: true })
          .waitFor();
        await page
          .getByRole("link", { name: "在 Google 地圖確認" })
          .evaluate((el) =>
            el.scrollIntoView({ block: "center", behavior: "instant" }),
          );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        assert.equal(
          await page
            .getByRole("dialog")
            .evaluate((el) => el.scrollWidth > el.clientWidth),
          false,
        );
        const box = await page
          .getByRole("link", { name: "在 Google 地圖確認" })
          .boundingBox();
        assert.ok(box.height >= 44);
        if (evidence)
          await page.screenshot({
            path: `${evidence}/maps-${width}-${theme}.png`,
          });
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    }
});

import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";
import { startPreview, buildProblem, CHROME } from "./support/built-app.mjs";
let preview, browser;
const origin = process.env.HEADER_ROLE_ORIGIN;
const dir =
  process.env.HEADER_ROLE_EVIDENCE_DIR ??
  "/private/tmp/cross-header-role-local-20261024";
before(async () => {
  if (!origin) assert.equal(buildProblem(), null);
  preview = origin ? { origin, stop() {} } : await startPreview(4404);
  browser = await chromium.launch({ executablePath: CHROME });
  await mkdir(dir, { recursive: true });
});
after(async () => {
  await browser?.close();
  preview?.stop();
});
async function fixture(roles, width, gate) {
  const page = await browser.newPage({ viewport: { width, height: 900 } }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (roles)
    await page.addInitScript(() =>
      localStorage.setItem("access_token", "header-role-fixture"),
    );
  const user = {
    id: "fixture-user",
    email: "fixture@example.invalid",
    display_name: "虛構會員",
    roles: roles ?? [],
    facility_id: roles?.some((r) => r.startsWith("facility_"))
      ? "11111111-2222-3333-4444-555555555555"
      : null,
    is_active: true,
  };
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/auth/me" && gate) await gate;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(path === "/api/v1/auth/me" ? user : []),
    });
  });
  return { page, errors };
}
async function fits(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
}

test("平台及院所管理帳號只顯示一個管理後台入口，手機亦有完整名稱", async () => {
  for (const roles of [
    ["admin"],
    ["superadmin"],
    ["facility_admin"],
    ["facility_staff"],
    ["patient", "admin"],
  ])
    for (const width of [360, 1440]) {
      const { page, errors } = await fixture(roles, width);
      try {
        await page.goto(preview.origin + "/pricing");
        const nav = page.getByRole("navigation", {
          name: "主要導覽",
          exact: true,
        });
        const admin = nav.getByRole("link", { name: "管理後台", exact: true });
        await admin.waitFor();
        assert.equal(await admin.count(), 1);
        assert.equal(await admin.getAttribute("href"), "/admin/dashboard");
        assert.equal(
          await nav
            .getByRole("link", { name: "我的預約", exact: true })
            .count(),
          0,
        );
        assert.equal(await nav.locator('a[href="/member"]').count(), 0);
        assert((await admin.boundingBox()).height >= 44);
        await fits(page);
        assert.deepEqual(errors, []);
        if (roles.length === 1 && roles[0] === "admin")
          await page.screenshot({
            path: `${dir}/admin-${width}.png`,
            animations: "disabled",
          });
      } finally {
        await page.close();
      }
    }
});

test("一般會員與訪客保留我的預約，首頁與方案頁在窄螢幕也不溢出", async () => {
  for (const roles of [null, ["patient"]])
    for (const width of [320, 768, 1440]) {
      const { page, errors } = await fixture(roles, width);
      try {
        for (const path of ["/pricing", "/"]) {
          await page.goto(preview.origin + path);
          const nav = page.getByRole("navigation", {
            name: "主要導覽",
            exact: true,
          });
          await nav
            .getByRole("link", { name: "我的預約", exact: true })
            .waitFor();
          assert.equal(
            await nav
              .getByRole("link", { name: "管理後台", exact: true })
              .count(),
            0,
          );
          assert.equal(
            await nav
              .getByRole("link", { name: "我的預約", exact: true })
              .getAttribute("href"),
            "/member",
          );
          await fits(page);
        }
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    }
});

test("確認登入身分期間不顯示錯誤的會員導覽，完成後才顯示管理後台", async () => {
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  const { page, errors } = await fixture(["admin"], 360, gate);
  try {
    const request = page.waitForRequest("**/api/v1/auth/me");
    await page.goto(preview.origin + "/pricing");
    await request;
    const nav = page.getByRole("navigation", { name: "主要導覽", exact: true });
    assert.equal(
      await nav.getByRole("link", { name: "我的預約", exact: true }).count(),
      0,
    );
    assert.equal(
      await nav.getByRole("link", { name: "管理後台", exact: true }).count(),
      0,
    );
    release();
    await nav.getByRole("link", { name: "管理後台", exact: true }).waitFor();
    assert.equal(
      await nav.getByRole("link", { name: "我的預約", exact: true }).count(),
      0,
    );
    assert.deepEqual(errors, []);
  } finally {
    release();
    await page.close();
  }
});

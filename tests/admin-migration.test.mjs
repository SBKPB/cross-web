import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { chromium } from 'playwright-core';
import { buildProblem, CHROME, startPreview } from './support/built-app.mjs';

const id = '11111111-2222-3333-4444-555555555555';
const clinic = {
  id, name: '虛構遷移測試院所', hospital_level: 'clinic', facility_type: 'aesthetic', payment_type: 'self_pay',
  phone: '0200000000', address: '虛構地址', description: '', logo_url: null, hero_banner: null,
  is_active: true, is_public: true, service_categories: [], business_hours: null, slot_duration: 30,
  show_schedule: true, online_booking_enabled: true, phone_booking_enabled: true, primary_color: '#1d4ed8',
  subscription_plan: 'pro', subscription_status: 'active', subscription_started_at: '2026-01-01T00:00:00Z',
  subscription_expires_at: '2030-01-01T00:00:00Z', trial_used_at: null,
  created_at: '2026-01-01T00:00:00Z', updated_at: null,
};
const account = (role = 'superadmin') => ({
  id: 'user-test', email: 'admin@example.invalid', display_name: '虛構管理員', roles: [role], is_active: true,
  facility_id: role.startsWith('facility_') ? id : null, facility: role.startsWith('facility_') ? clinic : null,
  phone_number: null, last_booked_member_patient_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: null,
});
let preview, browser;
before(async () => {
  assert.equal(buildProblem(), null);
  preview = await startPreview(4344);
  browser = await chromium.launch({ executablePath: CHROME });
});
after(async () => { await browser?.close(); preview?.stop(); });

async function setup({ role = 'superadmin', authenticated = true } = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  if (authenticated) await page.addInitScript(() => { localStorage.setItem('access_token', 'local-test'); localStorage.setItem('refresh_token', 'local-refresh'); });
  await page.route('**/api/v1/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    requests.push({ path, method: request.method(), contentType: request.headers()['content-type'], body: request.postData() });
    const json = value => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) });
    if (path === '/api/v1/auth/me') return json(account(role));
    if (path === '/api/v1/auth/login') return json({ access_token: 'local-test', refresh_token: 'local-refresh', token_type: 'bearer' });
    if (path === '/api/v1/service-categories') return json({
      facility_types: ['healthcare', 'aesthetic', 'beauty', 'other'].map(value => ({ value, label: value, categories: [] })),
      payment_types: [{ value: 'nhi', label: '健保' }, { value: 'self_pay', label: '自費' }, { value: 'both', label: '健保+自費' }],
    });
    if (path === '/api/v1/medical-facilities/') return json([clinic]);
    if (path === `/api/v1/medical-facilities/${id}`) return json(clinic);
    if (path.endsWith('/logo')) return json({ ...clinic, logo_url: '/cross-icon.png' });
    if (path.endsWith('/analytics/visitor-count')) return json({ range_days: 30, visitor_count: 0, page_view_count: 0 });
    if (path.endsWith('/analytics/doctor-durations')) return json({ range_days: 30, doctors: [] });
    if (path.endsWith('/analytics')) return json({ range_days: 30, granularity: 'day', start_date: '2026-10-01', end_date: '2026-10-23', total: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0, no_show_rate: 0, unique_patients: 0, repeat_patient_rate: 0, trend: [], by_method: [], by_hour: [] });
    if (path.endsWith('/queue')) return json({ facility_id: id, date: '2026-10-23', groups: [] });
    if (path.endsWith('/queue-board')) return json({ enabled: true, facility_name: clinic.name, date: '2026-10-23', groups: [{ staff_name: '虛構醫師', current_number: 7, waiting_count: 1, estimated_wait_minutes: 10, appointments: [{ queue_number: 7, masked_name: '王＊明', status: 'in_progress' }] }] });
    if (path.endsWith('/users/')) return json([{ ...account(role), roles: ['superadmin'] }]);
    if (path.endsWith('/roles/')) return json([{ id: 'role', name: 'superadmin', display_name: '系統管理員' }]);
    return json([]);
  });
  return { page, errors, requests };
}

test('未登入後台轉至登入頁；登入與登出沿用 Svelte 的同一份 token 狀態', async () => {
  const { page, errors } = await setup({ authenticated: false });
  try {
    await page.goto(preview.origin + '/admin/users');
    await page.waitForURL('**/admin/login');
    await page.getByLabel('電子郵件').fill('admin@example.invalid');
    await page.getByLabel('密碼', { exact: true }).fill('local-only-test-password');
    await page.getByRole('button', { name: '登入', exact: true }).click();
    await page.waitForURL('**/admin/dashboard');
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('access_token')), 'local-test');
    await page.getByRole('button', { name: /登出/ }).click();
    await page.waitForURL('**/admin/login');
    assert.equal(await page.evaluate(() => localStorage.getItem('access_token')), null);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('系統管理頁可載入；院所工作區保留設定、對話框與 multipart Logo 上傳', async () => {
  const { page, errors, requests } = await setup();
  try {
    for (const path of ['/admin/users', '/admin/settings', '/admin/applications', '/admin/clinics']) {
      await page.goto(preview.origin + path);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.waitForLoadState('networkidle');
    }
    await page.goto(`${preview.origin}/admin/clinics/${id}`);
    await page.locator('[data-native-workspace]').waitFor();
    for (const tab of ['personnel', 'services', 'schedule', 'announcements', 'patients', 'queue', 'stats', 'analytics']) {
      await page.goto(`${preview.origin}/admin/clinics/${id}?tab=${tab}`);
      await page.waitForLoadState('networkidle');
    }
    await page.goto(`${preview.origin}/admin/clinics/${id}?tab=info`);
    await page.getByRole('button', { name: '編輯資訊' }).click();
    await page.waitForTimeout(200);
    assert.deepEqual(errors, [], '開啟編輯對話框時不應發生執行錯誤');
    await page.getByRole('dialog').waitFor();
    await page.locator('input[type=file]').first().setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jv9kAAAAASUVORK5CYII=', 'base64') });
    await page.waitForResponse(response => new URL(response.url()).pathname.endsWith('/logo'));
    const upload = requests.find(request => request.path.endsWith('/logo') && request.method === 'POST');
    assert.match(upload?.contentType ?? '', /multipart\/form-data; boundary=/);
    assert.match(upload?.body ?? '', /name="file"; filename="logo.png"/);
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('院所帳號在掛載前擋下系統管理頁及其他院所，沒有發出越權 API 請求', async () => {
  const { page, errors, requests } = await setup({ role: 'facility_admin' });
  try {
    await page.goto(preview.origin + '/admin/users');
    await page.waitForURL('**/admin/dashboard');
    assert.equal(requests.some(request => request.path === '/api/v1/users/'), false);
    await page.goto(preview.origin + '/admin/clinics/not-owned');
    await page.waitForURL('**/admin/dashboard');
    assert.equal(requests.some(request => request.path.includes('not-owned')), false);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('Svelte 看板只呈現遮罩姓名；Svelte 文件 SSR、內頁導覽及未知 slug 正常', async () => {
  const { page, errors } = await setup({ authenticated: false });
  try {
    await page.goto(`${preview.origin}/display/${id}`);
    await page.getByText('王＊明', { exact: true }).waitFor();
    assert.equal(await page.title(), '候診叫號看板 | Cross');
    assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
    assert.doesNotMatch(await page.locator('body').innerText(), /王志明/);
    const response = await fetch(preview.origin + '/developers/docs/quickstart');
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /developer-document/);
    assert.match(html, /<h1/);
    assert.match(html, /<title>快速開始 · 開發者 \| Cross<\/title>/);
    const missing = await fetch(preview.origin + '/developers/docs/not-found');
    assert.equal(missing.status, 404);
    const missingHtml = await missing.text();
    assert.match(missingHtml, /<title>404: This page could not be found.<\/title>/);
    assert.match(missingHtml, /#organization/);
    await page.goto(preview.origin + '/developers');
    await page.getByRole('link', { name: /快速開始/ }).first().click();
    await page.waitForURL('**/developers/docs/quickstart');
    await page.locator('article').waitFor();
    assert.equal(await page.title(), '快速開始 · 開發者 | Cross');
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ['/developers', '/admin/login']) {
      await page.goto(preview.origin + path);
      await page.waitForLoadState('networkidle');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, path);
    }
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

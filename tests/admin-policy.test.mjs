import test from 'node:test';
import assert from 'node:assert/strict';
import { adminAccess } from '../src/lib/admin/policy.ts';
const user = (roles, facility_id = null) => ({ roles, facility_id });

test('身分載入完成前不掛載後台；未登入與民眾不能進入後台', () => {
  assert.equal(adminAccess('users', null, true).state, 'loading');
  assert.deepEqual(adminAccess('users', null, false), { state: 'redirect', href: '/admin/login' });
  assert.deepEqual(adminAccess('dashboard', user(['patient']), false), { state: 'redirect', href: '/' });
  assert.equal(adminAccess('login', null, true).state, 'allow');
});
test('院所帳號只能存取自己的院所，不能掛載系統管理頁', () => {
  for (const role of ['facility_admin', 'facility_staff']) {
    const account = user([role], 'own');
    for (const name of ['clinics', 'users', 'applications', 'settings']) assert.equal(adminAccess(name, account, false).state, 'redirect');
    assert.equal(adminAccess('clinic', account, false, 'other').state, 'redirect');
    assert.equal(adminAccess('clinic', account, false, 'own').state, 'allow');
    for (const name of ['dashboard', 'analytics', 'subscription']) assert.equal(adminAccess(name, account, false).state, 'allow');
  }
});
test('系統管理員可管理所有院所；沒有綁定院所的院所角色不能進後台', () => {
  for (const role of ['admin', 'superadmin']) for (const name of ['users', 'clinics', 'applications', 'settings', 'clinic']) assert.equal(adminAccess(name, user([role]), false, 'any').state, 'allow');
  assert.equal(adminAccess('dashboard', user(['facility_admin']), false).state, 'redirect');
});

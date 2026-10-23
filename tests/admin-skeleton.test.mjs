import assert from 'node:assert/strict';
import {after,before,test} from 'node:test';
import {chromium} from 'playwright-core';
import {startPreview,CHROME} from './support/built-app.mjs';
import {setupComplete,facilityId} from './support/admin-complete.mjs';
let preview,browser;
before(async()=>{preview=process.env.ADMIN_COMPLETE_ORIGIN?{origin:process.env.ADMIN_COMPLETE_ORIGIN,stop(){}}:await startPreview(4357);browser=await chromium.launch({executablePath:CHROME});});
after(async()=>{await browser?.close();preview?.stop();});

test('人員卡片慢速回應先顯示載入骨架；完成後可操作，減少動態設定生效',async()=>{
 const {page,errors}=await setupComplete(browser,preview.origin,{width:390});let release;const gate=new Promise(r=>release=r);
 try{await page.emulateMedia({reducedMotion:'reduce'});await page.route('**/medical-facilities/*/staff',async route=>{await gate;await route.fallback();});await page.goto(`${preview.origin}/admin/clinics/${facilityId}?tab=personnel`);
 const skeleton=page.locator('[data-admin-skeleton=cards]');await skeleton.waitFor();assert.equal(await skeleton.getAttribute('aria-busy'),'true');assert.equal(await skeleton.locator('[data-slot=skeleton]').first().evaluate(e=>getComputedStyle(e).animationDuration),'0s');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 release();await skeleton.waitFor({state:'detached'});await page.getByRole('button',{name:'檔案與編輯',exact:true}).first().click();await page.getByLabel('姓名',{exact:true}).waitFor();assert.deepEqual(errors,[]);
 }finally{release();await page.close();}
});

test('列表失敗會結束骨架並提供重試；重新成功後顯示資料',async()=>{
 const {page,errors}=await setupComplete(browser,preview.origin);let release;const gate=new Promise(r=>release=r);let fail=true;
 try{await page.route('**/api/v1/users/',async route=>{await gate;if(fail)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({detail:'虛構載入失敗'})});await route.fallback();});await page.goto(preview.origin+'/admin/users');await page.locator('[data-admin-skeleton=table]').waitFor();release();await page.getByRole('alert').getByText('虛構載入失敗').waitFor();assert.equal(await page.locator('[data-admin-skeleton]').count(),0);fail=false;await page.getByRole('button',{name:'重試使用者列表',exact:true}).click();await page.getByText('staff@example.invalid',{exact:true}).waitFor();assert.equal(await page.locator('[data-admin-skeleton]').count(),0);assert.deepEqual(errors,[]);
 }finally{release();await page.close();}
});

test('手機選單可前往設定與關閉；暗色主題可切換',async()=>{
 const {page,errors}=await setupComplete(browser,preview.origin,{width:390});
 try{await page.goto(`${preview.origin}/admin/clinics/${facilityId}?tab=personnel`);await page.getByRole('button',{name:/開啟(?:平台|後台)選單/}).click();const dialog=page.getByRole('dialog');await dialog.waitFor();await dialog.getByRole('link',{name:'客戶管理',exact:true}).click();await dialog.waitFor({state:'hidden'});await page.getByRole('heading',{name:'客戶管理',exact:true}).waitFor();await page.getByRole('button',{name:'切換主題',exact:true}).click();await page.getByRole('button',{name:'暗色',exact:true}).click();assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('dark')),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 }finally{await page.close();}
});

import assert from 'node:assert/strict';
import {after,before,test} from 'node:test';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {startPreview,CHROME} from './support/built-app.mjs';
import {setupComplete,facilityId} from './support/admin-complete.mjs';
import {setupWorkspace,today} from './support/admin-workspace.mjs';
let preview,browser;
const dir='/private/tmp/cross-admin-usability-20261023';
const path=tab=>`/admin/clinics/${facilityId}?tab=${tab}`;
before(async()=>{preview=process.env.ADMIN_COMPLETE_ORIGIN?{origin:process.env.ADMIN_COMPLETE_ORIGIN,stop(){}}:await startPreview(4361);browser=await chromium.launch({executablePath:CHROME});await mkdir(dir,{recursive:true});});
after(async()=>{await browser?.close();preview?.stop();});
async function tabState(page,name){const tab=page.getByRole('tab',{name,exact:true});await page.waitForFunction(name=>[...document.querySelectorAll('[role=tab]')].some(e=>{const panel=document.getElementById(e.getAttribute('aria-controls'));return e.textContent.trim()===name&&e.getAttribute('aria-selected')==='true'&&panel?.getAttribute('aria-labelledby')===e.id&&panel.getAttribute('data-value')===e.getAttribute('data-value')}),name);return tab.evaluate(e=>{const panel=document.getElementById(e.getAttribute('aria-controls'));const list=e.closest('[role=tablist]'),t=e.getBoundingClientRect(),l=list.getBoundingClientRect();return {background:getComputedStyle(e).backgroundColor,listBackground:getComputedStyle(list).backgroundColor,panel:!!panel,relation:panel?.getAttribute('aria-labelledby')===e.id,inside:t.top>=l.top&&t.bottom<=l.bottom,height:t.height}});}

test('設定 Tab 有清楚選取底色與內容關聯；手機換行不重疊，鍵盤與上一頁可用',async()=>{
 for(const width of [360,768,1440]){const {page,errors}=await setupComplete(browser,preview.origin,{width});try{await page.goto(preview.origin+path('info'));for(const name of ['院所設定','人員設定','服務項目','公告']){await page.getByRole('tab',{name,exact:true}).click();const state=await tabState(page,name);assert.notEqual(state.background,'rgba(0, 0, 0, 0)');assert.notEqual(state.background,state.listBackground);assert(state.panel&&state.relation);assert(state.inside,JSON.stringify(state));if(width===360)assert(state.height>=44);const list=await page.getByRole('tablist',{name:'院所設定分類'}).boundingBox(),panel=await page.getByRole('tabpanel').boundingBox();assert(list.y+list.height<=panel.y);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 await page.goBack();await tabState(page,'服務項目');await page.getByRole('tab',{name:'服務項目',exact:true}).focus();await page.keyboard.press('ArrowRight');await tabState(page,'公告');await page.screenshot({path:`${dir}/${width}-設定頁籤.png`,fullPage:true});assert.deepEqual(errors,[]);
 }finally{await page.close();}}
});

test('預約三種檢視切換保留選取底色與內容；暗色模式也可辨識',async()=>{
 const {page,errors}=await setupWorkspace(browser,preview.origin);try{await page.goto(preview.origin+path('appointments'));for(const name of ['清單','人員日曆','週行程']){await page.getByRole('tab',{name,exact:true}).click();const s=await tabState(page,name);assert(s.panel&&s.relation);assert.notEqual(s.background,s.listBackground);}await page.getByRole('button',{name:'切換主題',exact:true}).click();await page.getByRole('button',{name:'暗色',exact:true}).click();await page.waitForFunction(()=>document.documentElement.classList.contains('dark'));const state=await tabState(page,'週行程');assert.notEqual(state.background,state.listBackground);await page.screenshot({path:`${dir}/1440-暗色頁籤.png`,fullPage:true});assert.deepEqual(errors,[]);}finally{await page.close();}
});

test('平台管理員的今日工作台與訂閱保留院所情境，看診統計維持營運分析導覽選取',async()=>{
 const {page,errors}=await setupComplete(browser,preview.origin);try{await page.goto(preview.origin+path('info'));const nav=page.locator('aside nav');await nav.getByRole('link',{name:'今日工作台',exact:true}).click();await page.getByRole('heading',{name:'今日工作台',exact:true}).waitFor();assert(new URL(page.url()).pathname.includes(facilityId));await nav.getByRole('link',{name:'我的訂閱',exact:true}).click();await page.getByRole('heading',{name:'我的訂閱',exact:true}).waitFor();assert(new URL(page.url()).pathname.includes(facilityId));await page.goto(preview.origin+path('stats'));assert.equal(await nav.getByRole('link',{name:'營運分析',exact:true}).getAttribute('aria-current'),'page');assert.deepEqual(errors,[]);}finally{await page.close();}
});

test('隱藏篩選仍有摘要與清除入口，清除後保留日期且不把客戶搜尋寫進網址',async()=>{
 const {page,errors}=await setupWorkspace(browser,preview.origin,{width:390});try{await page.goto(`${preview.origin}/admin/dashboard?start=${today}&end=${today}&status=confirmed&staff=staff-1`);const applied=page.getByRole('status',{name:'已套用篩選',exact:true});await applied.getByText('已套用 2 項篩選',{exact:true}).waitFor();assert.equal(await page.getByLabel('預約狀態',{exact:true}).isVisible(),false);await page.getByLabel('搜尋客戶',{exact:true}).fill('找不到的虛構客戶');await applied.getByText('已套用 3 項篩選',{exact:true}).waitFor();assert(!page.url().includes('找不到'));await applied.getByRole('button',{name:'清除篩選',exact:true}).click();await page.waitForURL(url=>!url.searchParams.has('status')&&!url.searchParams.has('staff'));await page.getByRole('button',{name:'測試客人1',exact:true}).waitFor();assert.equal(new URL(page.url()).searchParams.get('start'),today);assert.equal(new URL(page.url()).searchParams.get('status'),null);assert.equal(await page.getByLabel('搜尋客戶',{exact:true}).inputValue(),'');assert.deepEqual(errors,[]);}finally{await page.close();}
});

test('空服務與帳號可直接建立，搜尋無結果可以清除回到列表',async()=>{
 const {page,state,errors}=await setupComplete(browser,preview.origin);state.services=[];state.users=[];
 try{await page.goto(preview.origin+path('services'));await page.getByRole('button',{name:'建立第一個服務',exact:true}).click();await page.getByRole('dialog').getByRole('heading',{name:'新增服務',exact:true}).waitFor();await page.keyboard.press('Escape');await page.goto(preview.origin+'/admin/users');await page.getByRole('button',{name:'建立第一個員工帳號',exact:true}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');state.users.push({id:'u-test',email:'fixture@example.invalid',roles:['facility_admin'],is_active:true});await page.goto(preview.origin+'/admin/users');await page.getByLabel('搜尋帳號',{exact:true}).fill('不存在');await page.getByRole('button',{name:'清除帳號搜尋',exact:true}).click();await page.getByText('fixture@example.invalid',{exact:true}).waitFor();await page.goto(preview.origin+'/admin/clinics');await page.getByLabel('搜尋院所',{exact:true}).fill('不存在');await page.getByRole('button',{name:'清除院所篩選',exact:true}).click();await page.getByRole('heading',{name:state.clinic.name,exact:true}).waitFor();assert.deepEqual(errors,[]);}finally{await page.close();}
});

test('長表單儲存失敗會捲到錯誤並保留輸入，手機儲存列仍可操作',async()=>{
 const {page,state,errors}=await setupComplete(browser,preview.origin,{width:390});try{await page.setViewportSize({width:390,height:480});await page.goto(preview.origin+path('services'));await page.getByRole('button',{name:'新增服務',exact:true}).click();const formArea=await page.locator('.admin-form').boundingBox();assert(formArea.height>=180);await page.getByLabel('服務名稱',{exact:true}).fill('虛構錯誤測試服務');state.fail='/services';await page.getByRole('button',{name:'儲存服務',exact:true}).click();const alert=page.getByRole('alert').getByText('虛構測試：暫時儲存失敗');await alert.waitFor();await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='alert');const box=await alert.boundingBox();assert(box.y>=0&&box.y+box.height<=480);assert.equal(await page.getByLabel('服務名稱',{exact:true}).inputValue(),'虛構錯誤測試服務');await page.screenshot({path:`${dir}/390-表單錯誤.png`});assert.deepEqual(errors,[]);}finally{await page.close();}
});

test('新增預約會說明缺少欄位，填妥後才啟用建立且短視窗可操作',async()=>{
 const {page,errors}=await setupWorkspace(browser,preview.origin,{width:390});try{await page.setViewportSize({width:390,height:480});await page.goto(preview.origin+'/admin/dashboard');await page.getByRole('button',{name:'＋ 新增預約',exact:true}).click();await page.getByLabel('客戶姓名 *',{exact:true}).fill('虛構客戶');await page.getByLabel('身分證字號 *',{exact:true}).fill('A123456789');await page.getByText('請選擇服務人員。',{exact:true}).waitFor();await page.getByLabel('服務人員 *',{exact:true}).selectOption('staff-1');await page.getByText('請選擇一個可用時段。',{exact:true}).waitFor();await page.getByRole('button',{name:'10:00',exact:true}).click();await page.getByText('資料已齊全，可以建立預約。',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'建立預約',exact:true}).isEnabled(),true);const footer=await page.getByRole('dialog').locator('[data-slot=dialog-footer]').boundingBox();assert(footer.y>=0&&footer.y+footer.height<=480);assert.deepEqual(errors,[]);}finally{await page.close();}
});

test('工作台試用先核對才送出，啟用失敗可見並可重試',async()=>{
 const {page,state,requests,errors}=await setupComplete(browser,preview.origin,{free:true,role:'facility_admin'});try{await page.goto(preview.origin+'/admin/dashboard');await page.getByRole('button',{name:'啟用 90 天試用',exact:true}).click();await page.getByRole('dialog').getByRole('heading',{name:'確認啟用 90 天試用',exact:true}).waitFor();assert.equal(requests.filter(r=>r.path.endsWith('/start-trial')).length,0);state.fail='/start-trial';await page.getByRole('button',{name:'確認啟用試用',exact:true}).click();await page.getByRole('alert').getByText('虛構測試：暫時儲存失敗').waitFor();state.fail='';await page.getByRole('button',{name:'確認啟用試用',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.getByRole('status').getByText('試用已啟用',{exact:true}).waitFor();assert.deepEqual(errors,[]);}finally{await page.close();}
});

test('預約正在送出時不能用 Esc 或遮罩誤關閉，完成後才結束操作',async()=>{
 const {page,state,errors}=await setupWorkspace(browser,preview.origin);let release;const gate=new Promise(r=>release=r);
 try{await page.route('**/appointments/appointment-0',async route=>{if(route.request().method()==='PATCH')await gate;await route.fallback();});await page.goto(preview.origin+path('appointments'));await page.getByRole('button',{name:'測試客人1',exact:true}).click();await page.getByRole('button',{name:'取消預約',exact:true}).click();const requested=page.waitForRequest(r=>r.method()==='PATCH'&&r.url().endsWith('/appointments/appointment-0'));await page.getByRole('button',{name:'確認取消預約',exact:true}).click();await requested;await page.getByRole('button',{name:'處理中…',exact:true}).waitFor();await page.keyboard.press('Escape');await page.mouse.click(4,4);assert.equal(await page.getByRole('dialog').isVisible(),true);release();await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(state.appointments[0].status,'cancelled');assert.deepEqual(errors,[]);}finally{release();await page.close();}
});

test('七日行程依畫面說明隱藏已取消預約，清單仍可查詢',async()=>{
 const {page,state,errors}=await setupWorkspace(browser,preview.origin);state.appointments.push({...state.appointments[0],id:'cancelled-fixture',patient_name:'已取消的虛構客戶',status:'cancelled'});
 try{await page.goto(preview.origin+path('appointments'));await page.getByRole('tab',{name:'週行程',exact:true}).click();await tabState(page,'週行程');const calendar=page.locator('[aria-label="七日預約行程"]');await calendar.waitFor();assert.equal(await calendar.getByText('已取消的虛構客戶',{exact:true}).count(),0);await page.getByRole('tab',{name:'清單',exact:true}).click();await tabState(page,'清單');await page.getByRole('button',{name:'已取消的虛構客戶',exact:true}).first().waitFor();assert.deepEqual(errors,[]);}finally{await page.close();}
});

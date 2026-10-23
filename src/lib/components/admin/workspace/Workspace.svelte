<script lang="ts">
  import { SvelteURL } from "svelte/reactivity";
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Button } from '#lib/components/ui/button/index.ts';
  import * as Dialog from '#lib/components/ui/dialog/index.ts';
  import ThemeToggle from '#lib/components/ThemeToggle.svelte';
  import { getAuth } from '#lib/auth/auth.svelte.ts';
  import { isSystemAdmin } from '#lib/auth/roles.ts';
  import { adminClinicsApi } from '#lib/api/admin/clinics.ts';
  import { clinicHref, PANEL_LABELS, SETTINGS_PANELS } from '#lib/admin/workspace.ts';
  import { apiMessage } from '#lib/admin/scheduling.ts';
  import { PLAN_LABELS, isExpired, canStartTrial, daysUntilExpiry } from '#lib/feature-access.ts';
  import type { MedicalFacility } from '#lib/types/clinic.ts';
  import Appointments from './Appointments.svelte';
  import Queue from './Queue.svelte';
  import Schedule from './Schedule.svelte';
  import Customers from './Customers.svelte';
  import ClinicEditor from '../manage/ClinicEditor.svelte';
  import Personnel from '../manage/Personnel.svelte';
  import Services from '../manage/Services.svelte';
  import Announcements from '../manage/Announcements.svelte';
  import Analytics from '../manage/Analytics.svelte';
  import Subscription from '../manage/Subscription.svelte';
  import Password from '../manage/Password.svelte';
  import Modal from '../manage/Modal.svelte';
  import Feedback from '../manage/Feedback.svelte';
  import ShareClinicDialog from '#lib/components/clinics/ShareClinicDialog.svelte';
  let { name,facilityId }:{name:string;facilityId:string}=$props();
  const auth=getAuth();
  const system=$derived(isSystemAdmin(auth.user));
  const tab=$derived(name==='dashboard'?'today':name==='analytics'?'analytics':name==='subscription'?'subscription':PANEL_LABELS[page.url.searchParams.get('tab')??'']?page.url.searchParams.get('tab')!:system?'info':'appointments');
  const heading=$derived(tab==='today'?'今日工作台':tab==='subscription'?'我的訂閱':PANEL_LABELS[tab]);
  const navigation=$derived([{key:'today',label:'今日工作台',href:'/admin/dashboard'},{key:'appointments',label:'預約管理',href:clinicHref(facilityId,'appointments')},{key:'queue',label:'叫號與報到',href:clinicHref(facilityId,'queue')},{key:'patients',label:'客戶管理',href:clinicHref(facilityId,'patients')},{key:'schedule',label:'排班管理',href:clinicHref(facilityId,'schedule')},{key:'analytics',label:'營運分析',href:clinicHref(facilityId,'analytics')},{key:'info',label:'院所設定',href:clinicHref(facilityId,'info')},{key:'subscription',label:'我的訂閱',href:'/admin/subscription'}]);
  let facility=$state<MedicalFacility|null>(null),loading=$state(true),error=$state(''),revision=$state(0),more=$state(false),edit=$state(false),remove=$state(false),password=$state(false),saving=$state(false),notice=$state(''),deleteError=$state(''),share=$state(false);
  $effect(()=>{const id=facilityId,r=revision;void r;let active=true;loading=true;error='';adminClinicsApi.get(id).then(data=>{if(active)facility=data;}).catch(e=>{if(active)error=apiMessage(e,'無法載入院所資料，請重試');}).finally(()=>{if(active)loading=false;});return()=>{active=false;};});
  const expired=$derived(facility?isExpired(facility.subscription_expires_at):false);
  async function deleteClinic(){saving=true;deleteError='';try{await adminClinicsApi.delete(facilityId);await goto('/admin/clinics');}catch(e){deleteError=apiMessage(e,'刪除院所失敗，請重試');}finally{saving=false;}}
  async function startTrial(){if(!facility)return;saving=true;notice='';try{facility=await adminClinicsApi.startTrial(facilityId);await auth.refreshUser();notice='試用已啟用';}catch(e){notice=apiMessage(e,'無法啟用試用，請重試');}finally{saving=false;}}
  function hrefFor(key:string){const url=new SvelteURL(page.url.href);url.pathname=`/admin/clinics/${facilityId}`;url.searchParams.set('tab',key);url.searchParams.delete('appointment');url.searchParams.delete('new');return url.pathname+url.search;}
</script>
{#snippet navLinks()}{#each navigation as item (item.key)}<a href={['today','subscription'].includes(item.key)?item.href:hrefFor(item.key)} onclick={()=>more=false} aria-current={tab===item.key||item.key==='info'&&SETTINGS_PANELS.includes(tab)?'page':undefined} class="block rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-muted {tab===item.key||item.key==='info'&&SETTINGS_PANELS.includes(tab)?'bg-primary/10 text-primary':'text-muted-foreground'}">{item.label}</a>{/each}{/snippet}
<div class="flex min-h-screen bg-background" data-native-workspace="true">
  <aside class="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r bg-card md:flex"><a href="/admin/dashboard" class="flex h-16 shrink-0 items-center gap-2 border-b px-5 font-semibold"><img src="/cross-icon.png" alt="" width="32" height="32"/>Cross <span class="text-xs font-normal text-muted-foreground">院所工作區</span></a><nav class="flex-1 space-y-1 overflow-y-auto p-3" aria-label="後台主要導覽">{@render navLinks()}{#if system}<a href="/admin/clinics" class="block px-4 py-3 text-sm text-primary">返回平台院所管理</a>{/if}</nav><div class="space-y-2 border-t p-4"><p class="truncate text-sm font-medium">{auth.user?.display_name??auth.user?.email}</p><div class="flex flex-wrap gap-2"><Button variant="outline" size="sm" onclick={()=>password=true}>修改密碼</Button><Button variant="ghost" size="sm" onclick={()=>auth.logout('/admin/login')}>登出</Button></div></div></aside>
  <div class="min-w-0 flex-1"><header class="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6"><div class="flex min-w-0 items-center gap-2"><Button size="icon" variant="ghost" class="md:hidden" aria-label="開啟後台選單" onclick={()=>more=true}>☰</Button><p class="truncate text-sm font-medium">{facility?.name??'院所工作區'}<span class="hidden text-muted-foreground sm:inline"> ／ {heading}</span></p></div><div class="flex items-center gap-2"><ThemeToggle/><Button variant="outline" size="sm" onclick={()=>share=true}>分享預約頁</Button><Button href={'/clinic/'+facilityId} target="_blank" rel="noopener noreferrer" size="sm" variant="outline">查看公開頁</Button></div></header>
    <main class="admin-canvas p-4 pb-24 md:p-6 lg:p-8"><div class="mx-auto max-w-7xl space-y-5">
      {#if error}<div role="alert" class="space-y-2 rounded-xl bg-destructive/10 p-4 text-destructive"><p>{error}</p><Button variant="outline" onclick={()=>revision++}>重試院所資料</Button></div>{/if}
      {#if notice}<p role="status" class="rounded-xl bg-primary/10 p-3 text-primary">{notice}</p>{/if}
      {#if loading&&!facility}<p role="status" class="py-12 text-center">正在載入院所工作區…</p>
      {:else if facility}
        {#if expired||['suspended','cancelled'].includes(facility.subscription_status)}<p class="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">訂閱已到期或暫停，部分功能無法使用。<a href="/admin/subscription" class="ml-2 text-primary underline">查看訂閱</a></p>{:else if facility.subscription_status==='trial'}<p class="rounded-xl bg-primary/5 p-3 text-sm">試用剩餘 {daysUntilExpiry(facility.subscription_expires_at)??'—'} 天。<a href="/admin/subscription" class="text-primary underline">查看方案</a></p>{/if}
        {#if tab==='today'||tab==='appointments'}<Appointments {facility} workbench={tab==='today'}/>{#if tab==='today'}<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 text-sm"><p>目前方案：{PLAN_LABELS[facility.subscription_plan]}</p>{#if canStartTrial(facility)}<Button disabled={saving} variant="outline" onclick={startTrial}>啟用 90 天試用</Button>{:else}<Button size="sm" variant="outline" href="/admin/subscription">管理訂閱</Button>{/if}</div>{/if}
        {:else if tab==='queue'}<Queue {facility}/>
        {:else if tab==='schedule'}<Schedule {facility}/>
        {:else if tab==='patients'}<Customers {facilityId}/>
        {:else if tab==='analytics'||tab==='stats'}<div class="space-y-4"><div class="flex flex-wrap items-center justify-between gap-3"><h1 class="text-2xl font-semibold">營運分析</h1><nav class="flex gap-2" aria-label="分析分類"><Button href={hrefFor('analytics')} variant={tab==='analytics'?'default':'outline'}>客戶分析</Button><Button href={hrefFor('stats')} variant={tab==='stats'?'default':'outline'}>看診統計</Button></nav></div>{#key tab}<Analytics {facility} stats={tab==='stats'}/>{/key}</div>
        {:else if tab==='subscription'}<div class="space-y-4"><h1 class="text-2xl font-semibold">我的訂閱</h1><Subscription {facility} onUpdated={value=>facility=value}/></div>
        {:else}
          <div class="space-y-4"><h1 class="text-2xl font-semibold">院所設定</h1><nav aria-label="院所設定分類" class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">{#each SETTINGS_PANELS as key (key)}<Button href={hrefFor(key)} variant={tab===key?'default':'outline'}>{PANEL_LABELS[key]}</Button>{/each}</nav>
          {#if tab==='info'}<section class="space-y-4 rounded-2xl border bg-card p-5"><div class="flex flex-wrap items-center justify-between gap-3"><h2 class="font-semibold">基本資訊</h2><Button variant="outline" onclick={()=>edit=true}>編輯資訊</Button></div><dl class="grid gap-4 text-sm sm:grid-cols-2">{#each [{label:'院所名稱',value:facility.name},{label:'電話',value:facility.phone},{label:'地址',value:facility.address},{label:'預約間隔',value:facility.slot_duration+' 分鐘'},{label:'院所狀態',value:facility.is_active?'啟用':'停用'},{label:'營業時間',value:facility.business_hours?Object.entries(facility.business_hours).map(([day,h])=>({monday:'週一',tuesday:'週二',wednesday:'週三',thursday:'週四',friday:'週五',saturday:'週六',sunday:'週日'}[day]??day)+' '+h.open+'–'+h.close).join('、'):'未設定'}] as item (item.label)}<div><dt class="text-muted-foreground">{item.label}</dt><dd class="mt-1">{item.value||'未填'}</dd></div>{/each}</dl></section><Subscription {facility} onUpdated={value=>facility=value}/>{#if system}<section class="space-y-3 rounded-xl border border-destructive/20 p-4"><h2 class="font-medium text-destructive">刪除院所</h2><p class="text-sm text-muted-foreground">刪除會移除相關資料，請確認院所與資料用途。</p><Button variant="destructive" onclick={()=>remove=true}>刪除此院所</Button></section>{/if}
          {:else}{#key tab}{#if tab==='personnel'}<Personnel {facilityId}/>{:else if tab==='services'}<Services {facilityId}/>{:else if tab==='announcements'}<Announcements {facilityId}/>{/if}{/key}{/if}</div>
        {/if}
      {/if}
    </div></main>
  </div>
</div>
<nav aria-label="手機後台主要導覽" class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"><a href="/admin/dashboard" class="px-2 py-4 text-center text-sm {tab==='today'?'font-semibold text-primary':''}">今日</a><a href={hrefFor('appointments')} class="px-2 py-4 text-center text-sm {tab==='appointments'?'font-semibold text-primary':''}">預約</a><a href={hrefFor('queue')} class="px-2 py-4 text-center text-sm {tab==='queue'?'font-semibold text-primary':''}">叫號</a><button class="px-2 py-4 text-sm" onclick={()=>more=true}>更多</button></nav>
<Dialog.Root bind:open={more}><Dialog.Content><Dialog.Header><Dialog.Title>院所工作區選單</Dialog.Title><Dialog.Description>選擇日常工作或院所設定。</Dialog.Description></Dialog.Header><nav class="space-y-1" aria-label="手機後台完整選單">{@render navLinks()}</nav><div class="flex gap-2"><Button variant="outline" onclick={()=>{more=false;password=true;}}>修改密碼</Button><Button variant="outline" onclick={()=>auth.logout('/admin/login')}>登出</Button></div></Dialog.Content></Dialog.Root>
{#if facility&&edit}<ClinicEditor bind:open={edit} clinic={facility} onSaved={value=>{facility=value;notice='院所資訊已更新';}}/>{/if}
<Modal bind:open={remove} title="刪除院所" description={'確認永久刪除「'+(facility?.name??'')+'」及其相關資料？此操作無法復原。'} busy={saving}><Feedback error={deleteError}/><div class="mt-4 flex justify-end gap-2"><Button variant="outline" disabled={saving} onclick={()=>remove=false}>取消</Button><Button variant="destructive" disabled={saving} onclick={deleteClinic}>確認永久刪除</Button></div></Modal>
{#if password}<Password bind:open={password}/>{/if}
{#if facility}<ShareClinicDialog bind:open={share} clinicId={facilityId} clinicName={facility.name}/>{/if}

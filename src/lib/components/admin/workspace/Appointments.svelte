<script lang="ts">
  import { SvelteURL } from "svelte/reactivity";
  import { untrack } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Button } from '#lib/components/ui/button/index.ts';
  import { Input } from '#lib/components/ui/input/index.ts';
  import { adminClinicsApi } from '#lib/api/admin/clinics.ts';
  import { taipeiToday, APPOINTMENT_STATUS_LABELS } from '#lib/constants/appointment.ts';
  import { validDate, addDateDays, appointmentEnd, apiMessage } from '#lib/admin/scheduling.ts';
  import { canAccessFeature } from '#lib/feature-access.ts';
  import type { ApiAppointment, MedicalFacility } from '#lib/types/clinic.ts';
  import AppointmentDialog from './AppointmentDialog.svelte';
  import AppointmentCalendar from './AppointmentCalendar.svelte';
  import BookingDialog from './BookingDialog.svelte';
  import StatusPill from './StatusPill.svelte';
  let { facility, workbench = false }: { facility: MedicalFacility; workbench?: boolean } = $props();
  const startDate = $derived(validDate(page.url.searchParams.get('start'),taipeiToday()));
  const view = $derived(['day','week'].includes(page.url.searchParams.get('view') ?? '') ? page.url.searchParams.get('view') as 'day'|'week' : 'list');
  const endDate = $derived(view === 'day' ? startDate : view === 'week' ? addDateDays(startDate,6) : validDate(page.url.searchParams.get('end'),startDate) < startDate ? startDate : validDate(page.url.searchParams.get('end'),startDate));
  const status = $derived(page.url.searchParams.get('status') ?? 'all'), staff = $derived(page.url.searchParams.get('staff') ?? ''), service = $derived(page.url.searchParams.get('service') ?? '');
  const createOpen = $derived(page.url.searchParams.get('new') === '1'), appointmentId = $derived(page.url.searchParams.get('appointment') ?? '');
  let showFilters = $state(false);
  let rows = $state<ApiAppointment[]>([]), loading = $state(true), error = $state(''), loadedRange = $state(''), updated = $state(''), revision = $state(0), search = $state(''), message = $state(''), pending = $state('');
  let selected = $state<ApiAppointment|null>(null), detailError = $state('');
  async function params(values: Record<string,string|null>) {
    const url = new SvelteURL(page.url.href);
    for(const [key,value] of Object.entries(values)) { if(value) url.searchParams.set(key,value); else url.searchParams.delete(key); }
    await goto(url,{replace:true,reset:false});
  }
  $effect(()=>{
    const id = facility.id, start = startDate, end = endDate, refresh = revision; void refresh;
    let active = true;
    untrack(()=>{ loading = true; error = ''; if(loadedRange !== `${id}:${start}:${end}`) { rows = []; updated = ''; } });
    adminClinicsApi.appointments.list(id,{start_date:start,end_date:end}).then(data=>{if(active){rows=data;loadedRange=`${id}:${start}:${end}`;updated=new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date());}}).catch(e=>{if(active)error=apiMessage(e,'預約資料載入失敗，請重試');}).finally(()=>{if(active)loading=false;});
    return ()=>{active=false;};
  });
  $effect(()=>{
    const id=appointmentId, facilityId=facility.id;
    if(!id){selected=null;detailError='';return;}
    let active=true;detailError=''; selected=null;
    adminClinicsApi.appointments.get(facilityId,id).then(a=>{if(active)selected=a;}).catch(e=>{if(active)detailError=apiMessage(e,'無法開啟預約詳情，請重試');});
    return()=>{active=false;};
  });
  const filtered = $derived(rows.filter(a=>(status==='all'||a.status===status)&&(!staff||a.staff_id===staff)&&(!service||(a.service_id??'none')===service)&&(!search.trim()||`${a.patient_name} ${a.patient_phone}`.toLowerCase().includes(search.trim().toLowerCase()))).sort((a,b)=>`${a.appointment_date} ${a.appointment_time}`.localeCompare(`${b.appointment_date} ${b.appointment_time}`)));
  const people = $derived([...new Map(rows.filter(a=>a.staff_id).map(a=>[a.staff_id!,a.staff_name ?? '未指定'])).entries()]);
  const services = $derived([...new Map(rows.map(a=>[a.service_id??'none',a.service_name??'一般預約'])).entries()]);
  const stats = $derived([{label:'預約總數',value:rows.length},{label:'待報到',value:rows.filter(a=>a.status==='confirmed').length},{label:'已報到',value:rows.filter(a=>a.status==='checked_in').length},{label:'服務中',value:rows.filter(a=>a.status==='in_progress').length}]);
  async function checkIn(a:ApiAppointment){pending=a.id;message='';try{await adminClinicsApi.queue.checkIn(facility.id,a.id);message=`${a.patient_name} 已報到`;revision++;}catch(e){error=apiMessage(e,'報到失敗，請重試');}finally{pending='';}}
  function updatedAppointment(text:string){message=text;revision++;}
  function select(a:ApiAppointment){void params({appointment:a.id});}
  function changeView(v:string){void params({view:v, end:v==='week'?addDateDays(startDate,6):startDate});}
</script>
<div class="space-y-5">
  <div class="flex flex-wrap items-end justify-between gap-3"><div><h1 class="text-2xl font-semibold tracking-tight">{workbench?'今日工作台':'預約管理'}</h1><p class="mt-1 text-sm text-muted-foreground">{workbench?'查看今日安排，直接處理預約、改期與報到。':'搜尋客戶、比較人員行程，安排諮詢與療程。'}</p></div><Button onclick={()=>params({new:'1'})}>＋ 新增預約</Button></div>
  {#if workbench}<div class="grid grid-cols-2 gap-3 xl:grid-cols-4">{#each stats as stat (stat.label)}<div class="rounded-2xl bg-card p-4 ring-1 ring-foreground/5"><p class="text-sm text-muted-foreground">{stat.label}</p><p class="mt-2 text-3xl font-semibold tabular-nums">{updated?stat.value:'—'}</p></div>{/each}</div>{/if}
  <div class="space-y-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/5">
    <div class="flex flex-wrap gap-2"><Button size="sm" variant={startDate===taipeiToday()&&endDate===startDate?'default':'outline'} onclick={()=>params({start:taipeiToday(),end:taipeiToday(),view:view==='week'?'list':view})}>今天</Button><Button size="sm" variant={endDate===addDateDays(startDate,6)?'default':'outline'} onclick={()=>params({start:taipeiToday(),end:addDateDays(taipeiToday(),6),view:'week'})}>未來七天</Button><Button size="sm" variant="outline" onclick={()=>params({start:addDateDays(startDate,view==='week'?-7:-1),end:addDateDays(endDate,view==='week'?-7:-1)})} aria-label="上一個日期範圍">←</Button><Button size="sm" variant="outline" onclick={()=>params({start:addDateDays(startDate,view==='week'?7:1),end:addDateDays(endDate,view==='week'?7:1)})} aria-label="下一個日期範圍">→</Button><div class="ml-auto flex gap-1" aria-label="預約檢視方式">{#each [{id:'list',label:'清單'},{id:'day',label:'人員日曆'},{id:'week',label:'週行程'}] as item (item.id)}<Button size="sm" variant={view===item.id?'default':'outline'} aria-pressed={view===item.id} onclick={()=>changeView(item.id)}>{item.label}</Button>{/each}</div></div>
    <Button variant="outline" size="sm" class="sm:hidden" aria-expanded={showFilters} onclick={()=>showFilters=!showFilters}>{showFilters?"收合篩選":"更多篩選"}{status!=="all"||staff||service?"（已套用）":""}</Button>
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div class="space-y-1"><label for="appointments-search" class="text-sm">搜尋客戶</label><Input id="appointments-search" bind:value={search} placeholder="姓名或電話" /></div>
      <div class="space-y-1"><label for="appointments-start" class="text-sm">{view==='week'?'起始日期':'日期'}</label><Input id="appointments-start" type="date" value={startDate} onchange={e=>{if(e.currentTarget.value)void params({start:e.currentTarget.value,end:view==='list'?e.currentTarget.value:null});}} /></div>
      {#if view==='list'}<div class={showFilters?"space-y-1":"hidden space-y-1 sm:block"}><label for="appointments-end" class="text-sm">結束日期</label><Input id="appointments-end" type="date" min={startDate} value={endDate} onchange={e=>{if(e.currentTarget.value)void params({end:e.currentTarget.value});}} /></div>{/if}
      <div class={showFilters?"space-y-1":"hidden space-y-1 sm:block"}><label for="appointments-status" class="text-sm">預約狀態</label><select id="appointments-status" class="admin-field" value={status} onchange={e=>params({status:e.currentTarget.value})}><option value="all">全部狀態</option>{#each Object.entries(APPOINTMENT_STATUS_LABELS) as [value,label] (value)}<option {value}>{label}</option>{/each}</select></div>
      <div class={showFilters?"space-y-1":"hidden space-y-1 sm:block"}><label for="appointments-staff" class="text-sm">服務人員</label><select id="appointments-staff" class="admin-field" value={staff} onchange={e=>params({staff:e.currentTarget.value})}><option value="">全部人員</option>{#each people as [value,label] (value)}<option {value}>{label}</option>{/each}</select></div>
      <div class={showFilters?"space-y-1":"hidden space-y-1 sm:block"}><label for="appointments-service" class="text-sm">服務項目</label><select id="appointments-service" class="admin-field" value={service} onchange={e=>params({service:e.currentTarget.value})}><option value="">全部服務</option>{#each services as [value,label] (value)}<option {value}>{label}</option>{/each}</select></div>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><p>{startDate} ～ {endDate}{#if updated} · 更新於 {updated}{/if}</p><Button variant="ghost" size="sm" disabled={loading} onclick={()=>revision++}>{loading?'更新中…':'重新整理預約'}</Button></div>
  </div>
  {#if message}<p role="status" class="rounded-xl bg-primary/10 p-3 text-sm text-primary">{message}</p>{/if}
  {#if error}<div role="alert" class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-destructive/10 p-4 text-sm text-destructive"><div><p>{error}</p>{#if updated}<p>目前顯示 {updated} 的資料，尚未取得最新結果。</p>{:else}<p>尚未取得預約資料，不能判定此期間是否有預約。</p>{/if}</div><Button variant="outline" onclick={()=>revision++}>重試預約</Button></div>{/if}
  {#if detailError}<div role="alert" class="rounded-xl bg-destructive/10 p-3 text-destructive">{detailError}<Button variant="outline" onclick={()=>params({appointment:null})}>關閉提示</Button></div>{/if}
  {#if loading&&!updated}<p role="status" class="py-12 text-center text-muted-foreground">正在載入預約…</p>
  {:else if !error || updated}
    <div aria-busy={loading} class="space-y-3"><p class="text-sm text-muted-foreground">共 {filtered.length} 筆{search||staff||service||status!=='all'?'符合篩選條件':''}</p>
      {#if !filtered.length}<div class="rounded-2xl bg-card p-10 text-center ring-1 ring-foreground/5"><p class="font-medium">{rows.length?'沒有符合條件的預約':'期間無預約'}</p><p class="mt-2 text-sm text-muted-foreground">{rows.length?'請調整姓名、日期或篩選條件。':'可從右上方新增預約，或切換日期查看。'}</p>{#if rows.length}<Button class="mt-4" variant="outline" onclick={()=>{search='';void params({status:null,staff:null,service:null});}}>清除篩選</Button>{/if}</div>
      {:else}
        {#if view!=='list'}<AppointmentCalendar appointments={filtered} {startDate} {view} fallbackDuration={facility.slot_duration} onSelect={select}/>{/if}
        <div class={view==='list'?'hidden overflow-x-auto rounded-2xl border bg-card md:block':'hidden'}><table class="w-full text-left text-sm"><thead class="border-b bg-muted/40 text-muted-foreground"><tr><th class="p-3">日期／時間</th><th class="p-3">客戶</th><th class="p-3">服務／人員</th><th class="p-3">狀態</th><th class="p-3 text-right">操作</th></tr></thead><tbody class="divide-y">{#each filtered as a (a.id)}<tr class="hover:bg-muted/30"><td class="p-3 tabular-nums"><p>{a.appointment_date}</p><p class="font-medium">{a.appointment_time.slice(0,5)}–{appointmentEnd(a,facility.slot_duration)}</p></td><td class="p-3"><button class="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary" onclick={()=>select(a)}>{a.patient_name}</button><p class="mt-1 text-xs text-muted-foreground">{a.patient_phone}</p></td><td class="p-3"><p>{a.service_name??'一般預約'} · {a.duration_minutes??facility.slot_duration} 分鐘</p><p class="mt-1 text-xs text-muted-foreground">{a.staff_name??'未指定人員'}</p></td><td class="p-3"><StatusPill status={a.status}/></td><td class="p-3"><div class="flex justify-end gap-2"><Button variant="outline" size="sm" onclick={()=>select(a)} aria-label={'查看'+a.patient_name+'的預約'}>詳情／改期</Button>{#if a.status==='confirmed'&&a.appointment_date===taipeiToday()&&canAccessFeature(facility,'queue_management')}<Button size="sm" disabled={!!pending} onclick={()=>checkIn(a)} aria-label={'為'+a.patient_name+'報到'}>報到</Button>{/if}</div></td></tr>{/each}</tbody></table></div>
        <div class="space-y-2 md:hidden">{#each filtered as a (a.id)}<article class="space-y-2 rounded-2xl border bg-card p-4"><div class="flex flex-wrap items-center justify-between gap-2"><p class="font-semibold tabular-nums">{a.appointment_time.slice(0,5)}–{appointmentEnd(a,facility.slot_duration)}</p><StatusPill status={a.status}/></div><button class="text-left font-semibold text-primary underline-offset-4 hover:underline" onclick={()=>select(a)}>{a.patient_name}</button><p class="text-sm">{a.service_name??'一般預約'} · {a.duration_minutes??facility.slot_duration} 分鐘</p><p class="text-xs text-muted-foreground">{a.appointment_date} · {a.staff_name??'未指定'}</p><div class="flex flex-wrap items-center justify-between gap-2 border-t pt-2"><a href={'tel:'+a.patient_phone} class="text-sm text-primary">{a.patient_phone}</a><div class="flex gap-2"><Button size="sm" variant="outline" onclick={()=>select(a)}>詳情／改期</Button>{#if a.status==='confirmed'&&a.appointment_date===taipeiToday()&&canAccessFeature(facility,'queue_management')}<Button size="sm" disabled={!!pending} onclick={()=>checkIn(a)} aria-label={'為'+a.patient_name+'報到'}>報到</Button>{/if}</div></div></article>{/each}</div>
      {/if}
    </div>
  {/if}
</div>
<BookingDialog bind:open={()=>createOpen,v=>{void params({new:v?'1':null});}} facilityId={facility.id} onCreated={()=>{message='預約已建立';revision++;}} />
<AppointmentDialog appointment={selected} {facility} onClose={()=>params({appointment:null})} onUpdated={updatedAppointment}/>

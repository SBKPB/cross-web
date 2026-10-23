<script lang="ts">
  import { SvelteURL } from "svelte/reactivity";
  import { onMount, untrack } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Button } from '#lib/components/ui/button/index.ts';
  import { Input } from '#lib/components/ui/input/index.ts';
  import * as Dialog from '#lib/components/ui/dialog/index.ts';
  import { adminClinicsApi } from '#lib/api/admin/clinics.ts';
  import { canAccessFeature } from '#lib/feature-access.ts';
  import { apiMessage, validDate } from '#lib/admin/scheduling.ts';
  import { taipeiToday } from '#lib/constants/appointment.ts';
  import type { ApiAppointment, MedicalFacility, QueueBoard, QueueGroup } from '#lib/types/clinic.ts';
  import StatusPill from './StatusPill.svelte';
  import AppointmentDialog from './AppointmentDialog.svelte';
  let { facility }: { facility: MedicalFacility } = $props();
  const date=$derived(validDate(page.url.searchParams.get('queue_date'),taipeiToday()));
  const allowed=$derived(canAccessFeature(facility,'queue_management'));
  let board=$state<QueueBoard|null>(null), error=$state(''), loading=$state(false), revision=$state(0), pending=$state(''), message=$state(''), updated=$state('');
  let selected=$state<ApiAppointment|null>(null), nextGroup=$state<QueueGroup|null>(null);
  $effect(()=>{const d=date,id=facility.id,r=revision;void r;if(!allowed)return;let active=true;untrack(()=>{loading=true;error='';if(board?.date!==d){board=null;updated='';}});adminClinicsApi.queue.list(id,d).then(data=>{if(active){board=data;updated=new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date());}}).catch(e=>{if(active)error=apiMessage(e,'無法載入叫號資料，請重試');}).finally(()=>{if(active)loading=false;});return()=>{active=false;};});
  onMount(()=>{const id=setInterval(()=>{if(document.visibilityState==='visible'&&!pending)revision++;},10000);const visible=()=>{if(document.visibilityState==='visible')revision++;};document.addEventListener('visibilitychange',visible);return()=>{clearInterval(id);document.removeEventListener('visibilitychange',visible);};});
  async function act(kind:'check-in'|'call-next',id:string|null){if(pending)return;pending=kind+id;error='';try{if(kind==='check-in')await adminClinicsApi.queue.checkIn(facility.id,id!);else await adminClinicsApi.queue.callNext(facility.id,{date,staff_id:id});message=kind==='check-in'?'報到成功':'已叫下一號';nextGroup=null;revision++;}catch(e){error=apiMessage(e,'操作失敗，請重試');}finally{pending='';}}
  async function detail(id:string){try{selected=await adminClinicsApi.appointments.get(facility.id,id);}catch(e){error=apiMessage(e,'無法載入預約詳情');}}
  function setDate(value:string){if(!value)return;const url=new SvelteURL(page.url.href);url.searchParams.set('queue_date',value);void goto(url,{replace:true,reset:false});}
</script>
<div class="space-y-5"><div><h1 class="text-2xl font-semibold">叫號與報到</h1><p class="mt-1 text-sm text-muted-foreground">核對客戶、報到與服務進度。</p></div>
{#if !allowed}<div class="space-y-3 rounded-2xl border bg-card p-6"><h2 class="font-semibold">叫號與報到需標準方案以上</h2><p class="text-sm text-muted-foreground">前往訂閱頁查看目前方案與可用試用。</p><Button href="/admin/subscription">查看我的訂閱</Button></div>
{:else}
<div class="flex flex-wrap items-end gap-2"><div class="space-y-1"><label for="queue-date" class="text-sm">叫號日期</label><Input id="queue-date" type="date" value={date} onchange={e=>setDate(e.currentTarget.value)} class="w-44"/></div><Button variant="outline" onclick={()=>setDate(taipeiToday())}>今天</Button><Button variant="outline" disabled={loading} onclick={()=>revision++}>更新叫號</Button><p class="text-xs text-muted-foreground">每 10 秒更新{updated?' · '+updated:''}</p></div>
{#if error}<div role="alert" class="space-y-2 rounded-xl bg-destructive/10 p-3 text-destructive"><p>{error}</p>{#if board}<p class="text-sm">目前顯示先前資料，尚未取得最新結果。</p>{/if}<Button variant="outline" onclick={()=>revision++}>重試叫號</Button></div>{/if}
{#if message}<p role="status" class="rounded-xl bg-primary/10 p-3 text-primary">{message}</p>{/if}
{#if loading&&!board}<p role="status" class="py-12 text-center">載入叫號中…</p>
{:else if board}
{#each board.groups as group (group.staff_id??'none')}<section class="overflow-hidden rounded-2xl border bg-card"><div class="flex flex-wrap items-center justify-between gap-4 border-b p-4"><div><h2 class="font-semibold">{group.staff_name??'未指定人員'}</h2><p class="text-sm text-muted-foreground">{group.session_label??''}</p></div><div class="flex items-center gap-4"><p class="text-sm">目前 <strong class="text-2xl text-primary">{group.current_number??'—'}</strong> 號</p><p class="text-sm">等待 {group.waiting_count} 位</p><Button disabled={!!pending||!group.waiting_count} onclick={()=>{if(group.appointments.some(a=>a.status==='in_progress'))nextGroup=group;else void act('call-next',group.staff_id);}}>叫下一號</Button></div></div>
<ul class="divide-y">{#each group.appointments as a (a.id)}<li class="flex flex-wrap items-center gap-3 p-4"><span class="w-8 text-xl font-semibold tabular-nums">{a.queue_number??'—'}</span><button class="min-w-0 flex-1 text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-primary" onclick={()=>detail(a.id)}><p class="font-medium">{a.patient_name}</p><p class="mt-1 text-xs text-muted-foreground">{a.appointment_time.slice(0,5)} · {a.service_name??'一般預約'}</p></button><StatusPill status={a.status}/>{#if a.status==='confirmed'}<Button variant="outline" size="sm" disabled={!!pending} onclick={()=>act('check-in',a.id)}>報到</Button>{:else if a.status==='in_progress'}<Button variant="outline" size="sm" onclick={()=>detail(a.id)}>完成服務</Button>{/if}</li>{/each}</ul></section>{:else}{#if !error}<p class="rounded-2xl bg-card p-10 text-center">本日無預約</p>{/if}{/each}
{/if}{/if}</div>
<AppointmentDialog appointment={selected} {facility} onClose={()=>selected=null} onUpdated={text=>{message=text;revision++;}}/>
<Dialog.Root open={!!nextGroup} onOpenChange={v=>{if(!v&&!pending)nextGroup=null;}}><Dialog.Content><Dialog.Header><Dialog.Title>確認叫下一號</Dialog.Title><Dialog.Description>將完成 {nextGroup?.appointments.find(a=>a.status==='in_progress')?.patient_name} 的服務，再叫下一位已報到客戶。</Dialog.Description></Dialog.Header><div class="flex justify-end gap-2"><Button variant="outline" disabled={!!pending} onclick={()=>nextGroup=null}>返回叫號台</Button><Button disabled={!!pending} onclick={()=>act('call-next',nextGroup!.staff_id)}>確認叫下一號</Button></div></Dialog.Content></Dialog.Root>

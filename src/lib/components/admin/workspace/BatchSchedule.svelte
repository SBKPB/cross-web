<script lang="ts">
  import * as Dialog from '#lib/components/ui/dialog/index.ts';
  import { Button } from '#lib/components/ui/button/index.ts';
  import { Input } from '#lib/components/ui/input/index.ts';
  import { adminClinicsApi } from '#lib/api/admin/clinics.ts';
  import { addDateDays, apiMessage } from '#lib/admin/scheduling.ts';
  import { taipeiToday } from '#lib/constants/appointment.ts';
  import type { ApiStaff, ApiScheduleBatchItem, ApiScheduleBatchResult } from '#lib/types/clinic.ts';
  import type { ScheduleSession } from '#lib/types/schedule.ts';
  let { open=$bindable(false),facilityId,staff,onSaved }: {open?:boolean;facilityId:string;staff:ApiStaff[];onSaved:()=>void}=$props();
  let mode=$state('pattern'),start=$state(taipeiToday()),end=$state(addDateDays(taipeiToday(),27)),source=$state(addDateDays(taipeiToday(),-7));
  let people=$state<string[]>([]),weekdays=$state<number[]>([1,2,3,4,5]),session=$state<ScheduleSession>('morning'),from=$state('09:00'),to=$state('12:00'),skipLeaves=$state(true),busy=$state(false),error=$state('');
  let items=$state<ApiScheduleBatchItem[]>([]),result=$state<ApiScheduleBatchResult|null>(null);
  const signature=$derived(JSON.stringify({mode,start,end,source,people,weekdays,session,from,to}));
  let previewSignature=$state('');
  const previewCurrent=$derived(signature===previewSignature&&items.length>0);
  async function preview(){busy=true;error='';result=null;items=[];const snapshot=signature;try{
    if(!people.length)throw new Error('請至少選擇一位人員');
    if(!start||!end||start>end||Date.parse(end)-Date.parse(start)>90*86400000)throw new Error('請選擇 90 天內的有效日期範圍');
    let next:ApiScheduleBatchItem[]=[];
    if(mode==='copy'){
      const sourceRows=await adminClinicsApi.schedules.listAll(facilityId,{start_date:source,end_date:addDateDays(source,6)});
      for(let day=start;day<=end;day=addDateDays(day,1))for(const row of sourceRows.filter(s=>people.includes(s.staff_id)&&s.is_available)){
        const offset=(Date.parse(day)-Date.parse(start))/86400000;
        if((Date.parse(row.date)-Date.parse(source))/86400000===offset%7)next.push({staff_id:row.staff_id,date:day,start_time:row.start_time,end_time:row.end_time,session_type:row.session_type,max_appointments:row.max_appointments});
      }
    }else{
      if(!weekdays.length||!from||!to||from>=to)throw new Error('請選擇星期及有效的起訖時間');
      for(let day=start;day<=end;day=addDateDays(day,1))if(weekdays.includes(new Date(day+'T12:00:00Z').getUTCDay()))for(const staff_id of people)next.push({staff_id,date:day,start_time:from,end_time:to,session_type:session,max_appointments:20});
    }
    if(!next.length)throw new Error('沒有可建立的排班，請確認來源與條件');
    if(next.length>2000)throw new Error('單次最多建立 2000 筆排班，請縮小範圍');
    items=next;previewSignature=snapshot;
  }catch(e){error=e instanceof Error&&!('data' in e)?e.message:apiMessage(e,'無法建立預覽');}finally{busy=false;}}
  async function save(){if(!previewCurrent||busy)return;busy=true;error='';try{result=await adminClinicsApi.schedules.batchCreate(facilityId,{items,skip_leaves:skipLeaves});items=[];onSaved();}catch(e){error=apiMessage(e,'批次排班失敗，請重試');}finally{busy=false;}}
</script>
<Dialog.Root bind:open><Dialog.Content class="block overflow-hidden p-0 sm:max-w-2xl"><div class="flex max-h-[calc(100dvh-2rem)] flex-col"><Dialog.Header class="shrink-0 p-6 pr-12"><Dialog.Title>智慧排班</Dialog.Title><Dialog.Description>以週期樣板或既有七日班表建立安排；先預覽，再確認送出。</Dialog.Description></Dialog.Header><div class="min-h-0 space-y-4 overflow-y-auto px-6 pb-6">
{#if error}<p role="alert" class="rounded-xl bg-destructive/10 p-3 text-destructive">{error}</p>{/if}
<fieldset class="space-y-4" disabled={busy}><div class="space-y-1"><label for="batch-mode">排班方式</label><select id="batch-mode" class="admin-field" bind:value={mode}><option value="pattern">週期樣板</option><option value="copy">複製七日班表</option></select></div>
<div class="grid gap-3 sm:grid-cols-2"><div class="space-y-1"><label for="batch-start">目標開始日期</label><Input id="batch-start" type="date" bind:value={start}/></div><div class="space-y-1"><label for="batch-end">目標結束日期</label><Input id="batch-end" type="date" bind:value={end} min={start}/></div></div>
<fieldset><legend class="mb-2 text-sm font-medium">服務人員</legend><div class="flex flex-wrap gap-3">{#each staff as s (s.id)}<label class="flex items-center gap-2"><input type="checkbox" bind:group={people} value={s.id}/>{s.name}</label>{/each}</div></fieldset>
{#if mode==='copy'}<div class="space-y-1"><label for="batch-source">來源七日班表的開始日期</label><Input id="batch-source" type="date" bind:value={source}/><p class="text-xs text-muted-foreground">將來源七日的相對日次，重複套用至目標日期範圍。</p></div>
{:else}<fieldset><legend class="mb-2 text-sm font-medium">每週日期</legend><div class="flex flex-wrap gap-3">{#each ['日','一','二','三','四','五','六'] as day,i (day)}<label class="flex items-center gap-1"><input type="checkbox" bind:group={weekdays} value={i}/>週{day}</label>{/each}</div></fieldset><div class="grid grid-cols-3 gap-2"><div><label for="batch-session">班次</label><select id="batch-session" class="admin-field" bind:value={session}><option value="morning">早班</option><option value="afternoon">午班</option><option value="evening">晚班</option></select></div><div><label for="batch-from">開始時間</label><Input id="batch-from" type="time" bind:value={from}/></div><div><label for="batch-to">結束時間</label><Input id="batch-to" type="time" bind:value={to}/></div></div>{/if}
<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={skipLeaves}/>略過人員休假日</label><Button variant="outline" onclick={preview}>產生排班預覽</Button></fieldset>
{#if previewCurrent}<section class="rounded-xl border p-3"><h3 class="font-medium">預計建立 {items.length} 筆排班</h3><p class="mt-1 text-xs text-muted-foreground">重複班次及休假由系統在送出時再次判定。</p><ul class="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">{#each items.slice(0,50) as row,i (i)}<li>{row.date} · {staff.find(s=>s.id===row.staff_id)?.name} · {row.start_time.slice(0,5)}–{row.end_time.slice(0,5)}</li>{/each}</ul>{#if items.length>50}<p class="text-xs text-muted-foreground">顯示前 50 筆</p>{/if}</section>{:else if items.length}<p class="text-sm">條件已改變，請重新產生預覽。</p>{/if}
{#if result}<div role="status" class="space-y-1 rounded-xl bg-primary/10 p-4"><p class="font-semibold">已建立 {result.created_count} 筆排班</p><p>略過重複 {result.skipped_existing} 筆、休假 {result.skipped_leave} 筆、無效時間 {result.skipped_invalid} 筆。</p></div>{/if}
</div><div class="flex shrink-0 justify-end gap-2 border-t bg-popover p-4"><Button variant="outline" disabled={busy} onclick={()=>open=false}>關閉</Button><Button disabled={busy||!previewCurrent} onclick={save}>{busy?'處理中…':'確認建立排班'}</Button></div></div></Dialog.Content></Dialog.Root>

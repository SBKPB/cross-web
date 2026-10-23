<script lang="ts">
  import { adminClinicsApi } from '#lib/api/admin/clinics.ts';
  import { apiMessage } from '#lib/admin/scheduling.ts';
  import { Button } from '#lib/components/ui/button/index.ts';
  import { Input } from '#lib/components/ui/input/index.ts';
  import type { ApiPatientListItem } from '#lib/types/clinic.ts';
  import LegacyPanel from './LegacyPanel.svelte';
  import BookingDialog from './BookingDialog.svelte';
  let {facilityId}:{facilityId:string}=$props();
  let search=$state(''),inactive=$state(false),rows=$state<ApiPatientListItem[]>([]),error=$state(''),loading=$state(false),revision=$state(0),offset=$state(0),selected=$state<string|null>(null),seed=$state<ApiPatientListItem|null>(null),booking=$state(false),message=$state('');
  $effect(()=>{const q=search.trim(),id=facilityId,include_inactive=inactive,r=revision,o=offset;void r;let active=true;loading=true;error='';const timer=setTimeout(()=>{adminClinicsApi.patients.list(id,{q:q||undefined,include_inactive,limit:50,offset:o}).then(data=>{if(active)rows=data;}).catch(e=>{if(active)error=apiMessage(e,'客戶名單載入失敗，請重試');}).finally(()=>{if(active)loading=false;});},250);return()=>{active=false;clearTimeout(timer);};});
</script>
<div class="space-y-5"><div><h1 class="text-2xl font-semibold">客戶管理</h1><p class="mt-1 text-sm text-muted-foreground">搜尋客戶、查看歷史紀錄，帶入資料再次預約。</p></div>
<div class="flex flex-wrap items-center gap-3"><div class="min-w-0 flex-1 space-y-1 sm:max-w-sm"><label for="customer-search" class="text-sm">姓名、電話或身分證</label><Input id="customer-search" bind:value={search} oninput={()=>offset=0} placeholder="搜尋既有客戶"/></div><label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={inactive} onchange={()=>offset=0}/>包含停用客戶</label></div>
{#if error}<p role="alert" class="rounded-xl bg-destructive/10 p-3 text-destructive">{error}<Button class="ml-2" variant="outline" onclick={()=>revision++}>重試客戶名單</Button></p>{/if}
{#if message}<p role="status" class="rounded-xl bg-primary/10 p-3 text-primary">{message}</p>{/if}
{#if loading}<p role="status">正在搜尋客戶…</p>{:else if !error}<ul class="divide-y overflow-hidden rounded-2xl border bg-card">{#each rows as p (p.id)}<li class="flex flex-wrap items-center justify-between gap-3 p-4"><button class="min-w-0 flex-1 text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-primary" onclick={()=>selected=p.id}><p class="font-medium">{p.name}{p.is_active?'':'（停用）'}</p><p class="mt-1 text-sm text-muted-foreground">{p.phone||'電話未填'} · 身分證末四碼 {p.national_id_last4??'未記錄'}</p><p class="mt-1 text-xs text-muted-foreground">最近預約 {p.last_visit_date??'未記錄'} · 共 {p.appointment_count} 次 · 未到 {p.no_show_count} 次</p></button><Button variant="outline" onclick={()=>selected=p.id} aria-label={'查看'+p.name+'的客戶檔案'}>查看檔案</Button>{#if p.is_active}<Button onclick={()=>{seed=p;booking=true;}} aria-label={'為'+p.name+'再次預約'}>再次預約</Button>{/if}</li>{:else}<li class="p-10 text-center text-muted-foreground">{search?'找不到符合的客戶':'尚無客戶資料'}</li>{/each}</ul><div class="flex justify-end gap-2"><Button variant="outline" disabled={offset===0} onclick={()=>offset=Math.max(0,offset-50)}>上一頁</Button><Button variant="outline" disabled={rows.length<50} onclick={()=>offset+=50}>下一頁</Button></div>{/if}</div>
{#if selected}<LegacyPanel name="patient" props={{facilityId,patientId:selected,onOpenChange:(open:boolean)=>{if(!open)selected=null;},onSaved:()=>revision++}}/>{/if}
<BookingDialog bind:open={booking} {facilityId} patient={seed} onCreated={()=>{message='預約已建立';revision++;}}/>

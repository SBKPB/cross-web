<script lang="ts">
  import { untrack } from 'svelte';
  import * as Dialog from '#lib/components/ui/dialog/index.ts';
  import { Button } from '#lib/components/ui/button/index.ts';
  import { Input } from '#lib/components/ui/input/index.ts';
  import { adminClinicsApi } from '#lib/api/admin/clinics.ts';
  import { loadBookingCatalog, matchingStaff, type BookingCatalog } from '#lib/admin/workspace.ts';
  import { apiMessage } from '#lib/admin/scheduling.ts';
  import { taipeiToday } from '#lib/constants/appointment.ts';
  import type { ApiPatientListItem } from '#lib/types/clinic.ts';
  import SlotPicker from './SlotPicker.svelte';
  let { open = $bindable(false), facilityId, patient = null, onCreated }: { open?: boolean; facilityId: string; patient?: ApiPatientListItem | null; onCreated: () => void } = $props();
  let catalog = $state<BookingCatalog | null>(null), loading = $state(false), error = $state(''), saving = $state(false);
  let name = $state(''), nationalId = $state(''), phone = $state(''), gender = $state(''), serviceId = $state(''), staffId = $state(''), date = $state(''), time = $state(''), method = $state<'phone' | 'walk_in'>('phone'), notes = $state(''), slotRevision = $state(0);
  let search = $state(''), patients = $state<ApiPatientListItem[]>([]), searchError = $state(''), searching = $state(false), chosen = $state<ApiPatientListItem | null>(null);
  const people = $derived(catalog ? matchingStaff(catalog, serviceId) : []);
  const duration = $derived(catalog?.services.find(s => s.id === serviceId)?.duration_minutes ?? catalog?.facility.slot_duration ?? 30);
  const canSubmit = $derived(!!catalog && !!name.trim() && !!nationalId.trim() && !!staffId && people.some(s => s.id === staffId) && !!date && !!time && !saving);
  function choose(p: ApiPatientListItem) { chosen = p; name = p.name; phone = p.phone; gender = p.gender ?? ''; nationalId = ''; search = ''; patients = []; }
  async function load() {
    loading = true; error = '';
    try { catalog = await loadBookingCatalog(facilityId); }
    catch(e) { error = apiMessage(e, '無法載入人員與服務，請重試'); }
    finally { loading = false; }
  }
  $effect(() => {
    if (!open) return;
    const seed = patient;
    untrack(() => { catalog = null; name = ''; nationalId = ''; phone = ''; gender = ''; serviceId = ''; staffId = ''; date = taipeiToday(); time = ''; method = 'phone'; notes = ''; search = ''; chosen = null; error = ''; if (seed) choose(seed); void load(); });
  });
  $effect(() => {
    const q = search.trim(), id = facilityId;
    if (!open || q.length < 2) { patients = []; searching = false; return; }
    let active = true; searching = true; searchError = '';
    const timer = setTimeout(() => {
      adminClinicsApi.patients.list(id, { q, limit: 10 }).then(data => { if (active) patients = data; }).catch(e => { if(active) searchError = apiMessage(e, '無法搜尋客戶，請稍後再試'); }).finally(() => { if (active) searching = false; });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  });
  async function submit(e: SubmitEvent) {
    e.preventDefault(); if (!canSubmit) return;
    saving = true; error = '';
    try {
      await adminClinicsApi.appointments.create(facilityId, { patient_name: name.trim(), patient_national_id: nationalId.trim().toUpperCase(), patient_phone: phone.trim() || undefined, patient_gender: gender === 'M' || gender === 'F' ? gender : undefined, service_id: serviceId || undefined, staff_id: staffId, appointment_date: date, appointment_time: time, booking_method: method, notes: notes.trim() || undefined });
      onCreated(); open = false;
    } catch(e) { error = apiMessage(e, '建立失敗，請確認資料與可用時段後重試'); slotRevision++; }
    finally { saving = false; }
  }
</script>
<Dialog.Root bind:open>
  <Dialog.Content showCloseButton={!saving} class="block overflow-hidden p-0 sm:max-w-2xl" onInteractOutside={e => { if(saving) e.preventDefault(); }} onEscapeKeydown={e => { if(saving) e.preventDefault(); }}>
    <form onsubmit={submit} class="flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col">
      <Dialog.Header class="shrink-0 p-6 pr-12"><Dialog.Title>新增預約</Dialog.Title><Dialog.Description>為電話或現場客戶安排服務、人員與可用時段。</Dialog.Description></Dialog.Header>
      <div class="min-h-0 space-y-5 overflow-y-auto px-6 pb-6">
        {#if loading}<p role="status">正在載入人員與服務…</p>{/if}
        {#if error}<div role="alert" class="space-y-2 rounded-xl bg-destructive/10 p-3 text-destructive"><p>{error}</p>{#if !catalog}<Button variant="outline" onclick={load}>重新載入</Button>{/if}</div>{/if}
        {#if catalog}
          <fieldset class="space-y-3" disabled={saving}>
            <legend class="mb-3 font-semibold">1. 客戶資料</legend>
            <div class="space-y-1.5"><label for="booking-patient-search">搜尋既有客戶</label><Input id="booking-patient-search" bind:value={search} placeholder="輸入至少 2 字：姓名、電話或身分證" autocomplete="off" /></div>
            {#if searching}<p role="status" class="text-sm text-muted-foreground">搜尋中…</p>{/if}
            {#if searchError}<p role="alert" class="text-destructive">{searchError}</p>{/if}
            {#if search.trim().length >= 2 && !searching && !searchError && !patients.length}<p class="text-sm text-muted-foreground">找不到客戶，請在下方填寫新客資料。</p>{/if}
            {#if patients.length}<ul class="divide-y rounded-xl border">{#each patients as p (p.id)}<li><button type="button" class="w-full p-3 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary" onclick={() => choose(p)}>{p.name} <span class="text-muted-foreground">{p.phone} ••••{p.national_id_last4 ?? ''}</span></button></li>{/each}</ul>{/if}
            {#if chosen}<p class="rounded-xl bg-primary/5 p-3 text-sm">已帶入 {chosen.name}。請核對完整身分證字號（末四碼 {chosen.national_id_last4 ?? '未記錄'}），以正確連結既有紀錄。</p>{/if}
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="space-y-1.5"><label for="booking-name">客戶姓名 *</label><Input id="booking-name" bind:value={name} required maxlength={50} autocomplete="off" /></div>
              <div class="space-y-1.5"><label for="booking-id">身分證字號 *</label><Input id="booking-id" bind:value={nationalId} required maxlength={10} autocomplete="off" /></div>
              <div class="space-y-1.5"><label for="booking-phone">聯絡電話</label><Input id="booking-phone" type="tel" bind:value={phone} maxlength={15} autocomplete="off" /></div>
              <div class="space-y-1.5"><label for="booking-gender">性別</label><select id="booking-gender" class="admin-field" bind:value={gender}><option value="">未填</option><option value="M">男</option><option value="F">女</option></select></div>
            </div>
          </fieldset>
          <fieldset class="space-y-3" disabled={saving}>
            <legend class="mb-3 font-semibold">2. 服務與人員</legend>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="space-y-1.5"><label for="booking-service">服務項目</label><select id="booking-service" class="admin-field" bind:value={serviceId} onchange={() => { staffId = ''; time = ''; }}><option value="">一般預約（{catalog.facility.slot_duration} 分鐘）</option>{#each catalog.services as s (s.id)}<option value={s.id}>{s.service_name} · {s.duration_minutes} 分鐘</option>{/each}</select></div>
              <div class="space-y-1.5"><label for="booking-staff">服務人員 *</label><select id="booking-staff" class="admin-field" bind:value={staffId} required><option value="">請選擇人員</option>{#each people as s (s.id)}<option value={s.id}>{s.name}</option>{/each}</select></div>
            </div>
            {#if !people.length}<p class="text-sm text-destructive">沒有可承接此服務的人員，請先到院所設定確認人員與服務對應。</p>{/if}
            {#if serviceId && !Object.values(catalog.assignments).some(ids => ids.length)}<p class="text-xs text-muted-foreground">尚未設定服務與人員對應，暫列出所有可預約人員。</p>{/if}
          </fieldset>
          <fieldset class="space-y-3" disabled={saving}>
            <legend class="mb-3 font-semibold">3. 預約時段</legend>
            <div class="space-y-1.5"><label for="booking-date">預約日期 *</label><Input id="booking-date" type="date" bind:value={date} min={taipeiToday()} required /></div>
            {#key slotRevision}<SlotPicker facility={catalog.facility} {staffId} {date} {duration} bind:time />{/key}
            <div class="grid gap-3 sm:grid-cols-2"><div class="space-y-1.5"><label for="booking-method">預約方式</label><select id="booking-method" class="admin-field" bind:value={method}><option value="phone">電話</option><option value="walk_in">現場</option></select></div><div class="space-y-1.5"><label for="booking-notes">備註</label><Input id="booking-notes" bind:value={notes} /></div></div>
          </fieldset>
        {/if}
      </div>
      <div class="flex shrink-0 justify-end gap-2 border-t bg-popover p-4" data-slot="dialog-footer"><Button variant="outline" disabled={saving} onclick={() => open = false}>關閉</Button><Button type="submit" disabled={!canSubmit}>{saving ? '建立中…' : '建立預約'}</Button></div>
    </form>
  </Dialog.Content>
</Dialog.Root>

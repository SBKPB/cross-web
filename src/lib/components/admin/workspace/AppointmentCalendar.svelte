<script lang="ts">
  import type { ApiAppointment } from '#lib/types/clinic.ts';
  import { appointmentEnd, minutes, addDateDays } from '#lib/admin/scheduling.ts';
  import StatusPill from './StatusPill.svelte';
  let { appointments, startDate, view, fallbackDuration, onSelect }: { appointments: ApiAppointment[]; startDate: string; view: 'day' | 'week'; fallbackDuration: number; onSelect: (a: ApiAppointment) => void } = $props();
  const groups = $derived(view === 'week' ? Array.from({length:7},(_,i) => ({ id:addDateDays(startDate,i), label:addDateDays(startDate,i).slice(5), rows: appointments.filter(a=>a.appointment_date === addDateDays(startDate,i)) })) : [...new Set(appointments.map(a=>a.staff_id ?? 'none'))].map(id=>({id,label:appointments.find(a=>(a.staff_id ?? 'none')===id)?.staff_name ?? '未指定人員',rows:appointments.filter(a=>(a.staff_id ?? 'none')===id && a.status!=='cancelled')})));
  const firstHour = $derived(Math.max(0, Math.min(8, ...appointments.map(a=>Math.floor(minutes(a.appointment_time)/60)))));
  const lastHour = $derived(Math.min(24, Math.max(18, ...appointments.map(a=>Math.ceil((minutes(a.appointment_time)+(a.duration_minutes ?? fallbackDuration))/60)))));
</script>
<p class="hidden text-xs text-muted-foreground md:block">時間表依預約成立時的服務時長顯示；已取消的預約可切回清單查詢。</p>
<div class="hidden max-h-[42rem] overflow-auto rounded-2xl border bg-card md:block" aria-label={view === 'day' ? '依人員排列的當日時間表' : '七日預約行程'}>
  {#if view === 'week'}
    <div class="grid min-w-[70rem] grid-cols-7 divide-x">
      {#each groups as group (group.id)}<section class="min-w-0 p-3"><h3 class="sticky top-0 z-10 -mx-3 -mt-3 mb-3 border-b bg-card p-3 font-semibold">{group.label} <span class="text-xs text-muted-foreground">{group.rows.length} 筆</span></h3>
        <div class="space-y-2">{#each group.rows as a (a.id)}<button class="block w-full space-y-1 rounded-xl border p-3 text-left hover:border-primary focus-visible:outline-2 focus-visible:outline-primary" onclick={()=>onSelect(a)}><p class="font-semibold tabular-nums">{a.appointment_time.slice(0,5)}–{appointmentEnd(a,fallbackDuration)}</p><p class="truncate">{a.patient_name}</p><p class="truncate text-xs text-muted-foreground">{a.service_name ?? '一般預約'} · {a.staff_name ?? '未指定'}</p><StatusPill status={a.status}/></button>{:else}<p class="py-4 text-sm text-muted-foreground">無預約</p>{/each}</div>
      </section>{/each}
    </div>
  {:else}
    <div class="grid" style:grid-template-columns={'4rem repeat(' + Math.max(groups.length,1) + ', minmax(14rem, 1fr))'}>
      <div class="sticky top-0 z-20 border-b bg-card p-3 text-xs text-muted-foreground">時間</div>{#each groups as g (g.id)}<h3 class="sticky top-0 z-20 border-b border-l bg-card p-3 font-semibold">{g.label}</h3>{/each}
      <div class="relative" style:height={(lastHour-firstHour)*90+'px'}>{#each Array.from({length:lastHour-firstHour},(_,i)=>firstHour+i) as hour (hour)}<span class="absolute left-2 text-xs text-muted-foreground" style:top={(hour-firstHour)*90+'px'}>{String(hour).padStart(2,'0')}:00</span>{/each}</div>
      {#each groups as g (g.id)}<div class="relative border-l" style:height={(lastHour-firstHour)*90+'px'} style:background-image="repeating-linear-gradient(to bottom, transparent 0px, transparent 89px, var(--border) 89px, var(--border) 90px)">
        {#each g.rows as a (a.id)}<button class="absolute inset-x-1 overflow-hidden rounded-lg border border-primary/30 bg-primary/5 px-2 py-1 text-left hover:bg-primary/15 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary" style:top={(minutes(a.appointment_time)-firstHour*60)*1.5+'px'} style:height={Math.max(32,(a.duration_minutes ?? fallbackDuration)*1.5-2)+'px'} onclick={()=>onSelect(a)}><p class="truncate text-xs font-semibold">{a.appointment_time.slice(0,5)}–{appointmentEnd(a,fallbackDuration)} {a.patient_name}</p><p class="truncate text-xs">{a.service_name ?? '一般預約'}</p><p class="text-xs text-muted-foreground">{a.status === 'cancelled' ? '已取消' : a.duration_minutes ?? fallbackDuration} {a.status === 'cancelled' ? '' : '分鐘'}</p></button>{/each}
      </div>{/each}
    </div>
  {/if}
</div>
<p class="text-sm text-muted-foreground md:hidden">手機以時間清單顯示，方便逐筆操作。</p>

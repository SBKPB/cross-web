<script lang="ts">
  import { page } from '$app/state';
  import { api } from '$lib/api/client';
  import { pollOnVisible } from '$lib/hooks/poll-on-visible.svelte';
  import type { DisplayBoard } from '$lib/types/clinic';
  import Seo from '$lib/components/Seo.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  let board = $state<DisplayBoard | null>(null);
  let loading = $state(true);
  let failed = $state(false);
  let generation = 0;
  async function load(id: string, current: number, silent = false) {
    if (!silent) loading = true;
    try {
      const result = await api.get<DisplayBoard>(`/api/v1/booking/clinics/${id}/queue-board`);
      if (generation === current) { board = result; failed = false; }
    } catch { if (generation === current) failed = true; }
    finally { if (generation === current) loading = false; }
  }
  $effect(() => {
    const current = ++generation;
    board = null;
    void load(page.params.facilityId!, current);
    return () => { generation++; };
  });
  pollOnVisible(() => { void load(page.params.facilityId!, generation, true); }, 10_000, () => true);
</script>

<Seo {...data.seo} />

{#if loading}<div class="flex min-h-screen items-center justify-center" role="status">載入看板中…</div>
{:else if failed || !board}<div class="flex min-h-screen items-center justify-center text-2xl text-muted-foreground" role="status">看板暫時無法載入，將自動重試…</div>
{:else if !board.enabled}<div class="flex min-h-screen flex-col items-center justify-center gap-3 text-center"><p class="text-2xl font-semibold">此院所尚未開通候診看板</p><p class="text-muted-foreground">候診室大螢幕為「專業方案」功能，升級後即可啟用。</p></div>
{:else}<div class="flex min-h-screen flex-col px-6 py-5 sm:px-10"><header class="flex items-center justify-between gap-4 border-b border-border/60 pb-4"><div><h1 class="text-2xl font-bold sm:text-3xl">{board.facility_name ?? '候診叫號'}</h1><p class="text-sm text-muted-foreground">候診叫號看板</p></div><span class="text-sm text-muted-foreground">● 每 10 秒自動更新</span></header>
  {#if board.groups.length === 0}<p class="flex flex-1 items-center justify-center text-2xl text-muted-foreground">目前無候診者</p>
  {:else}<div class="mt-6 grid flex-1 auto-rows-min gap-5 lg:grid-cols-2 xl:grid-cols-3">{#each board.groups as group, index (index)}<section class="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5"><header class="flex items-center justify-between gap-4 border-b border-border/60 px-6 py-4"><h2 class="truncate text-xl font-bold">{group.staff_name ?? '不指定醫師'}</h2><div class="flex gap-4 text-sm text-muted-foreground"><span>候診 {group.waiting_count}</span>{#if group.estimated_wait_minutes != null && group.waiting_count > 0}<span>約 {group.estimated_wait_minutes} 分</span>{/if}</div></header><div class="flex flex-col items-center gap-1 py-6"><p class="text-sm text-muted-foreground">目前叫號</p><p class="text-7xl font-black leading-none text-primary tabular-nums">{group.current_number ?? '—'}</p></div><div class="border-t border-border/60">{#if group.appointments.length === 0}<p class="px-6 py-4 text-center text-sm text-muted-foreground">目前無候診者</p>{:else}<ul class="divide-y divide-border/40">{#each group.appointments as appointment, appointmentIndex (appointmentIndex)}<li class={`flex items-center justify-between gap-3 px-6 py-3 ${appointment.status === 'in_progress' ? 'bg-primary/5' : ''}`}><div class="flex items-center gap-4"><span class="w-12 text-2xl font-bold tabular-nums">{appointment.queue_number ?? '—'}</span><span class="text-lg">{appointment.masked_name}</span></div><span class={`rounded-full px-3 py-1 text-sm font-medium ${appointment.status === 'in_progress' ? 'bg-primary text-primary-foreground' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'}`}>{appointment.status === 'in_progress' ? '看診中' : '候診中'}</span></li>{/each}</ul>{/if}</div></section>{/each}</div>{/if}</div>{/if}

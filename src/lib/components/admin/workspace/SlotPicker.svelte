<script lang="ts">
  import AdminSkeleton from "../layout/AdminSkeleton.svelte";
  import { adminClinicsApi } from "#lib/api/admin/clinics.ts";
  import {
    availableTimes,
    addDateDays,
    timeLabel,
    minutes,
    apiMessage,
  } from "#lib/admin/scheduling.ts";
  import type { MedicalFacility } from "#lib/types/clinic.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  let {
    facility,
    staffId,
    date,
    duration,
    excludeId,
    time = $bindable(""),
  }: {
    facility: MedicalFacility;
    staffId: string;
    date: string;
    duration: number;
    excludeId?: string;
    time?: string;
  } = $props();
  let times = $state<string[]>([]),
    loading = $state(false),
    error = $state(""),
    retry = $state(0);
  $effect(() => {
    const selected = { date, staffId, duration, excludeId, facility },
      refresh = retry;
    void refresh;
    time = "";
    times = [];
    error = "";
    loading = false;
    if (!selected.staffId || !selected.date) return;
    loading = true;
    let active = true;
    const range = { start_date: selected.date, end_date: selected.date };
    Promise.all([
      adminClinicsApi.schedules.listAll(facility.id, range),
      adminClinicsApi.staffLeaves.listAll(facility.id, range),
      adminClinicsApi.appointments.list(facility.id, {
        start_date: addDateDays(selected.date, -1),
        end_date: selected.date,
      }),
    ])
      .then(([schedules, leaves, appointments]) => {
        if (active)
          times = availableTimes({
            ...selected,
            staffId: selected.staffId,
            appointments,
            schedules,
            leaves,
          });
      })
      .catch((e) => {
        if (active) error = apiMessage(e, "無法確認可用時段，請重試");
      })
      .finally(() => {
        if (active) loading = false;
      });
    return () => {
      active = false;
    };
  });
</script>

<div class="space-y-2" aria-busy={loading}>
  <p class="text-sm font-medium">
    可用時段 <span class="text-muted-foreground">· {duration} 分鐘</span>
  </p>
  {#if !staffId}<p class="text-sm text-muted-foreground">請先選擇服務人員。</p>
  {:else if loading}<AdminSkeleton
      label="正在確認班表與預約…"
      variant="slots"
    />
  {:else if error}<div
      role="alert"
      class="space-y-2 rounded-xl bg-destructive/10 p-3 text-destructive"
    >
      <p>{error}</p>
      <Button variant="outline" onclick={() => retry++}>重試時段</Button>
    </div>
  {:else if !times.length}<p
      role="status"
      class="rounded-xl bg-muted p-3 text-sm"
    >
      當天沒有可容納完整服務的時段，請換日期或人員。
    </p>
  {:else}
    <div
      class="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto rounded-xl p-1 sm:grid-cols-4"
      aria-label="可用時段"
    >
      {#each times as slot (slot)}<Button
          variant={time === slot ? "default" : "outline"}
          aria-pressed={time === slot}
          onclick={() => (time = slot)}
        >
          {slot}
        </Button>{/each}
    </div>
    {#if !facility.business_hours || !Object.keys(facility.business_hours).length}<p
        class="text-xs text-muted-foreground"
      >
        院所尚未設定營業時間，依人員排班顯示；未排班日列出全天可用時間。
      </p>{/if}
  {/if}
  {#if time}<p
      role="status"
      class="rounded-xl bg-primary/5 p-3 font-medium text-primary"
    >
      {date}
      {time}–{timeLabel(minutes(time) + duration)}
    </p>{/if}
  <p class="text-xs text-muted-foreground">
    已避開休假、休息與既有預約；送出時會再次確認，避免同時預訂。
  </p>
</div>

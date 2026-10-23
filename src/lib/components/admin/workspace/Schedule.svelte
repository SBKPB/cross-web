<script lang="ts">
  import AdminSkeleton from "../layout/AdminSkeleton.svelte";
  import * as Field from "#lib/components/ui/field/index.ts";
  import * as NativeSelect from "#lib/components/ui/native-select/index.ts";
  import * as Card from "#lib/components/ui/card/index.ts";

  import { SvelteURL } from "svelte/reactivity";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { untrack } from "svelte";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import * as Dialog from "#lib/components/ui/dialog/index.ts";
  import { adminClinicsApi } from "#lib/api/admin/clinics.ts";
  import { addDateDays, apiMessage } from "#lib/admin/scheduling.ts";
  import { taipeiToday } from "#lib/constants/appointment.ts";
  import type {
    MedicalFacility,
    ApiSchedule,
    ApiStaff,
    ApiStaffLeave,
  } from "#lib/types/clinic.ts";
  import type { ScheduleSession } from "#lib/types/schedule.ts";
  import BatchSchedule from "./BatchSchedule.svelte";
  let { facility }: { facility: MedicalFacility } = $props();
  const month = $derived(
    /^\d{4}-(0[1-9]|1[0-2])$/.test(page.url.searchParams.get("month") ?? "")
      ? page.url.searchParams.get("month")!
      : taipeiToday().slice(0, 7),
  );
  const first = $derived(month + "-01"),
    last = $derived(
      addDateDays(
        new Date(
          Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1),
        )
          .toISOString()
          .slice(0, 10),
        -1,
      ),
    );
  const days = $derived(
    Array.from({ length: Number(last.slice(-2)) }, (_, i) =>
      addDateDays(first, i),
    ),
  );
  const staffFilter = $derived(
    page.url.searchParams.get("schedule_staff") ?? "",
  );
  let staff = $state<ApiStaff[]>([]),
    shifts = $state<ApiSchedule[]>([]),
    leaves = $state<ApiStaffLeave[]>([]),
    loading = $state(false),
    loaded = $state(""),
    error = $state(""),
    revision = $state(0),
    message = $state("");
  let showMonth = $state(false);
  const mobileDays = $derived(
    showMonth
      ? days
      : days.filter(
            (day) =>
              (day >= taipeiToday() && day <= addDateDays(taipeiToday(), 6)) ||
              visibleShifts.some((s) => s.date === day) ||
              visibleLeaves.some((l) => l.date === day),
          ).length
        ? days.filter(
            (day) =>
              (day >= taipeiToday() && day <= addDateDays(taipeiToday(), 6)) ||
              visibleShifts.some((s) => s.date === day) ||
              visibleLeaves.some((l) => l.date === day),
          )
        : days.slice(0, 7),
  );
  let selected = $state(""),
    staffId = $state(""),
    session = $state<ScheduleSession>("morning"),
    start = $state("09:00"),
    end = $state("12:00"),
    note = $state(""),
    busy = $state(false),
    dialogError = $state(""),
    remove = $state<{
      kind: "shift" | "leave";
      id: string;
      staffId: string;
    } | null>(null),
    batch = $state(false);
  const sessions = { morning: "早班", afternoon: "午班", evening: "晚班" };
  const professionals = $derived(
    staff.filter(
      (s) =>
        s.is_active && ["doctor", "beautician", "therapist"].includes(s.role),
    ),
  );
  const visibleShifts = $derived(
    shifts.filter((s) => !staffFilter || s.staff_id === staffFilter),
  );
  const visibleLeaves = $derived(
    leaves.filter((s) => !staffFilter || s.staff_id === staffFilter),
  );
  $effect(() => {
    const id = facility.id,
      a = first,
      b = last,
      r = revision;
    void r;
    let active = true;
    untrack(() => {
      loading = true;
      error = "";
      if (loaded !== a) {
        shifts = [];
        leaves = [];
      }
    });
    Promise.all([
      adminClinicsApi.staff.list(id),
      adminClinicsApi.schedules.listAll(id, { start_date: a, end_date: b }),
      adminClinicsApi.staffLeaves.listAll(id, { start_date: a, end_date: b }),
    ])
      .then(([s, sch, l]) => {
        if (active) {
          staff = s;
          shifts = sch;
          leaves = l;
          loaded = a;
        }
      })
      .catch((e) => {
        if (active) error = apiMessage(e, "班表載入失敗，請重試");
      })
      .finally(() => {
        if (active) loading = false;
      });
    return () => {
      active = false;
    };
  });
  function query(values: Record<string, string>) {
    const url = new SvelteURL(page.url.href);
    for (const [key, value] of Object.entries(values)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    void goto(url, { replace: true, reset: false });
  }
  function changeMonth(delta: number) {
    const d = new Date(
      Date.UTC(
        Number(month.slice(0, 4)),
        Number(month.slice(5, 7)) - 1 + delta,
        1,
      ),
    );
    query({ month: d.toISOString().slice(0, 7) });
  }
  function openDay(day: string) {
    selected = day;
    staffId = staffFilter;
    session = "morning";
    start = "09:00";
    end = "12:00";
    note = "";
    dialogError = "";
    remove = null;
  }
  async function save(kind: "shift" | "leave") {
    if (!staffId || busy) return;
    busy = true;
    dialogError = "";
    try {
      if (kind === "shift")
        await adminClinicsApi.schedules.create(facility.id, staffId, {
          date: selected,
          start_time: start,
          end_time: end,
          session_type: session,
        });
      else
        await adminClinicsApi.staffLeaves.create(facility.id, staffId, {
          date: selected,
          note: note || undefined,
        });
      message = kind === "shift" ? "排班已新增" : "休假已設定";
      revision++;
    } catch (e) {
      dialogError = apiMessage(e, "儲存失敗，請重試");
    } finally {
      busy = false;
    }
  }
  async function confirmRemove() {
    if (!remove || busy) return;
    busy = true;
    dialogError = "";
    try {
      if (remove.kind === "shift")
        await adminClinicsApi.schedules.delete(
          facility.id,
          remove.staffId,
          remove.id,
        );
      else
        await adminClinicsApi.staffLeaves.delete(
          facility.id,
          remove.staffId,
          remove.id,
        );
      remove = null;
      message = "班表已更新";
      revision++;
    } catch (e) {
      dialogError = apiMessage(e, "移除失敗，請重試");
    } finally {
      busy = false;
    }
  }
</script>

<div class="space-y-5">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">排班管理</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        按日期管理人員班表與休假，支援週期樣板及複製。
      </p>
    </div>
    <Button onclick={() => (batch = true)}>智慧排班</Button>
  </div>
  <div class="flex flex-wrap items-end gap-2">
    <Button
      variant="outline"
      aria-label="上一個月"
      onclick={() => changeMonth(-1)}
    >
      ←
    </Button>
    <h2 class="px-2 py-2 font-semibold">{month.replace("-", " 年 ")} 月</h2>
    <Button
      variant="outline"
      aria-label="下一個月"
      onclick={() => changeMonth(1)}
    >
      →
    </Button>
    <div class="min-w-40 space-y-1">
      <Field.Label for="schedule-person" class="text-sm">
        篩選人員
      </Field.Label><NativeSelect.Root
        id="schedule-person"
        class="w-full"
        value={staffFilter}
        onchange={(e) => query({ schedule_staff: e.currentTarget.value })}
      >
        <NativeSelect.Option value="">
          全部人員
        </NativeSelect.Option>{#each professionals as s (s.id)}<NativeSelect.Option
            value={s.id}
          >
            {s.name}
          </NativeSelect.Option>{/each}
      </NativeSelect.Root>
    </div>
    <Button variant="outline" disabled={loading} onclick={() => revision++}>
      更新班表
    </Button>
  </div>
  {#if message}<p
      role="status"
      class="rounded-xl bg-primary/10 p-3 text-primary"
    >
      {message}
    </p>{/if}
  {#if error}<div
      role="alert"
      class="space-y-2 rounded-xl bg-destructive/10 p-3 text-destructive"
    >
      <p>{error}</p>
      <Button variant="outline" onclick={() => revision++}>重試班表</Button>
    </div>{/if}
  {#if loading && loaded !== first}<AdminSkeleton
      label="正在載入班表…"
      variant="calendar"
    />{:else if !error || loaded === first}
    <Card.Root class="gap-0 shadow-sm hidden p-4 md:block">
      <div class="grid grid-cols-7 gap-2">
        {#each ["日", "一", "二", "三", "四", "五", "六"] as day (day)}<p
            class="py-2 text-center text-sm text-muted-foreground"
          >
            {day}
          </p>{/each}{#each Array.from({ length: new Date(first + "T12:00:00Z").getUTCDay() }, (_, i) => i) as blank (blank)}<div
          ></div>{/each}{#each days as day (day)}<button
            class="min-h-28 min-w-0 space-y-1 rounded-xl border p-2 text-left hover:border-primary focus-visible:outline-2 focus-visible:outline-primary {day ===
            taipeiToday()
              ? 'border-primary bg-primary/5'
              : ''}"
            aria-label={"管理 " + day + " 排班與休假"}
            onclick={() => openDay(day)}
          >
            <p class="text-right text-sm font-medium">
              {Number(day.slice(-2))}
            </p>
            {#each visibleShifts
              .filter((s) => s.date === day)
              .slice(0, 2) as s (s.id)}<p
                class="truncate rounded bg-primary/10 px-1 text-xs text-primary"
              >
                {s.staff_name}
                {s.start_time.slice(0, 5)}
              </p>{/each}{#each visibleLeaves
              .filter((l) => l.date === day)
              .slice(0, 1) as l (l.id)}<p
                class="truncate text-xs text-destructive"
              >
                休 {staff.find((s) => s.id === l.staff_id)?.name}
              </p>{/each}{#if visibleShifts.filter((s) => s.date === day).length > 2}<p
                class="text-xs text-muted-foreground"
              >
                查看全部安排
              </p>{/if}
          </button>{/each}
      </div>
    </Card.Root>
    <div class="space-y-2 md:hidden">
      <div class="space-y-1">
        <Field.Label for="manage-schedule-date" class="text-sm">
          直接管理日期
        </Field.Label><Input
          id="manage-schedule-date"
          type="date"
          value={taipeiToday()}
          onchange={(e) => {
            if (e.currentTarget.value) {
              query({ month: e.currentTarget.value.slice(0, 7) });
              openDay(e.currentTarget.value);
            }
          }}
        />
      </div>
      <p class="text-xs text-muted-foreground">
        顯示近期日期及已有安排的日期。
      </p>
      {#each mobileDays as day (day)}<button
          class="block w-full space-y-2 rounded-xl border bg-card p-4 text-left hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
          onclick={() => openDay(day)}
          aria-label={"管理 " + day + " 排班與休假"}
        >
          <p class="font-semibold">
            {day.slice(5)}
            {day === taipeiToday() ? "今天" : ""}
          </p>
          {#each visibleShifts.filter((s) => s.date === day) as s (s.id)}<p
              class="text-sm"
            >
              {s.staff_name} · {s.start_time.slice(0, 5)}–{s.end_time.slice(
                0,
                5,
              )}{!s.is_available ? "（停用）" : ""}
            </p>{/each}{#each visibleLeaves.filter((l) => l.date === day) as l (l.id)}<p
              class="text-sm text-destructive"
            >
              {staff.find((s) => s.id === l.staff_id)?.name} 休假
            </p>{/each}{#if !visibleShifts.some((s) => s.date === day) && !visibleLeaves.some((l) => l.date === day)}<p
              class="text-sm text-muted-foreground"
            >
              尚無個別排班或休假 · 點此安排
            </p>{/if}
        </button>{/each}<Button
        variant="outline"
        onclick={() => (showMonth = !showMonth)}
      >
        {showMonth ? "顯示近期安排" : "顯示整月日期"}
      </Button>
    </div>
    <p class="text-xs text-muted-foreground">
      未設定個別排班時，預約會依院所營業時間判定；休假優先。變更前請核對當日既有預約。
    </p>
  {/if}
</div>
<Dialog.Root
  open={!!selected}
  onOpenChange={(v) => {
    if (!v && !busy) selected = "";
  }}
>
  <Dialog.Content
    class="admin-dialog sm:max-w-xl"
    onInteractOutside={(e) => {
      if (busy) e.preventDefault();
    }}
    onEscapeKeydown={(e) => {
      if (busy) e.preventDefault();
    }}
    showCloseButton={!busy}
  >
    <Dialog.Header>
      <Dialog.Title>{selected} 排班與休假</Dialog.Title><Dialog.Description>
        檢視安排，新增班次或設定休假。
      </Dialog.Description>
    </Dialog.Header>
    {#if dialogError}<p
        role="alert"
        class="rounded-xl bg-destructive/10 p-3 text-destructive"
      >
        {dialogError}
      </p>{/if}
    {#if message}<p role="status" class="text-primary">{message}</p>{/if}
    <div class="space-y-2">
      {#each shifts.filter((s) => s.date === selected) as s (s.id)}<div
          class="flex items-center justify-between gap-2 rounded-xl border p-3"
        >
          <p>
            {s.staff_name} · {sessions[s.session_type]}
            <br />
            <span class="text-sm text-muted-foreground">
              {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
            </span>
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onclick={() =>
              (remove = { kind: "shift", id: s.id, staffId: s.staff_id })}
            aria-label={"移除" + s.staff_name + "的排班"}
          >
            移除班次
          </Button>
        </div>{/each}{#each leaves.filter((l) => l.date === selected) as l (l.id)}<div
          class="flex items-center justify-between gap-2 rounded-xl border p-3"
        >
          <p>
            {staff.find((s) => s.id === l.staff_id)?.name} 休假
            <br />
            <span class="text-sm text-muted-foreground">{l.note ?? ""}</span>
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onclick={() =>
              (remove = { kind: "leave", id: l.id, staffId: l.staff_id })}
          >
            移除休假
          </Button>
        </div>{/each}
    </div>
    {#if remove}<div class="space-y-3 rounded-xl bg-destructive/5 p-4">
        <p>
          確認移除此{remove.kind === "shift"
            ? "班次"
            : "休假"}？請先核對既有預約安排。
        </p>
        <div class="flex gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onclick={() => (remove = null)}
          >
            保留安排
          </Button><Button
            variant="destructive"
            disabled={busy}
            onclick={confirmRemove}
          >
            確認移除
          </Button>
        </div>
      </div>{/if}
    <div class="space-y-3 border-t pt-4">
      <div class="space-y-1">
        <Field.Label for="shift-staff" class="text-sm font-medium">
          服務人員
        </Field.Label><NativeSelect.Root
          id="shift-staff"
          class="w-full"
          bind:value={staffId}
          disabled={busy}
        >
          <NativeSelect.Option value="">
            請選擇人員
          </NativeSelect.Option>{#each professionals as s (s.id)}<NativeSelect.Option
              value={s.id}
            >
              {s.name}
            </NativeSelect.Option>{/each}
        </NativeSelect.Root>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div class="space-y-1">
          <Field.Label for="shift-session" class="text-sm font-medium">
            班次
          </Field.Label><NativeSelect.Root
            id="shift-session"
            class="w-full"
            bind:value={session}
            onchange={() => {
              [start, end] =
                session === "morning"
                  ? ["09:00", "12:00"]
                  : session === "afternoon"
                    ? ["13:00", "17:00"]
                    : ["17:00", "21:00"];
            }}
          >
            {#each Object.entries(sessions) as [value, label] (value)}<NativeSelect.Option
                {value}
              >
                {label}
              </NativeSelect.Option>{/each}
          </NativeSelect.Root>
        </div>
        <div class="space-y-1">
          <Field.Label for="shift-start" class="text-sm font-medium">
            開始
          </Field.Label><Input
            id="shift-start"
            type="time"
            bind:value={start}
          />
        </div>
        <div class="space-y-1">
          <Field.Label for="shift-end" class="text-sm font-medium">
            結束
          </Field.Label><Input id="shift-end" type="time" bind:value={end} />
        </div>
      </div>
      {#if start >= end}<p class="text-sm text-destructive">
          結束時間需晚於開始時間。
        </p>{/if}<Button
        disabled={busy || !staffId || !start || !end || start >= end}
        onclick={() => save("shift")}
      >
        新增班次
      </Button>
      <div class="space-y-1 border-t pt-3">
        <Field.Label for="leave-note" class="text-sm font-medium">
          休假備註
        </Field.Label><Input
          id="leave-note"
          bind:value={note}
          maxlength={200}
        />
      </div>
      <Button
        variant="outline"
        disabled={busy || !staffId}
        onclick={() => save("leave")}
      >
        設定當日休假
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
<BatchSchedule
  bind:open={batch}
  facilityId={facility.id}
  staff={professionals}
  onSaved={() => {
    revision++;
    message = "批次排班已更新";
  }}
/>

<script lang="ts">
  import AdminSkeleton from "../layout/AdminSkeleton.svelte";
  import {
    CalendarDays,
    CalendarCheck2,
    UserRoundCheck,
    Clock3,
    Activity,
    Plus,
    List,
    CalendarRange,
    ArrowLeft,
    ArrowRight,
  } from "@lucide/svelte";
  import * as Avatar from "#lib/components/ui/avatar/index.ts";
  import * as Empty from "#lib/components/ui/empty/index.ts";
  import * as Tabs from "#lib/components/ui/tabs/index.ts";

  import * as Card from "#lib/components/ui/card/index.ts";
  import * as Field from "#lib/components/ui/field/index.ts";
  import * as NativeSelect from "#lib/components/ui/native-select/index.ts";
  import * as Table from "#lib/components/ui/table/index.ts";

  import { SvelteURL } from "svelte/reactivity";
  import { untrack } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import { adminClinicsApi } from "#lib/api/admin/clinics.ts";
  import {
    taipeiToday,
    APPOINTMENT_STATUS_LABELS,
  } from "#lib/constants/appointment.ts";
  import {
    validDate,
    addDateDays,
    appointmentEnd,
    apiMessage,
  } from "#lib/admin/scheduling.ts";
  import { canAccessFeature } from "#lib/feature-access.ts";
  import type { ApiAppointment, MedicalFacility } from "#lib/types/clinic.ts";
  import AppointmentDialog from "./AppointmentDialog.svelte";
  import AppointmentCalendar from "./AppointmentCalendar.svelte";
  import BookingDialog from "./BookingDialog.svelte";
  import StatusPill from "./StatusPill.svelte";
  let {
    facility,
    workbench = false,
  }: { facility: MedicalFacility; workbench?: boolean } = $props();
  const startDate = $derived(
    validDate(page.url.searchParams.get("start"), taipeiToday()),
  );
  const view = $derived(
    ["day", "week"].includes(page.url.searchParams.get("view") ?? "")
      ? (page.url.searchParams.get("view") as "day" | "week")
      : "list",
  );
  const endDate = $derived(
    view === "day"
      ? startDate
      : view === "week"
        ? addDateDays(startDate, 6)
        : validDate(page.url.searchParams.get("end"), startDate) < startDate
          ? startDate
          : validDate(page.url.searchParams.get("end"), startDate),
  );
  const status = $derived(page.url.searchParams.get("status") ?? "all"),
    staff = $derived(page.url.searchParams.get("staff") ?? ""),
    service = $derived(page.url.searchParams.get("service") ?? "");
  const createOpen = $derived(page.url.searchParams.get("new") === "1"),
    appointmentId = $derived(page.url.searchParams.get("appointment") ?? "");
  let showFilters = $state(false);
  let rows = $state<ApiAppointment[]>([]),
    loading = $state(true),
    error = $state(""),
    loadedRange = $state(""),
    updated = $state(""),
    revision = $state(0),
    search = $state(""),
    message = $state(""),
    pending = $state("");
  const filterCount = $derived(
    Number(status !== "all") +
      Number(!!staff) +
      Number(!!service) +
      Number(!!search.trim()),
  );
  let selected = $state<ApiAppointment | null>(null),
    detailError = $state("");
  async function params(values: Record<string, string | null>) {
    const url = new SvelteURL(page.url.href);
    for (const [key, value] of Object.entries(values)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    await goto(url, { replace: true, reset: false });
  }
  $effect(() => {
    const id = facility.id,
      start = startDate,
      end = endDate,
      refresh = revision;
    void refresh;
    let active = true;
    untrack(() => {
      loading = true;
      error = "";
      if (loadedRange !== `${id}:${start}:${end}`) {
        rows = [];
        updated = "";
      }
    });
    adminClinicsApi.appointments
      .list(id, { start_date: start, end_date: end })
      .then((data) => {
        if (active) {
          rows = data;
          loadedRange = `${id}:${start}:${end}`;
          updated = new Intl.DateTimeFormat("zh-TW", {
            timeZone: "Asia/Taipei",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }).format(new Date());
        }
      })
      .catch((e) => {
        if (active) error = apiMessage(e, "預約資料載入失敗，請重試");
      })
      .finally(() => {
        if (active) loading = false;
      });
    return () => {
      active = false;
    };
  });
  $effect(() => {
    const id = appointmentId,
      facilityId = facility.id;
    if (!id) {
      selected = null;
      detailError = "";
      return;
    }
    let active = true;
    detailError = "";
    selected = null;
    adminClinicsApi.appointments
      .get(facilityId, id)
      .then((a) => {
        if (active) selected = a;
      })
      .catch((e) => {
        if (active) detailError = apiMessage(e, "無法開啟預約詳情，請重試");
      });
    return () => {
      active = false;
    };
  });
  const filtered = $derived(
    rows
      .filter(
        (a) =>
          (status === "all" || a.status === status) &&
          (!staff || a.staff_id === staff) &&
          (!service || (a.service_id ?? "none") === service) &&
          (!search.trim() ||
            `${a.patient_name} ${a.patient_phone}`
              .toLowerCase()
              .includes(search.trim().toLowerCase())),
      )
      .sort((a, b) =>
        `${a.appointment_date} ${a.appointment_time}`.localeCompare(
          `${b.appointment_date} ${b.appointment_time}`,
        ),
      ),
  );
  const people = $derived([
    ...new Map(
      rows
        .filter((a) => a.staff_id)
        .map((a) => [a.staff_id!, a.staff_name ?? "未指定"]),
    ).entries(),
  ]);
  const services = $derived([
    ...new Map(
      rows.map((a) => [a.service_id ?? "none", a.service_name ?? "一般預約"]),
    ).entries(),
  ]);
  const stats = $derived([
    { label: "預約總數", value: rows.length },
    {
      label: "待報到",
      value: rows.filter((a) => a.status === "confirmed").length,
    },
    {
      label: "已報到",
      value: rows.filter((a) => a.status === "checked_in").length,
    },
    {
      label: "服務中",
      value: rows.filter((a) => a.status === "in_progress").length,
    },
  ]);
  async function checkIn(a: ApiAppointment) {
    pending = a.id;
    message = "";
    try {
      await adminClinicsApi.queue.checkIn(facility.id, a.id);
      message = `${a.patient_name} 已報到`;
      revision++;
    } catch (e) {
      error = apiMessage(e, "報到失敗，請重試");
    } finally {
      pending = "";
    }
  }
  function updatedAppointment(text: string) {
    message = text;
    revision++;
  }
  function select(a: ApiAppointment) {
    void params({ appointment: a.id });
  }
  function changeView(v: string) {
    void params({
      view: v,
      end: v === "week" ? addDateDays(startDate, 6) : startDate,
    });
  }
</script>

<Tabs.Root value={view} onValueChange={changeView} class="gap-7">
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <p
        class="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"
      >
        <CalendarDays class="size-3.5" />{startDate.replaceAll("-", " / ")}
        <span class="mx-1 text-border">/</span>
        預約與現場營運
      </p>
      <h1 class="text-2xl font-semibold tracking-tight">
        {workbench ? "今日工作台" : "預約管理"}
      </h1>
      <p class="mt-2 text-sm leading-6 text-muted-foreground">
        {workbench
          ? "每一天的安排，從這裡開始。掌握預約、報到與服務進度。"
          : "把諮詢與療程安排妥當，讓客戶的每次到訪更從容。"}
      </p>
    </div>
    <Button
      aria-label="＋ 新增預約"
      class="h-10 gap-2 px-5 shadow-sm"
      onclick={() => params({ new: "1" })}
    >
      <Plus class="size-4" />
      <span>新增預約</span>
    </Button>
  </div>
  {#if workbench}<div class="grid grid-cols-2 gap-3 lg:gap-5 xl:grid-cols-4">
      {#each stats as stat, i (stat.label)}{@const Icon = [
          CalendarDays,
          Clock3,
          UserRoundCheck,
          Activity,
        ][i]}<Card.Root class="gap-0 overflow-hidden py-0 shadow-sm">
          <Card.Content class="p-4 sm:p-5">
            <div class="mb-4 flex items-center justify-between gap-2">
              <p class="text-xs font-medium text-muted-foreground">
                {stat.label}
              </p>
              <span
                class="grid size-9 shrink-0 place-items-center rounded-2xl bg-primary/7 text-primary"
              >
                <Icon class="size-[18px]" strokeWidth={1.7} />
              </span>
            </div>
            <p
              class="text-[2rem] font-semibold leading-none tracking-tight tabular-nums sm:text-4xl"
            >
              {updated ? stat.value : "—"}
              <span class="ml-2 text-xs font-normal text-muted-foreground">
                筆
              </span>
            </p>
            <p class="mt-4 text-[11px] text-muted-foreground">
              {[
                "所選日期的全部預約",
                "預約成立，等待客戶到訪",
                "已完成櫃檯報到",
                "正在看診或接受療程",
              ][i]}
            </p>
          </Card.Content>
        </Card.Root>{/each}
    </div>{/if}
  <Card.Root class="gap-0 space-y-5 p-4 shadow-sm sm:p-6">
    <div class="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={startDate === taipeiToday() && endDate === startDate
          ? "default"
          : "outline"}
        onclick={() =>
          params({
            start: taipeiToday(),
            end: taipeiToday(),
            view: view === "week" ? "list" : view,
          })}
      >
        今天
      </Button><Button
        size="sm"
        variant={startDate === taipeiToday() &&
        endDate === addDateDays(startDate, 6)
          ? "default"
          : "outline"}
        onclick={() =>
          params({
            start: taipeiToday(),
            end: addDateDays(taipeiToday(), 6),
            view: "week",
          })}
      >
        未來七天
      </Button><Button
        size="sm"
        variant="outline"
        onclick={() =>
          params({
            start: addDateDays(startDate, view === "week" ? -7 : -1),
            end: addDateDays(endDate, view === "week" ? -7 : -1),
          })}
        aria-label="上一個日期範圍"
      >
        <ArrowLeft class="size-4" />
      </Button><Button
        size="sm"
        variant="outline"
        onclick={() =>
          params({
            start: addDateDays(startDate, view === "week" ? 7 : 1),
            end: addDateDays(endDate, view === "week" ? 7 : 1),
          })}
        aria-label="下一個日期範圍"
      >
        <ArrowRight class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        class={workbench ? "inline-flex" : "sm:hidden"}
        aria-expanded={showFilters}
        onclick={() => (showFilters = !showFilters)}
      >
        {showFilters ? "收合篩選" : "更多篩選"}{filterCount
          ? `（${filterCount}）`
          : ""}
      </Button>
      <div class="w-full sm:ml-auto sm:w-auto">
        <Tabs.List
          aria-label="預約檢視方式"
          class="grid w-full grid-cols-3 sm:inline-flex"
        >
          {#each [{ id: "list", label: "清單", icon: List }, { id: "day", label: "人員日曆", icon: CalendarDays }, { id: "week", label: "週行程", icon: CalendarRange }] as item (item.id)}<Tabs.Trigger
              value={item.id}
              class="gap-1.5 px-3 text-xs"
            >
              <item.icon class="size-3.5" />{item.label}
            </Tabs.Trigger>{/each}
        </Tabs.List>
      </div>
    </div>

    <div
      class={workbench
        ? "grid gap-3 sm:grid-cols-2"
        : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"}
    >
      <div class="space-y-1">
        <Field.Label for="appointments-search" class="text-sm">
          搜尋客戶
        </Field.Label><Input
          id="appointments-search"
          bind:value={search}
          placeholder="姓名或電話"
        />
      </div>
      <div class="space-y-1">
        <Field.Label for="appointments-start" class="text-sm">
          {view === "week" ? "起始日期" : "日期"}
        </Field.Label><Input
          id="appointments-start"
          type="date"
          value={startDate}
          onchange={(e) => {
            if (e.currentTarget.value)
              void params({
                start: e.currentTarget.value,
                end: view === "list" ? e.currentTarget.value : null,
              });
          }}
        />
      </div>
      {#if view === "list" && (!workbench || showFilters)}<div
          class={showFilters
            ? "space-y-1"
            : workbench
              ? "hidden"
              : "hidden space-y-1 sm:block"}
        >
          <Field.Label for="appointments-end" class="text-sm">
            結束日期
          </Field.Label><Input
            id="appointments-end"
            type="date"
            min={startDate}
            value={endDate}
            onchange={(e) => {
              if (e.currentTarget.value)
                void params({ end: e.currentTarget.value });
            }}
          />
        </div>{/if}
      <div
        class={showFilters
          ? "space-y-1"
          : workbench
            ? "hidden"
            : "hidden space-y-1 sm:block"}
      >
        <Field.Label for="appointments-status" class="text-sm">
          預約狀態
        </Field.Label><NativeSelect.Root
          id="appointments-status"
          class="w-full"
          value={status}
          onchange={(e) => params({ status: e.currentTarget.value })}
        >
          <NativeSelect.Option value="all">
            全部狀態
          </NativeSelect.Option>{#each Object.entries(APPOINTMENT_STATUS_LABELS) as [value, label] (value)}<NativeSelect.Option
              {value}
            >
              {label}
            </NativeSelect.Option>{/each}
        </NativeSelect.Root>
      </div>
      <div
        class={showFilters
          ? "space-y-1"
          : workbench
            ? "hidden"
            : "hidden space-y-1 sm:block"}
      >
        <Field.Label for="appointments-staff" class="text-sm">
          服務人員
        </Field.Label><NativeSelect.Root
          id="appointments-staff"
          class="w-full"
          value={staff}
          onchange={(e) => params({ staff: e.currentTarget.value })}
        >
          <NativeSelect.Option value="">
            全部人員
          </NativeSelect.Option>{#each people as [value, label] (value)}<NativeSelect.Option
              {value}
            >
              {label}
            </NativeSelect.Option>{/each}
        </NativeSelect.Root>
      </div>
      <div
        class={showFilters
          ? "space-y-1"
          : workbench
            ? "hidden"
            : "hidden space-y-1 sm:block"}
      >
        <Field.Label for="appointments-service" class="text-sm">
          服務項目
        </Field.Label><NativeSelect.Root
          id="appointments-service"
          class="w-full"
          value={service}
          onchange={(e) => params({ service: e.currentTarget.value })}
        >
          <NativeSelect.Option value="">
            全部服務
          </NativeSelect.Option>{#each services as [value, label] (value)}<NativeSelect.Option
              {value}
            >
              {label}
            </NativeSelect.Option>{/each}
        </NativeSelect.Root>
      </div>
    </div>
    {#if filterCount}<div
        class="flex flex-wrap items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-xs text-foreground"
        role="status"
        aria-label="已套用篩選"
      >
        <span>已套用 {filterCount} 項篩選</span>
        {#if status !== "all"}<span
            class="rounded-full border border-primary/20 px-2 py-1"
          >
            {APPOINTMENT_STATUS_LABELS[
              status as keyof typeof APPOINTMENT_STATUS_LABELS
            ] ?? "指定狀態"}
          </span>{/if}{#if staff}<span
            class="rounded-full border border-primary/20 px-2 py-1"
          >
            {people.find(([id]) => id === staff)?.[1] ?? "指定人員"}
          </span>{/if}{#if service}<span
            class="rounded-full border border-primary/20 px-2 py-1"
          >
            {services.find(([id]) => id === service)?.[1] ?? "指定服務"}
          </span>{/if}<Button
          size="sm"
          variant="ghost"
          class="ml-auto"
          onclick={() => {
            search = "";
            void params({ status: null, staff: null, service: null });
          }}
        >
          清除篩選
        </Button>
      </div>{/if}
    <div
      class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"
    >
      <p>
        {startDate} ～ {endDate}{#if updated}
          · 更新於 {updated}{/if}
      </p>
      <Button
        variant="ghost"
        size="sm"
        disabled={loading}
        onclick={() => revision++}
      >
        {loading ? "更新中…" : "重新整理預約"}
      </Button>
    </div>
  </Card.Root>
  <Tabs.Content value={view} class="space-y-5">
    {#if message}<p
        role="status"
        class="rounded-xl bg-primary/10 p-3 text-sm text-primary"
      >
        {message}
      </p>{/if}
    {#if error}<div
        role="alert"
        class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-destructive/10 p-4 text-sm text-destructive"
      >
        <div>
          <p>{error}</p>
          {#if updated}<p>
              目前顯示 {updated} 的資料，尚未取得最新結果。
            </p>{:else}<p>尚未取得預約資料，不能判定此期間是否有預約。</p>{/if}
        </div>
        <Button variant="outline" onclick={() => revision++}>重試預約</Button>
      </div>{/if}
    {#if detailError}<div
        role="alert"
        class="rounded-xl bg-destructive/10 p-3 text-destructive"
      >
        {detailError}<Button
          variant="outline"
          onclick={() => params({ appointment: null })}
        >
          關閉提示
        </Button>
      </div>{/if}
    {#if loading && !updated}<AdminSkeleton
        label="正在載入預約…"
        variant="table"
      />
    {:else if !error || updated}
      <div aria-busy={loading} class="space-y-3">
        <p class="text-sm text-muted-foreground">
          共 {filtered.length} 筆{search || staff || service || status !== "all"
            ? "符合篩選條件"
            : ""}
        </p>
        {#if !filtered.length}<Card.Root class="gap-0 py-0 shadow-sm">
            <Empty.Root class="py-14">
              <Empty.Header>
                <Empty.Media variant="icon">
                  <CalendarCheck2 class="size-6" />
                </Empty.Media><Empty.Title>
                  {rows.length ? "沒有符合條件的預約" : "期間無預約"}
                </Empty.Title><Empty.Description>
                  {rows.length
                    ? "請調整姓名、日期或篩選條件。"
                    : "可從右上方新增預約，或切換日期查看。"}
                </Empty.Description>
              </Empty.Header>{#if rows.length}<Empty.Content>
                  <Button
                    variant="outline"
                    onclick={() => {
                      search = "";
                      void params({ status: null, staff: null, service: null });
                    }}
                  >
                    清除篩選
                  </Button>
                </Empty.Content>{/if}
            </Empty.Root>
          </Card.Root>
        {:else}
          {#if view !== "list"}<AppointmentCalendar
              appointments={filtered}
              {startDate}
              {view}
              fallbackDuration={facility.slot_duration}
              onSelect={select}
            />{/if}
          <div
            class={view === "list"
              ? "hidden overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 md:block"
              : "hidden"}
          >
            <Table.Root class="w-full text-left text-sm">
              <Table.Header
                class="border-b border-border/60 bg-muted/40 text-muted-foreground"
              >
                <Table.Row>
                  <Table.Head class="p-3">日期／時間</Table.Head><Table.Head
                    class="p-3"
                  >
                    客戶
                  </Table.Head><Table.Head class="p-3">
                    服務／人員
                  </Table.Head><Table.Head class="p-3">
                    狀態
                  </Table.Head><Table.Head class="p-3 text-right">
                    操作
                  </Table.Head>
                </Table.Row>
              </Table.Header><Table.Body class="divide-y">
                {#each filtered as a (a.id)}<Table.Row
                    class="hover:bg-muted/30"
                  >
                    <Table.Cell class="p-3 tabular-nums">
                      <p>{a.appointment_date}</p>
                      <p class="font-medium">
                        {a.appointment_time.slice(0, 5)}–{appointmentEnd(
                          a,
                          facility.slot_duration,
                        )}
                      </p>
                    </Table.Cell><Table.Cell class="p-3">
                      <div class="flex items-center gap-3">
                        <Avatar.Root class="size-10 rounded-2xl">
                          <Avatar.Fallback
                            class="rounded-2xl bg-primary/7 text-sm font-medium text-primary"
                          >
                            {a.patient_name.slice(0, 1)}
                          </Avatar.Fallback>
                        </Avatar.Root>
                        <div>
                          <button
                            class="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                            onclick={() => select(a)}
                          >
                            {a.patient_name}
                          </button>
                          <p class="mt-1 text-xs text-muted-foreground">
                            {a.patient_phone}
                          </p>
                        </div>
                      </div>
                    </Table.Cell><Table.Cell class="p-3">
                      <p>
                        {a.service_name ?? "一般預約"} · {a.duration_minutes ??
                          facility.slot_duration} 分鐘
                      </p>
                      <p class="mt-1 text-xs text-muted-foreground">
                        {a.staff_name ?? "未指定人員"}
                      </p>
                    </Table.Cell><Table.Cell class="p-3">
                      <StatusPill status={a.status} />
                    </Table.Cell><Table.Cell class="p-3">
                      <div class="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onclick={() => select(a)}
                          aria-label={"查看" + a.patient_name + "的預約"}
                        >
                          詳情／改期
                        </Button>{#if a.status === "confirmed" && a.appointment_date === taipeiToday() && canAccessFeature(facility, "queue_management")}<Button
                            size="sm"
                            disabled={!!pending}
                            onclick={() => checkIn(a)}
                            aria-label={"為" + a.patient_name + "報到"}
                          >
                            報到
                          </Button>{/if}
                      </div>
                    </Table.Cell>
                  </Table.Row>{/each}
              </Table.Body>
            </Table.Root>
          </div>
          <div class="space-y-2 md:hidden">
            {#each filtered as a (a.id)}<Card.Root
                role="article"
                class="gap-0 shadow-sm space-y-2 p-4"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="font-semibold tabular-nums">
                    {a.appointment_time.slice(0, 5)}–{appointmentEnd(
                      a,
                      facility.slot_duration,
                    )}
                  </p>
                  <StatusPill status={a.status} />
                </div>
                <button
                  class="text-left font-semibold text-primary underline-offset-4 hover:underline"
                  onclick={() => select(a)}
                >
                  {a.patient_name}
                </button>
                <p class="text-sm">
                  {a.service_name ?? "一般預約"} · {a.duration_minutes ??
                    facility.slot_duration} 分鐘
                </p>
                <p class="text-xs text-muted-foreground">
                  {a.appointment_date} · {a.staff_name ?? "未指定"}
                </p>
                <div
                  class="flex flex-wrap items-center justify-between gap-2 border-t pt-2"
                >
                  <a
                    href={"tel:" + a.patient_phone}
                    class="text-sm text-primary"
                  >
                    {a.patient_phone}
                  </a>
                  <div class="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onclick={() => select(a)}
                    >
                      詳情／改期
                    </Button>{#if a.status === "confirmed" && a.appointment_date === taipeiToday() && canAccessFeature(facility, "queue_management")}<Button
                        size="sm"
                        disabled={!!pending}
                        onclick={() => checkIn(a)}
                        aria-label={"為" + a.patient_name + "報到"}
                      >
                        報到
                      </Button>{/if}
                  </div>
                </div>
              </Card.Root>{/each}
          </div>
        {/if}
      </div>
    {/if}
  </Tabs.Content>
</Tabs.Root>
<BookingDialog
  bind:open={
    () => createOpen,
    (v) => {
      void params({ new: v ? "1" : null });
    }
  }
  facilityId={facility.id}
  onCreated={() => {
    message = "預約已建立";
    revision++;
  }}
/>
<AppointmentDialog
  appointment={selected}
  {facility}
  onClose={() => params({ appointment: null })}
  onUpdated={updatedAppointment}
/>

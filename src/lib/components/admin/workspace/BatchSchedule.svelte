<script lang="ts">
  import DateInput from "#lib/components/ui/date-input/DateInput.svelte";
  import * as Field from "#lib/components/ui/field/index.ts";
  import * as NativeSelect from "#lib/components/ui/native-select/index.ts";
  import { Checkbox } from "#lib/components/ui/checkbox/index.ts";
  const formId = $props.id();

  import * as Dialog from "#lib/components/ui/dialog/index.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import { adminClinicsApi } from "#lib/api/admin/clinics.ts";
  import { addDateDays, apiMessage } from "#lib/admin/scheduling.ts";
  import { taipeiToday } from "#lib/constants/appointment.ts";
  import type {
    ApiStaff,
    ApiScheduleBatchItem,
    ApiScheduleBatchResult,
  } from "#lib/types/clinic.ts";
  import type { ScheduleSession } from "#lib/types/schedule.ts";
  let {
    open = $bindable(false),
    facilityId,
    staff,
    onSaved,
  }: {
    open?: boolean;
    facilityId: string;
    staff: ApiStaff[];
    onSaved: () => void;
  } = $props();
  let mode = $state("pattern"),
    start = $state(taipeiToday()),
    end = $state(addDateDays(taipeiToday(), 27)),
    source = $state(addDateDays(taipeiToday(), -7));
  let people = $state<string[]>([]),
    weekdays = $state<number[]>([1, 2, 3, 4, 5]),
    session = $state<ScheduleSession>("morning"),
    from = $state("09:00"),
    to = $state("12:00"),
    skipLeaves = $state(true),
    busy = $state(false),
    error = $state("");
  let items = $state<ApiScheduleBatchItem[]>([]),
    result = $state<ApiScheduleBatchResult | null>(null);
  const signature = $derived(
    JSON.stringify({
      mode,
      start,
      end,
      source,
      people,
      weekdays,
      session,
      from,
      to,
    }),
  );
  let previewSignature = $state("");
  const previewCurrent = $derived(
    signature === previewSignature && items.length > 0,
  );
  async function preview() {
    busy = true;
    error = "";
    result = null;
    items = [];
    const snapshot = signature;
    try {
      if (!people.length) throw new Error("請至少選擇一位人員");
      if (
        !start ||
        !end ||
        start > end ||
        Date.parse(end) - Date.parse(start) > 90 * 86400000
      )
        throw new Error("請選擇 90 天內的有效日期範圍");
      let next: ApiScheduleBatchItem[] = [];
      if (mode === "copy") {
        const sourceRows = await adminClinicsApi.schedules.listAll(facilityId, {
          start_date: source,
          end_date: addDateDays(source, 6),
        });
        for (let day = start; day <= end; day = addDateDays(day, 1))
          for (const row of sourceRows.filter(
            (s) => people.includes(s.staff_id) && s.is_available,
          )) {
            const offset = (Date.parse(day) - Date.parse(start)) / 86400000;
            if (
              (Date.parse(row.date) - Date.parse(source)) / 86400000 ===
              offset % 7
            )
              next.push({
                staff_id: row.staff_id,
                date: day,
                start_time: row.start_time,
                end_time: row.end_time,
                session_type: row.session_type,
                max_appointments: row.max_appointments,
              });
          }
      } else {
        if (!weekdays.length || !from || !to || from >= to)
          throw new Error("請選擇星期及有效的起訖時間");
        for (let day = start; day <= end; day = addDateDays(day, 1))
          if (weekdays.includes(new Date(day + "T12:00:00Z").getUTCDay()))
            for (const staff_id of people)
              next.push({
                staff_id,
                date: day,
                start_time: from,
                end_time: to,
                session_type: session,
                max_appointments: 20,
              });
      }
      if (!next.length) throw new Error("沒有可建立的排班，請確認來源與條件");
      if (next.length > 2000)
        throw new Error("單次最多建立 2000 筆排班，請縮小範圍");
      items = next;
      previewSignature = snapshot;
    } catch (e) {
      error =
        e instanceof Error && !("data" in e)
          ? e.message
          : apiMessage(e, "無法建立預覽");
    } finally {
      busy = false;
    }
  }
  async function save() {
    if (!previewCurrent || busy) return;
    busy = true;
    error = "";
    try {
      result = await adminClinicsApi.schedules.batchCreate(facilityId, {
        items,
        skip_leaves: skipLeaves,
      });
      items = [];
      onSaved();
    } catch (e) {
      error = apiMessage(e, "批次排班失敗，請重試");
    } finally {
      busy = false;
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="admin-dialog block overflow-hidden p-0 sm:max-w-2xl"
    onInteractOutside={(e) => {
      if (busy) e.preventDefault();
    }}
    onEscapeKeydown={(e) => {
      if (busy) e.preventDefault();
    }}
    showCloseButton={!busy}
  >
    <div class="flex max-h-[calc(100dvh-2rem)] flex-col">
      <Dialog.Header class="shrink-0 p-6 pr-12">
        <Dialog.Title>智慧排班</Dialog.Title><Dialog.Description>
          以週期樣板或既有七日班表建立安排；先預覽，再確認送出。
        </Dialog.Description>
      </Dialog.Header>
      <div class="min-h-0 space-y-4 overflow-y-auto px-6 pb-6">
        {#if error}<p
            role="alert"
            class="rounded-xl bg-destructive/10 p-3 text-destructive"
          >
            {error}
          </p>{/if}
        <Field.Set class="gap-5" disabled={busy}>
          <div class="space-y-1">
            <Field.Label for="batch-mode" class="text-sm font-medium">
              排班方式
            </Field.Label><NativeSelect.Root
              id="batch-mode"
              class="w-full"
              bind:value={mode}
            >
              <NativeSelect.Option value="pattern">
                週期樣板
              </NativeSelect.Option><NativeSelect.Option value="copy">
                複製七日班表
              </NativeSelect.Option>
            </NativeSelect.Root>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-1">
              <Field.Label for="batch-start" class="text-sm font-medium">
                目標開始日期
              </Field.Label><DateInput
                id="batch-start"
                bind:value={start}
              />
            </div>
            <div class="space-y-1">
              <Field.Label for="batch-end" class="text-sm font-medium">
                目標結束日期
              </Field.Label><DateInput
                id="batch-end"
                bind:value={end}
                min={start}
              />
            </div>
          </div>
          <Field.Set>
            <Field.Legend class="mb-2 text-sm font-medium">
              服務人員
            </Field.Legend>
            <div class="flex flex-wrap gap-3">
              {#each staff as s (s.id)}<Field.Field
                  orientation="horizontal"
                  class="items-center gap-2.5"
                >
                  <Checkbox
                    id={[formId, "field-1", String(s.id)].join("-")}
                    checked={people.includes(s.id)}
                    onCheckedChange={(checked) =>
                      (people = checked
                        ? [...people, s.id]
                        : people.filter((item) => item !== s.id))}
                  /><Field.Label
                    for={[formId, "field-1", String(s.id)].join("-")}
                    class="cursor-pointer text-sm font-normal"
                  >
                    {s.name}
                  </Field.Label>
                </Field.Field>{/each}
            </div>
          </Field.Set>
          {#if mode === "copy"}<div class="space-y-1">
              <Field.Label for="batch-source" class="text-sm font-medium">
                來源七日班表的開始日期
              </Field.Label><DateInput
                id="batch-source"
                bind:value={source}
              />
              <p class="text-xs text-muted-foreground">
                將來源七日的相對日次，重複套用至目標日期範圍。
              </p>
            </div>
          {:else}<Field.Set>
              <Field.Legend class="mb-2 text-sm font-medium">
                每週日期
              </Field.Legend>
              <div class="flex flex-wrap gap-3">
                {#each ["日", "一", "二", "三", "四", "五", "六"] as day, i (day)}<Field.Field
                    orientation="horizontal"
                    class="items-center gap-2.5"
                  >
                    <Checkbox
                      id={[formId, "field-2", String(day)].join("-")}
                      checked={weekdays.includes(i)}
                      onCheckedChange={(checked) =>
                        (weekdays = checked
                          ? [...weekdays, i]
                          : weekdays.filter((item) => item !== i))}
                    /><Field.Label
                      for={[formId, "field-2", String(day)].join("-")}
                      class="cursor-pointer text-sm font-normal"
                    >
                      週{day}
                    </Field.Label>
                  </Field.Field>{/each}
              </div>
            </Field.Set>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <Field.Label for="batch-session" class="text-sm font-medium">
                  班次
                </Field.Label><NativeSelect.Root
                  id="batch-session"
                  class="w-full"
                  bind:value={session}
                >
                  <NativeSelect.Option value="morning">
                    早班
                  </NativeSelect.Option><NativeSelect.Option value="afternoon">
                    午班
                  </NativeSelect.Option><NativeSelect.Option value="evening">
                    晚班
                  </NativeSelect.Option>
                </NativeSelect.Root>
              </div>
              <div>
                <Field.Label for="batch-from" class="text-sm font-medium">
                  開始時間
                </Field.Label><Input
                  id="batch-from"
                  type="time"
                  bind:value={from}
                />
              </div>
              <div>
                <Field.Label for="batch-to" class="text-sm font-medium">
                  結束時間
                </Field.Label><Input
                  id="batch-to"
                  type="time"
                  bind:value={to}
                />
              </div>
            </div>{/if}
          <Field.Field orientation="horizontal" class="items-center gap-2.5">
            <Checkbox
              bind:checked={skipLeaves}
              id={[formId, "field-3"].join("-")}
            /><Field.Label
              for={[formId, "field-3"].join("-")}
              class="cursor-pointer text-sm font-normal"
            >
              略過人員休假日
            </Field.Label>
          </Field.Field><Button variant="outline" onclick={preview}>
            產生排班預覽
          </Button>
        </Field.Set>
        {#if previewCurrent}<section class="rounded-xl border p-3">
            <h3 class="font-medium">預計建立 {items.length} 筆排班</h3>
            <p class="mt-1 text-xs text-muted-foreground">
              重複班次及休假由系統在送出時再次判定。
            </p>
            <ul class="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
              {#each items.slice(0, 50) as row, i (i)}<li>
                  {row.date} · {staff.find((s) => s.id === row.staff_id)?.name} ·
                  {row.start_time.slice(0, 5)}–{row.end_time.slice(0, 5)}
                </li>{/each}
            </ul>
            {#if items.length > 50}<p class="text-xs text-muted-foreground">
                顯示前 50 筆
              </p>{/if}
          </section>{:else if items.length}<p class="text-sm">
            條件已改變，請重新產生預覽。
          </p>{/if}
        {#if result}<div
            role="status"
            class="space-y-1 rounded-xl bg-primary/10 p-4"
          >
            <p class="font-semibold">已建立 {result.created_count} 筆排班</p>
            <p>
              略過重複 {result.skipped_existing} 筆、休假 {result.skipped_leave}
              筆、無效時間 {result.skipped_invalid} 筆。
            </p>
          </div>{/if}
      </div>
      <div class="flex shrink-0 justify-end gap-2 border-t bg-popover p-4">
        <Button
          variant="outline"
          disabled={busy}
          onclick={() => (open = false)}
        >
          關閉
        </Button><Button disabled={busy || !previewCurrent} onclick={save}>
          {busy ? "處理中…" : "確認建立排班"}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>

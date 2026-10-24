<script lang="ts">
  import DateInput from "#lib/components/ui/date-input/DateInput.svelte";
  import { revealError } from "#lib/admin/reveal-error.ts";
  import AdminSkeleton from "../layout/AdminSkeleton.svelte";
  import * as Field from "#lib/components/ui/field/index.ts";
  import * as NativeSelect from "#lib/components/ui/native-select/index.ts";

  import { untrack } from "svelte";
  import * as Dialog from "#lib/components/ui/dialog/index.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { adminClinicsApi } from "#lib/api/admin/clinics.ts";
  import { appointmentEnd, apiMessage } from "#lib/admin/scheduling.ts";
  import {
    matchingStaff,
    loadBookingCatalog,
    type BookingCatalog,
  } from "#lib/admin/workspace.ts";
  import { canAccessFeature } from "#lib/feature-access.ts";
  import { taipeiToday } from "#lib/constants/appointment.ts";
  import type {
    ApiAppointment,
    AppointmentStatus,
    MedicalFacility,
  } from "#lib/types/clinic.ts";
  import StatusPill from "./StatusPill.svelte";
  import SlotPicker from "./SlotPicker.svelte";
  let {
    appointment,
    facility,
    onClose,
    onUpdated,
  }: {
    appointment: ApiAppointment | null;
    facility: MedicalFacility;
    onClose: () => void;
    onUpdated: (message: string) => void;
  } = $props();
  let stage = $state<"detail" | "reschedule" | "confirm">("detail"),
    action = $state<AppointmentStatus>("cancelled"),
    busy = $state(false),
    error = $state("");
  let date = $state(""),
    time = $state(""),
    staffId = $state(""),
    catalog = $state<BookingCatalog | null>(null),
    loading = $state(false),
    revision = $state(0);
  const actionLabels: Partial<Record<AppointmentStatus, string>> = {
    cancelled: "取消預約",
    no_show: "標記未到診",
    completed: "完成服務",
  };
  const people = $derived(
    catalog ? matchingStaff(catalog, appointment?.service_id ?? "") : [],
  );
  $effect(() => {
    const id = appointment?.id;
    void id;
    untrack(() => {
      stage = "detail";
      error = "";
      catalog = null;
      date = appointment?.appointment_date ?? "";
      staffId = appointment?.staff_id ?? "";
      time = "";
    });
  });
  async function startEdit() {
    stage = "reschedule";
    loading = true;
    error = "";
    try {
      catalog = await loadBookingCatalog(facility.id);
    } catch (e) {
      error = apiMessage(e, "無法載入排程資訊，請重試");
    } finally {
      loading = false;
    }
  }
  function confirm(status: AppointmentStatus) {
    action = status;
    stage = "confirm";
    error = "";
  }
  async function perform(checkIn = false) {
    if (!appointment || busy) return;
    busy = true;
    error = "";
    try {
      if (checkIn)
        await adminClinicsApi.queue.checkIn(facility.id, appointment.id);
      else if (stage === "reschedule")
        await adminClinicsApi.appointments.update(facility.id, appointment.id, {
          appointment_date: date,
          appointment_time: time,
          staff_id: staffId,
        });
      else
        await adminClinicsApi.appointments.update(facility.id, appointment.id, {
          status: action,
        });
      onUpdated(
        checkIn
          ? "客戶已報到"
          : stage === "reschedule"
            ? "預約已改期"
            : `${actionLabels[action]}成功`,
      );
      onClose();
    } catch (e) {
      error = apiMessage(e, "操作失敗，資料尚未更新，請重試");
      if (stage === "reschedule") revision++;
    } finally {
      busy = false;
    }
  }
</script>

<Dialog.Root
  open={!!appointment}
  onOpenChange={(value) => {
    if (!value && !busy) onClose();
  }}
>
  <Dialog.Content
    showCloseButton={!busy}
    class="admin-dialog block overflow-hidden p-0 sm:max-w-xl"
    onInteractOutside={(e) => {
      if (busy) e.preventDefault();
    }}
    onEscapeKeydown={(e) => {
      if (busy) e.preventDefault();
    }}
  >
    {#if appointment}
      <div class="flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col">
        <Dialog.Header class="shrink-0 p-6 pr-12">
          <Dialog.Title>
            {stage === "reschedule"
              ? "預約改期"
              : stage === "confirm"
                ? `確認${actionLabels[action]}`
                : "預約詳情"}
          </Dialog.Title><Dialog.Description>
            {appointment.patient_name} · {appointment.appointment_date}
            {appointment.appointment_time.slice(0, 5)}
          </Dialog.Description>
        </Dialog.Header>
        <div class="min-h-0 space-y-4 overflow-y-auto px-6 pb-6">
          {#if error}<p
              role="alert"
              tabindex="-1"
              use:revealError={error}
              class="rounded-xl bg-destructive/10 p-3 text-destructive"
            >
              {error}
            </p>{/if}
          {#if stage === "detail"}
            <StatusPill status={appointment.status} />
            <dl class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt class="text-muted-foreground">客戶姓名</dt>
                <dd class="mt-1 font-medium">{appointment.patient_name}</dd>
              </div>
              <div>
                <dt class="text-muted-foreground">聯絡電話</dt>
                <dd class="mt-1">
                  {#if appointment.patient_phone}<a
                      class="text-primary underline"
                      href={"tel:" + appointment.patient_phone}
                    >
                      {appointment.patient_phone}
                    </a>{:else}未填{/if}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">日期與時間</dt>
                <dd class="mt-1">
                  {appointment.appointment_date}
                  <br />
                  {appointment.appointment_time.slice(0, 5)}–{appointmentEnd(
                    appointment,
                    facility.slot_duration,
                  )}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">服務與時長</dt>
                <dd class="mt-1">
                  {appointment.service_name ?? "一般預約"}
                  <br />
                  {appointment.duration_minutes ?? facility.slot_duration} 分鐘
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">服務人員</dt>
                <dd class="mt-1">{appointment.staff_name ?? "未指定"}</dd>
              </div>
              <div>
                <dt class="text-muted-foreground">預約方式</dt>
                <dd class="mt-1">
                  {{ phone: "電話", walk_in: "現場", online: "線上" }[
                    appointment.booking_method
                  ]}
                </dd>
              </div>
              {#if appointment.notes}<div class="col-span-2">
                  <dt class="text-muted-foreground">備註</dt>
                  <dd class="mt-1 whitespace-pre-wrap">{appointment.notes}</dd>
                </div>{/if}
            </dl>
          {:else if stage === "confirm"}
            <p class="rounded-xl bg-muted p-4">
              即將對 <strong>{appointment.patient_name}</strong>
              的 {appointment.appointment_date}
              {appointment.appointment_time.slice(0, 5)} 預約執行「{actionLabels[
                action
              ]}」。請核對客戶與時段。
            </p>
            {#if action === "cancelled"}<p>
                取消後會釋出這段預約時間。若只要離開視窗，請按「返回詳情」。
              </p>{/if}
          {:else if loading}<AdminSkeleton
              label="正在載入排程資訊…"
              variant="form"
            />
          {:else if catalog}
            <div class="space-y-1.5">
              <Field.Label for="reschedule-staff" class="text-sm font-medium">
                服務人員
              </Field.Label><NativeSelect.Root
                id="reschedule-staff"
                class="w-full"
                bind:value={staffId}
                disabled={busy}
              >
                <NativeSelect.Option value="">
                  請選擇人員
                </NativeSelect.Option>{#each people as s (s.id)}<NativeSelect.Option
                    value={s.id}
                  >
                    {s.name}
                  </NativeSelect.Option>{/each}{#if appointment.staff_id && !people.some((s) => s.id === appointment?.staff_id)}<NativeSelect.Option
                    value={appointment.staff_id}
                    disabled
                  >
                    {appointment.staff_name}（請重新選擇可承接人員）
                  </NativeSelect.Option>{/if}
              </NativeSelect.Root>
            </div>
            <div class="space-y-1.5">
              <Field.Label for="reschedule-date" class="text-sm font-medium">
                預約日期
              </Field.Label><DateInput
                id="reschedule-date"
                bind:value={date}
                min={taipeiToday()}
                disabled={busy}
              />
            </div>
            {#key revision}<SlotPicker
                {facility}
                staffId={people.some((s) => s.id === staffId) ? staffId : ""}
                {date}
                duration={appointment.duration_minutes ??
                  facility.slot_duration}
                excludeId={appointment.id}
                bind:time
              />{/key}
            <p class="text-xs text-muted-foreground">
              保留原服務及預約時長；更換人員或日期後，叫號資訊會依新安排更新。
            </p>
          {:else}<Button variant="outline" onclick={startEdit}>
              重試排程資訊
            </Button>{/if}
        </div>
        <div
          class="flex shrink-0 flex-wrap justify-end gap-2 border-t bg-popover p-4"
          data-slot="dialog-footer"
        >
          {#if stage === "confirm"}<Button
              variant="outline"
              disabled={busy}
              onclick={() => {
                stage = "detail";
                error = "";
              }}
            >
              返回詳情
            </Button><Button
              variant={action === "completed" ? "default" : "destructive"}
              disabled={busy}
              onclick={() => perform()}
            >
              {busy ? "處理中…" : `確認${actionLabels[action]}`}
            </Button>
          {:else if stage === "reschedule"}<Button
              variant="outline"
              disabled={busy}
              onclick={() => {
                stage = "detail";
                error = "";
              }}
            >
              返回詳情
            </Button><Button
              disabled={busy || !time || !people.some((s) => s.id === staffId)}
              onclick={() => perform()}
            >
              {busy ? "儲存中…" : "確認改期"}
            </Button>
          {:else}
            <Button variant="outline" disabled={busy} onclick={onClose}>
              關閉
            </Button>
            {#if appointment.status === "confirmed"}<Button
                variant="outline"
                disabled={busy}
                onclick={startEdit}
              >
                改期
              </Button>{#if canAccessFeature(facility, "queue_management") && appointment.appointment_date === taipeiToday()}<Button
                  disabled={busy}
                  onclick={() => perform(true)}
                >
                  報到
                </Button>{/if}{/if}
            {#if ["confirmed", "checked_in"].includes(appointment.status)}<Button
                variant="destructive"
                disabled={busy}
                onclick={() => confirm("cancelled")}
              >
                取消預約
              </Button><Button
                variant="outline"
                disabled={busy}
                onclick={() => confirm("no_show")}
              >
                標記未到診
              </Button>{/if}
            {#if ["confirmed", "checked_in", "in_progress"].includes(appointment.status)}<Button
                disabled={busy}
                onclick={() => confirm("completed")}
              >
                完成服務
              </Button>{/if}
          {/if}
        </div>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<script lang="ts">
  import * as Dialog from "#lib/components/ui/dialog/index.ts";
  import * as Field from "#lib/components/ui/field/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import * as NativeSelect from "#lib/components/ui/native-select/index.ts";
  import { Textarea } from "#lib/components/ui/textarea/index.ts";
  import { Checkbox } from "#lib/components/ui/checkbox/index.ts";
  const formId = $props.id();

  import { untrack } from "svelte";
  import Modal from "./Modal.svelte";
  import GoogleMapsLocation from "./GoogleMapsLocation.svelte";
  import Feedback from "./Feedback.svelte";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { adminClinicsApi } from "#lib/api/admin/clinics.ts";
  import {
    FALLBACK_TAXONOMY,
    serviceCategoriesApi,
    categoriesFor,
  } from "#lib/api/service-categories.ts";
  import { apiMessage } from "#lib/admin/scheduling.ts";
  import type {
    MedicalFacility,
    MedicalFacilityCreate,
    FacilityType,
    PaymentType,
  } from "#lib/types/clinic.ts";
  let {
    open = $bindable(false),
    clinic = null,
    onSaved,
  }: {
    open?: boolean;
    clinic?: MedicalFacility | null;
    onSaved: (f: MedicalFacility) => void;
  } = $props();
  const days = [
    ["monday", "週一"],
    ["tuesday", "週二"],
    ["wednesday", "週三"],
    ["thursday", "週四"],
    ["friday", "週五"],
    ["saturday", "週六"],
    ["sunday", "週日"],
  ];
  let name = $state(""),
    phone = $state(""),
    address = $state(""),
    description = $state(""),
    latitude = $state<number | undefined>(),
    longitude = $state<number | undefined>(),
    mapPending = $state(false),
    mapValid = $state(true),
    type = $state<FacilityType>("healthcare"),
    payment = $state<PaymentType>("nhi"),
    categories = $state<string[]>([]),
    hoursEnabled = $state(true),
    active = $state(true),
    phoneBooking = $state(false),
    showSchedule = $state(true),
    duration = $state(30),
    hours = $state<
      {
        day: string;
        label: string;
        enabled: boolean;
        open: string;
        close: string;
        breaks: { start: string; end: string }[];
      }[]
    >([]),
    logo = $state<string | null>(null),
    busy = $state(false),
    error = $state(""),
    message = $state(""),
    tax = $state(FALLBACK_TAXONOMY);
  const clinicKey = $derived(clinic?.id ?? "new");
  $effect(() => {
    if (!open) return;
    const key = clinicKey;
    untrack(() => {
      void key;
      const c = clinic;
      name = c?.name ?? "";
      phone = c?.phone ?? "";
      address = c?.address ?? "";
      description = c?.description ?? "";
      latitude = c?.latitude ?? undefined;
      longitude = c?.longitude ?? undefined;
      mapPending = false;
      mapValid = true;
      type = c?.facility_type ?? "healthcare";
      payment = c?.payment_type ?? "nhi";
      categories = [...(c?.service_categories ?? [])];
      active = c?.is_active ?? true;
      phoneBooking = c?.phone_booking_enabled ?? false;
      showSchedule = c?.show_schedule ?? true;
      duration = c?.slot_duration ?? 30;
      hoursEnabled = c
        ? !!c.business_hours && Object.keys(c.business_hours).length > 0
        : true;
      logo = c?.logo_url ?? null;
      error = "";
      message = "";
      hours = days.map(([day, label], i) => {
        const h = c?.business_hours?.[day];
        return {
          day,
          label,
          enabled: c?.business_hours != null ? !!h : i < 6,
          open: h?.open ?? "09:00",
          close: h?.close ?? (i === 5 ? "12:00" : "18:00"),
          breaks: h?.breaks?.map((b) => ({ ...b })) ?? [],
        };
      });
      void serviceCategoriesApi.get().then((v) => (tax = v));
    });
  });
  function changeType() {
    categories = [];
    payment =
      type === "healthcare" ? (clinic?.payment_type ?? "nhi") : "self_pay";
  }
  async function upload(e: Event) {
    const input = e.currentTarget as HTMLInputElement,
      file = input.files?.[0];
    if (!file || !clinic) return;
    busy = true;
    error = "";
    try {
      const updated = await adminClinicsApi.uploadLogo(clinic.id, file);
      logo = updated.logo_url;
      onSaved(updated);
      message = "Logo 已更新";
    } catch (e) {
      error = apiMessage(e, "Logo 上傳失敗");
    } finally {
      busy = false;
      input.value = "";
    }
  }
  async function removeLogo() {
    if (!clinic) return;
    busy = true;
    error = "";
    try {
      const updated = await adminClinicsApi.deleteLogo(clinic.id);
      logo = null;
      onSaved(updated);
      message = "Logo 已移除";
    } catch (e) {
      error = apiMessage(e, "無法移除 Logo");
    } finally {
      busy = false;
    }
  }
  async function save(e: SubmitEvent) {
    e.preventDefault();
    error = "";
    if (!mapValid || mapPending) {
      error = "請先完成地圖連結解析，或清空連結後再儲存。";
      return;
    }
    if (hoursEnabled && !hours.some((h) => h.enabled)) {
      error = "請至少選擇一個營業日；如暫停接待，請停用院所。";
      return;
    }
    for (const h of hours.filter((h) => hoursEnabled && h.enabled)) {
      if (
        h.open >= h.close ||
        h.breaks.some(
          (b) =>
            !b.start ||
            !b.end ||
            b.start >= b.end ||
            b.start < h.open ||
            b.end > h.close,
        )
      ) {
        error = h.label + "的營業或休息時間不正確";
        return;
      }
      const sorted = [...h.breaks].sort((a, b) =>
        a.start.localeCompare(b.start),
      );
      if (sorted.some((b, i) => i > 0 && b.start < sorted[i - 1].end)) {
        error = h.label + "的休息時間重疊";
        return;
      }
    }
    const data: MedicalFacilityCreate = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      description: description.trim(),
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      facility_type: type,
      payment_type: payment,
      service_categories: categories,
      business_hours: Object.fromEntries(
        hours
          .filter((h) => hoursEnabled && h.enabled)
          .map((h) => [
            h.day,
            {
              open: h.open,
              close: h.close,
              ...(h.breaks.length ? { breaks: h.breaks } : {}),
            },
          ]),
      ),
      slot_duration: duration,
      phone_booking_enabled: phoneBooking,
      show_schedule: showSchedule,
    };
    busy = true;
    try {
      const updated = clinic
        ? await adminClinicsApi.update(clinic.id, {
            ...data,
            is_active: active,
          })
        : await adminClinicsApi.create(data);
      onSaved(updated);
      open = false;
    } catch (e) {
      error = apiMessage(e, "院所儲存失敗，請保留表單並重試");
    } finally {
      busy = false;
    }
  }
</script>

<Modal
  bind:open
  title={clinic ? "編輯院所" : "新增院所"}
  description="設定公開資訊、服務類型與可預約營業時間。"
  {busy}
>
  <form onsubmit={save} class="space-y-6">
    <Feedback {error} {message} /><Field.Set disabled={busy} class="gap-5">
      <Field.Legend>基本資訊</Field.Legend>{#if clinic}<div
          class="flex flex-wrap items-center gap-3"
        >
          {#if logo}<img
              src={logo}
              alt="院所 Logo"
              class="size-20 rounded-xl border object-contain"
            />{/if}<Field.Field class="gap-2">
            <Field.Label
              for={[formId, "field-1"].join("-")}
              class="text-sm font-medium"
            >
              上傳 Logo
            </Field.Label><Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onchange={upload}
              id={[formId, "field-1"].join("-")}
            />
          </Field.Field>{#if logo}<Button
              variant="outline"
              onclick={removeLogo}
            >
              移除 Logo
            </Button>{/if}
        </div>{:else}<p class="text-sm text-muted-foreground">
          儲存院所後即可上傳 Logo。
        </p>{/if}<Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-2"].join("-")}
          class="text-sm font-medium"
        >
          院所名稱
        </Field.Label><Input
          bind:value={name}
          required
          maxlength={100}
          id={[formId, "field-2"].join("-")}
        />
      </Field.Field>
      <div class="grid gap-4 sm:grid-cols-2">
        <Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-3"].join("-")}
            class="text-sm font-medium"
          >
            電話
          </Field.Label><Input
            type="tel"
            bind:value={phone}
            id={[formId, "field-3"].join("-")}
          />
        </Field.Field><Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-4"].join("-")}
            class="text-sm font-medium"
          >
            服務類型
          </Field.Label><NativeSelect.Root
            aria-label="服務類型"
            bind:value={type}
            onchange={changeType}
            id={[formId, "field-4"].join("-")}
            class="w-full"
          >
            {#each tax.facility_types as t (t.value)}<NativeSelect.Option
                value={t.value}
              >
                {t.label}
              </NativeSelect.Option>{/each}
          </NativeSelect.Root>
        </Field.Field>
      </div>
      <Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-5"].join("-")}
          class="text-sm font-medium"
        >
          地址
        </Field.Label><Input
          bind:value={address}
          id={[formId, "field-5"].join("-")}
        />
      </Field.Field>
      <GoogleMapsLocation
        bind:latitude
        bind:longitude
        bind:pending={mapPending}
        bind:valid={mapValid}
      />
      <Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-6"].join("-")}
          class="text-sm font-medium"
        >
          院所介紹
        </Field.Label><Textarea
          bind:value={description}
          maxlength={2000}
          id={[formId, "field-6"].join("-")}
        ></Textarea>
      </Field.Field>
      <Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-9"].join("-")}
          class="text-sm font-medium"
        >
          付款方式
        </Field.Label><NativeSelect.Root
          aria-label="付款方式"
          bind:value={payment}
          id={[formId, "field-9"].join("-")}
          class="w-full"
        >
          {#each tax.payment_types as p (p.value)}<NativeSelect.Option
              value={p.value}
              disabled={type !== "healthcare" && p.value !== "self_pay"}
            >
              {p.label}
            </NativeSelect.Option>{/each}
        </NativeSelect.Root>
      </Field.Field><Field.Set>
        <Field.Legend>服務分類</Field.Legend>
        <div class="flex flex-wrap gap-4">
          {#each categoriesFor(tax, type) as c (c.code)}<Field.Field
              orientation="horizontal"
              class="items-center gap-2.5"
            >
              <Checkbox
                id={[formId, "field-10", String(c.code)].join("-")}
                checked={categories.includes(c.code)}
                onCheckedChange={(checked) =>
                  (categories = checked
                    ? [...categories, c.code]
                    : categories.filter((item) => item !== c.code))}
              /><Field.Label
                for={[formId, "field-10", String(c.code)].join("-")}
                class="cursor-pointer text-sm font-normal"
              >
                {c.label}
              </Field.Label>
            </Field.Field>{/each}
        </div>
      </Field.Set>
      <div class="flex flex-wrap gap-4">
        {#if clinic}<Field.Field
            orientation="horizontal"
            class="items-center gap-2.5"
          >
            <Checkbox
              bind:checked={active}
              id={[formId, "field-11"].join("-")}
            /><Field.Label
              for={[formId, "field-11"].join("-")}
              class="cursor-pointer text-sm font-normal"
            >
              院所啟用
            </Field.Label>
          </Field.Field>{/if}<Field.Field
          orientation="horizontal"
          class="items-center gap-2.5"
        >
          <Checkbox
            bind:checked={phoneBooking}
            id={[formId, "field-12"].join("-")}
          /><Field.Label
            for={[formId, "field-12"].join("-")}
            class="cursor-pointer text-sm font-normal"
          >
            開放電話預約入口
          </Field.Label>
        </Field.Field>{#if clinic}<Field.Field
            orientation="horizontal"
            class="items-center gap-2.5"
          >
            <Checkbox
              bind:checked={showSchedule}
              id={[formId, "field-13"].join("-")}
            /><Field.Label
              for={[formId, "field-13"].join("-")}
              class="cursor-pointer text-sm font-normal"
            >
              顯示門診時刻表
            </Field.Label>
          </Field.Field>{/if}
      </div>
    </Field.Set><Field.Set disabled={busy} class="gap-5">
      <Field.Legend>營業時間與預約</Field.Legend><Field.Field
        orientation="horizontal"
        class="items-center gap-2.5"
      >
        <Checkbox
          bind:checked={hoursEnabled}
          id={[formId, "field-14"].join("-")}
        /><Field.Label
          for={[formId, "field-14"].join("-")}
          class="cursor-pointer text-sm font-normal"
        >
          設定固定營業時間
        </Field.Label>
      </Field.Field>
      <p class="text-xs text-muted-foreground">
        未設定固定時間時，依人員班表提供預約；暫停營業請停用院所。
      </p>
      <Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-15"].join("-")}
          class="text-sm font-medium"
        >
          預約間隔
        </Field.Label><NativeSelect.Root
          aria-label="預約間隔"
          bind:value={duration}
          id={[formId, "field-15"].join("-")}
          class="w-full"
        >
          {#each [3, 5, 15, 30, 60] as m (m)}<NativeSelect.Option value={m}>
              {m} 分鐘
            </NativeSelect.Option>{/each}
        </NativeSelect.Root>
      </Field.Field>{#if hoursEnabled}{#each hours as h (h.day)}<div
            class="space-y-3 rounded-xl border p-3"
          >
            <Field.Field orientation="horizontal" class="items-center gap-2.5">
              <Checkbox
                bind:checked={h.enabled}
                id={[formId, "field-16", String(h.day)].join("-")}
              /><Field.Label
                for={[formId, "field-16", String(h.day)].join("-")}
                class="cursor-pointer text-sm font-normal"
              >
                {h.label}營業
              </Field.Label>
            </Field.Field>{#if h.enabled}<div class="grid grid-cols-2 gap-3">
                <Field.Field class="gap-2">
                  <Field.Label
                    for={[formId, "field-17", String(h.day)].join("-")}
                    class="text-sm font-medium"
                  >
                    {h.label}開始
                  </Field.Label><Input
                    type="time"
                    bind:value={h.open}
                    required
                    id={[formId, "field-17", String(h.day)].join("-")}
                  />
                </Field.Field><Field.Field class="gap-2">
                  <Field.Label
                    for={[formId, "field-18", String(h.day)].join("-")}
                    class="text-sm font-medium"
                  >
                    {h.label}結束
                  </Field.Label><Input
                    type="time"
                    bind:value={h.close}
                    required
                    id={[formId, "field-18", String(h.day)].join("-")}
                  />
                </Field.Field>
              </div>
              {#each h.breaks as b, i (i)}<div
                  class="grid grid-cols-[1fr_1fr_auto] items-end gap-2"
                >
                  <Field.Field class="gap-2">
                    <Field.Label
                      for={[formId, "field-19", String(h.day), String(i)].join(
                        "-",
                      )}
                      class="text-sm font-medium"
                    >
                      休息開始
                    </Field.Label><Input
                      type="time"
                      bind:value={b.start}
                      required
                      id={[formId, "field-19", String(h.day), String(i)].join(
                        "-",
                      )}
                    />
                  </Field.Field><Field.Field class="gap-2">
                    <Field.Label
                      for={[formId, "field-20", String(h.day), String(i)].join(
                        "-",
                      )}
                      class="text-sm font-medium"
                    >
                      休息結束
                    </Field.Label><Input
                      type="time"
                      bind:value={b.end}
                      required
                      id={[formId, "field-20", String(h.day), String(i)].join(
                        "-",
                      )}
                    />
                  </Field.Field><Button
                    variant="ghost"
                    onclick={() => h.breaks.splice(i, 1)}
                  >
                    移除
                  </Button>
                </div>{/each}{#if h.breaks.length < 2}<Button
                  size="sm"
                  variant="outline"
                  onclick={() =>
                    h.breaks.push({ start: "12:00", end: "13:00" })}
                >
                  新增{h.label}休息時段
                </Button>{/if}{/if}
          </div>{/each}{/if}
    </Field.Set>
    <Dialog.Footer class="admin-dialog-footer">
      <Button variant="outline" disabled={busy} onclick={() => (open = false)}>
        取消
      </Button><Button type="submit" disabled={busy || mapPending}>
        {busy ? "儲存中…" : mapPending ? "位置解析中…" : "儲存院所"}
      </Button>
    </Dialog.Footer>
  </form>
</Modal>

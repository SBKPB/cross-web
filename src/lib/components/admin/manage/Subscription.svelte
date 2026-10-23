<script lang="ts">
  import * as Dialog from "#lib/components/ui/dialog/index.ts";
  import * as Card from "#lib/components/ui/card/index.ts";
  import * as Field from "#lib/components/ui/field/index.ts";
  import * as NativeSelect from "#lib/components/ui/native-select/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import { Checkbox } from "#lib/components/ui/checkbox/index.ts";
  import { Textarea } from "#lib/components/ui/textarea/index.ts";
  const formId = $props.id();

  import Modal from "./Modal.svelte";
  import Feedback from "./Feedback.svelte";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { adminClinicsApi } from "#lib/api/admin/clinics.ts";
  import { getAuth } from "#lib/auth/auth.svelte.ts";
  import { isSystemAdmin } from "#lib/auth/roles.ts";
  import { apiMessage } from "#lib/admin/scheduling.ts";
  import {
    PLAN_LABELS,
    FEATURE_LABELS,
    accessibleFeatures,
    canStartTrial,
    isExpired,
    daysUntilExpiry,
  } from "#lib/feature-access.ts";
  import {
    taipeiDate,
    dateInstant,
    renewalDate,
    renewalPayload,
  } from "#lib/admin/subscription.ts";
  import type {
    MedicalFacility,
    SubscriptionPlan,
    SubscriptionStatus,
    BillingCycle,
  } from "#lib/types/clinic.ts";
  let {
    facility,
    onUpdated,
  }: { facility: MedicalFacility; onUpdated: (f: MedicalFacility) => void } =
    $props();
  const auth = getAuth(),
    system = $derived(isSystemAdmin(auth.user));
  const statuses: Record<SubscriptionStatus, string> = {
    trial: "試用中",
    active: "啟用",
    suspended: "已暫停",
    cancelled: "已取消",
  };
  let edit = $state(false),
    renew = $state(false),
    busy = $state(false),
    error = $state(""),
    message = $state(""),
    formError = $state(""),
    plan = $state<SubscriptionPlan>("free"),
    status = $state<SubscriptionStatus>("active"),
    cycle = $state<BillingCycle>("monthly"),
    started = $state(""),
    expiry = $state(""),
    notes = $state(""),
    featured = $state(false),
    featuredUntil = $state(""),
    months = $state(1),
    renewExpiry = $state(""),
    renewNote = $state(""),
    trialConfirm = $state(false);
  const expired = $derived(isExpired(facility.subscription_expires_at)),
    features = $derived(accessibleFeatures(facility)),
    days = $derived(daysUntilExpiry(facility.subscription_expires_at));
  function openEdit() {
    plan = facility.subscription_plan;
    status = facility.subscription_status;
    cycle = facility.billing_cycle ?? "monthly";
    started = taipeiDate(facility.subscription_started_at);
    expiry = taipeiDate(facility.subscription_expires_at);
    notes = facility.subscription_notes ?? "";
    featured = facility.is_featured;
    featuredUntil = taipeiDate(facility.featured_until);
    formError = "";
    edit = true;
  }
  function openRenew() {
    months = facility.billing_cycle === "annual" ? 12 : 1;
    renewExpiry = renewalDate(facility.subscription_expires_at, months);
    renewNote = "";
    formError = "";
    renew = true;
  }
  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!system) return;
    busy = true;
    formError = "";
    const changed = (day: string, old: string | null, end = false) =>
      day === taipeiDate(old) ? old : dateInstant(day, end);
    try {
      const updated = await adminClinicsApi.updateSubscription(facility.id, {
        subscription_plan: plan,
        subscription_status: status,
        billing_cycle: cycle,
        subscription_started_at: changed(
          started,
          facility.subscription_started_at,
        ),
        subscription_expires_at: changed(
          expiry,
          facility.subscription_expires_at,
          true,
        ),
        subscription_notes: notes.trim() || null,
        is_featured: featured,
        featured_until: changed(featuredUntil, facility.featured_until, true),
      });
      onUpdated(updated);
      edit = false;
      message = "訂閱設定已更新";
    } catch (e) {
      formError = apiMessage(e, "訂閱設定儲存失敗");
    } finally {
      busy = false;
    }
  }
  async function renewNow(e: SubmitEvent) {
    e.preventDefault();
    if (!system) return;
    formError = "";
    if (
      !renewExpiry ||
      new Date(dateInstant(renewExpiry, true)!).getTime() < Date.now()
    ) {
      formError = "續約到期日必須在今天以後";
      return;
    }
    busy = true;
    try {
      const updated = await adminClinicsApi.updateSubscription(
        facility.id,
        renewalPayload(facility, renewExpiry, months, renewNote),
      );
      onUpdated(updated);
      renew = false;
      message = "訂閱已續約";
    } catch (e) {
      formError = apiMessage(e, "續約失敗");
    } finally {
      busy = false;
    }
  }
  async function trial() {
    busy = true;
    error = "";
    try {
      onUpdated(await adminClinicsApi.startTrial(facility.id));
      await auth.refreshUser();
      trialConfirm = false;
      message = "90 天試用已啟用";
    } catch (e) {
      error = apiMessage(e, "試用啟用失敗");
    } finally {
      busy = false;
    }
  }
</script>

<Card.Root class="gap-0 shadow-sm space-y-4 p-5">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 class="font-semibold">訂閱與付款狀態</h2>
      <p class="mt-1 text-sm text-muted-foreground">{facility.name}</p>
    </div>
    {#if system}<div class="flex gap-2">
        <Button variant="outline" onclick={openEdit}>編輯訂閱</Button><Button
          onclick={openRenew}
        >
          續約訂閱
        </Button>
      </div>{/if}
  </div>
  <Feedback {error} {message} />{#if expired}<p
      class="text-sm text-destructive"
    >
      訂閱已到期，付費功能暫停使用。
    </p>{:else if days !== null && days <= 7}<p class="text-sm text-amber-700">
      訂閱剩餘 {days} 天，請及早安排續約。
    </p>{/if}
  <dl class="grid gap-3 sm:grid-cols-2">
    {#each [{ label: "登記方案", value: PLAN_LABELS[facility.subscription_plan] }, { label: "訂閱狀態", value: statuses[facility.subscription_status] }, { label: "計費週期", value: facility.billing_cycle === "annual" ? "年繳" : "月繳" }, { label: "起始日", value: taipeiDate(facility.subscription_started_at) || "未設定" }, { label: "到期日", value: taipeiDate(facility.subscription_expires_at) || "無到期日" }, { label: "精選置頂", value: facility.is_featured && !isExpired(facility.featured_until) && features.includes("advanced_queue") ? "精選中" + (facility.featured_until ? "・至 " + taipeiDate(facility.featured_until) : "") : "未開啟" }] as item (item.label)}<div
        class="rounded-xl bg-muted/40 p-3"
      >
        <dt class="text-xs text-muted-foreground">{item.label}</dt>
        <dd class="mt-1 text-sm font-medium">{item.value}</dd>
      </div>{/each}
  </dl>
  <div>
    <h3 class="text-sm font-medium">目前可用功能</h3>
    <p class="mt-2 text-sm text-muted-foreground">
      {features.map((f) => FEATURE_LABELS[f]).join("、") ||
        "院所基本資料、現場與電話代訂、客戶與人員管理"}
    </p>
  </div>
  {#if facility.subscription_notes}<div>
      <h3 class="text-sm font-medium">付款記錄／備註</h3>
      <p class="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
        {facility.subscription_notes}
      </p>
    </div>{/if}{#if !system}<div class="flex flex-wrap gap-3">
      {#if canStartTrial(facility)}<Button
          disabled={busy}
          onclick={() => {
            error = "";
            trialConfirm = true;
          }}
        >
          啟用 90 天試用
        </Button>{/if}<Button href="/pricing" variant="outline">
        查看方案與聯絡續約
      </Button>
    </div>{/if}
</Card.Root>
<Modal
  bind:open={edit}
  title="編輯訂閱"
  description="僅平台管理員可調整；到期日按台灣時間當日結束計算。"
  {busy}
>
  <form onsubmit={save} class="space-y-4">
    <Feedback error={formError} /><Field.Set
      disabled={busy}
      class="grid gap-4 sm:grid-cols-2"
    >
      <Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-1"].join("-")}
          class="text-sm font-medium"
        >
          方案
        </Field.Label><NativeSelect.Root
          aria-label="方案"
          bind:value={plan}
          id={[formId, "field-1"].join("-")}
          class="w-full"
        >
          {#each Object.entries(PLAN_LABELS) as [v, l] (v)}<NativeSelect.Option
              value={v}
            >
              {l}
            </NativeSelect.Option>{/each}
        </NativeSelect.Root>
      </Field.Field><Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-2"].join("-")}
          class="text-sm font-medium"
        >
          狀態
        </Field.Label><NativeSelect.Root
          aria-label="狀態"
          bind:value={status}
          id={[formId, "field-2"].join("-")}
          class="w-full"
        >
          {#each Object.entries(statuses) as [v, l] (v)}<NativeSelect.Option
              value={v}
            >
              {l}
            </NativeSelect.Option>{/each}
        </NativeSelect.Root>
      </Field.Field><Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-3"].join("-")}
          class="text-sm font-medium"
        >
          計費週期
        </Field.Label><NativeSelect.Root
          aria-label="計費週期"
          bind:value={cycle}
          id={[formId, "field-3"].join("-")}
          class="w-full"
        >
          <NativeSelect.Option value="monthly">
            月繳
          </NativeSelect.Option><NativeSelect.Option value="annual">
            年繳
          </NativeSelect.Option>
        </NativeSelect.Root>
      </Field.Field><Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-4"].join("-")}
          class="text-sm font-medium"
        >
          起始日
        </Field.Label><Input
          type="date"
          bind:value={started}
          id={[formId, "field-4"].join("-")}
        />
      </Field.Field><Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-5"].join("-")}
          class="text-sm font-medium"
        >
          到期日
        </Field.Label><Input
          type="date"
          bind:value={expiry}
          id={[formId, "field-5"].join("-")}
        />
      </Field.Field><Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-6"].join("-")}
          class="text-sm font-medium"
        >
          精選到期日
        </Field.Label><Input
          type="date"
          bind:value={featuredUntil}
          id={[formId, "field-6"].join("-")}
        />
      </Field.Field><Field.Field
        orientation="horizontal"
        class="items-center gap-2.5"
      >
        <Checkbox
          bind:checked={featured}
          id={[formId, "field-7"].join("-")}
        /><Field.Label
          for={[formId, "field-7"].join("-")}
          class="cursor-pointer text-sm font-normal"
        >
          啟用精選置頂（需專業方案資格）
        </Field.Label>
      </Field.Field>
    </Field.Set><Field.Field class="gap-2">
      <Field.Label
        for={[formId, "field-8"].join("-")}
        class="text-sm font-medium"
      >
        付款記錄／備註
      </Field.Label><Textarea
        bind:value={notes}
        disabled={busy}
        id={[formId, "field-8"].join("-")}
      ></Textarea>
    </Field.Field>
    <Dialog.Footer class="admin-dialog-footer">
      <Button variant="outline" disabled={busy} onclick={() => (edit = false)}>
        取消
      </Button><Button type="submit" disabled={busy}>儲存訂閱</Button>
    </Dialog.Footer>
  </form>
</Modal>
<Modal
  bind:open={renew}
  title="續約訂閱"
  description={facility.name + "・保留原方案，從尚未到期的日期接續。"}
  {busy}
>
  <form onsubmit={renewNow} class="space-y-4">
    <Feedback error={formError} /><Field.Set disabled={busy} class="gap-5">
      <Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-9"].join("-")}
          class="text-sm font-medium"
        >
          續約期間
        </Field.Label><NativeSelect.Root
          aria-label="續約期間"
          bind:value={months}
          onchange={() => {
            if (months)
              renewExpiry = renewalDate(
                facility.subscription_expires_at,
                months,
              );
          }}
          id={[formId, "field-9"].join("-")}
          class="w-full"
        >
          <NativeSelect.Option value={1}>
            1 個月
          </NativeSelect.Option><NativeSelect.Option value={3}>
            3 個月
          </NativeSelect.Option><NativeSelect.Option value={6}>
            6 個月
          </NativeSelect.Option><NativeSelect.Option value={12}>
            1 年
          </NativeSelect.Option><NativeSelect.Option value={0}>
            自訂
          </NativeSelect.Option>
        </NativeSelect.Root>
      </Field.Field><Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-10"].join("-")}
          class="text-sm font-medium"
        >
          續約後到期日
        </Field.Label><Input
          type="date"
          bind:value={renewExpiry}
          required
          id={[formId, "field-10"].join("-")}
        />
      </Field.Field><Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-11"].join("-")}
          class="text-sm font-medium"
        >
          本次付款備註
        </Field.Label><Textarea
          bind:value={renewNote}
          id={[formId, "field-11"].join("-")}
        ></Textarea>
      </Field.Field>
    </Field.Set>
    <p class="text-sm text-muted-foreground">
      確認後恢復啟用，保留既有付款記錄並新增本次續約紀錄。
    </p>
    <Dialog.Footer class="admin-dialog-footer">
      <Button variant="outline" disabled={busy} onclick={() => (renew = false)}>
        取消
      </Button><Button type="submit" disabled={busy}>確認續約</Button>
    </Dialog.Footer>
  </form>
</Modal>
<Modal
  bind:open={trialConfirm}
  title="啟用 90 天試用"
  description="每間院所僅能啟用一次，確認後立即開始計算試用期限。"
  {busy}
>
  <Feedback {error} />
  <Dialog.Footer class="admin-dialog-footer">
    <Button
      variant="outline"
      disabled={busy}
      onclick={() => (trialConfirm = false)}
    >
      取消
    </Button><Button disabled={busy} onclick={trial}>確認啟用試用</Button>
  </Dialog.Footer>
</Modal>

<script lang="ts">
  import AdminSkeleton from "../layout/AdminSkeleton.svelte";
  import * as Dialog from "#lib/components/ui/dialog/index.ts";
  import * as Field from "#lib/components/ui/field/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import { Textarea } from "#lib/components/ui/textarea/index.ts";
  import { Checkbox } from "#lib/components/ui/checkbox/index.ts";
  const formId = $props.id();

  import Modal from "./Modal.svelte";
  import Feedback from "./Feedback.svelte";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { adminClinicsApi } from "#lib/api/admin/clinics.ts";
  import { apiMessage } from "#lib/admin/scheduling.ts";
  import type { ApiService } from "#lib/types/clinic.ts";
  let { facilityId }: { facilityId: string } = $props();
  let rows = $state<ApiService[]>([]),
    loading = $state(true),
    error = $state(""),
    formError = $state(""),
    message = $state(""),
    revision = $state(0),
    editor = $state(false),
    selected = $state<ApiService | null>(null),
    remove = $state(false),
    busy = $state(false),
    name = $state(""),
    description = $state(""),
    price = $state<number | undefined>(0),
    duration = $state<number | undefined>(30),
    active = $state(true);
  $effect(() => {
    const id = facilityId,
      r = revision;
    void r;
    let live = true;
    loading = true;
    error = "";
    adminClinicsApi.services
      .list(id)
      .then((v) => {
        if (live) rows = v;
      })
      .catch((e) => {
        if (live) error = apiMessage(e, "無法載入服務");
      })
      .finally(() => {
        if (live) loading = false;
      });
    return () => {
      live = false;
    };
  });
  function edit(s: ApiService | null) {
    selected = s;
    name = s?.service_name ?? "";
    description = s?.description ?? "";
    price = s?.price ?? 0;
    duration = s?.duration_minutes ?? 30;
    active = s?.is_active ?? true;
    formError = "";
    editor = true;
  }
  async function save(e: SubmitEvent) {
    e.preventDefault();
    busy = true;
    formError = "";
    try {
      const data = {
        service_name: name.trim(),
        description: description.trim(),
        price: price ?? 0,
        duration_minutes: duration ?? 30,
      };
      if (selected)
        await adminClinicsApi.services.update(facilityId, selected.id, {
          ...data,
          is_active: active,
        });
      else await adminClinicsApi.services.create(facilityId, data);
      editor = false;
      revision++;
      message = "服務已儲存";
    } catch (e) {
      formError = apiMessage(e, "服務儲存失敗");
    } finally {
      busy = false;
    }
  }
  async function del() {
    if (!selected) return;
    busy = true;
    formError = "";
    try {
      await adminClinicsApi.services.delete(facilityId, selected.id);
      remove = false;
      revision++;
      message = "服務已刪除";
    } catch (e) {
      formError = apiMessage(e, "服務刪除失敗");
    } finally {
      busy = false;
    }
  }
</script>

<div class="space-y-4">
  <div class="flex justify-between gap-3">
    <h2 class="font-semibold">服務項目</h2>
    <Button onclick={() => edit(null)}>新增服務</Button>
  </div>
  <Feedback {error} {message} />{#if error}<Button
      variant="outline"
      onclick={() => revision++}
    >
      重試服務列表
    </Button>{/if}{#if loading}<AdminSkeleton
      label="載入服務中…"
      variant="list"
    />{:else if !error}<ul class="divide-y rounded-2xl border bg-card">
      {#each rows as s (s.id)}<li
          class="flex flex-wrap items-center justify-between gap-4 p-5"
        >
          <div>
            <h3 class="font-semibold">
              {s.service_name}{s.is_active ? "" : "（停用）"}
            </h3>
            <p class="mt-1 text-sm text-muted-foreground">
              {s.duration_minutes} 分鐘 · NT$ {Number(s.price).toLocaleString(
                "zh-TW",
              )}
            </p>
            <p class="mt-2 whitespace-pre-wrap text-sm">{s.description}</p>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" onclick={() => edit(s)}>
              編輯服務
            </Button><Button
              variant="ghost"
              onclick={() => {
                selected = s;
                formError = "";
                remove = true;
              }}
            >
              刪除
            </Button>
          </div>
        </li>{:else}<li class="p-8 text-center text-muted-foreground">
          尚無服務項目。
        </li>{/each}
    </ul>{/if}
</div>
<Modal bind:open={editor} title={selected ? "編輯服務" : "新增服務"} {busy}>
  <form onsubmit={save} class="space-y-4">
    <Feedback error={formError} /><Field.Set disabled={busy} class="gap-5">
      <Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-1"].join("-")}
          class="text-sm font-medium"
        >
          服務名稱
        </Field.Label><Input
          bind:value={name}
          required
          id={[formId, "field-1"].join("-")}
        />
      </Field.Field><Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-2"].join("-")}
          class="text-sm font-medium"
        >
          服務說明
        </Field.Label><Textarea
          bind:value={description}
          id={[formId, "field-2"].join("-")}
        ></Textarea>
      </Field.Field>
      <div class="grid grid-cols-2 gap-4">
        <Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-3"].join("-")}
            class="text-sm font-medium"
          >
            價格（元）
          </Field.Label><Input
            type="number"
            min="0"
            step="1"
            bind:value={price}
            required
            id={[formId, "field-3"].join("-")}
          />
        </Field.Field><Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-4"].join("-")}
            class="text-sm font-medium"
          >
            服務時長（分鐘）
          </Field.Label><Input
            type="number"
            min="1"
            max="1440"
            step="1"
            bind:value={duration}
            required
            id={[formId, "field-4"].join("-")}
          />
        </Field.Field>
      </div>
      {#if selected}<Field.Field
          orientation="horizontal"
          class="items-center gap-2.5"
        >
          <Checkbox
            bind:checked={active}
            id={[formId, "field-5"].join("-")}
          /><Field.Label
            for={[formId, "field-5"].join("-")}
            class="cursor-pointer text-sm font-normal"
          >
            啟用服務
          </Field.Label>
        </Field.Field>{/if}
    </Field.Set>
    <Dialog.Footer class="admin-dialog-footer">
      <Button
        variant="outline"
        disabled={busy}
        onclick={() => (editor = false)}
      >
        取消
      </Button><Button type="submit" disabled={busy}>儲存服務</Button>
    </Dialog.Footer>
  </form>
</Modal>
<Modal
  bind:open={remove}
  title="刪除服務"
  description={"確認刪除「" + (selected?.service_name ?? "") + "」？"}
  {busy}
>
  <Feedback error={formError} />
  <div class="mt-4 flex justify-end gap-2">
    <Button variant="outline" disabled={busy} onclick={() => (remove = false)}>
      取消
    </Button><Button variant="destructive" disabled={busy} onclick={del}>
      確認刪除
    </Button>
  </div>
</Modal>

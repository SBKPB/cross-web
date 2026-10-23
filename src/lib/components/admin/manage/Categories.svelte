<script lang="ts">
  import AdminSkeleton from "../layout/AdminSkeleton.svelte";
  import * as Dialog from "#lib/components/ui/dialog/index.ts";
  import * as Card from "#lib/components/ui/card/index.ts";
  import * as Field from "#lib/components/ui/field/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import { Checkbox } from "#lib/components/ui/checkbox/index.ts";
  const formId = $props.id();

  import {
    adminServiceCategoriesApi,
    type ServiceCategoryAdmin,
  } from "#lib/api/admin/service-categories.ts";
  import { FACILITY_TYPE_LABELS } from "#lib/constants/clinic-constants.ts";
  import { apiMessage } from "#lib/admin/scheduling.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import Feedback from "./Feedback.svelte";
  import Modal from "./Modal.svelte";
  import type { FacilityType } from "#lib/types/clinic.ts";
  let rows = $state<ServiceCategoryAdmin[]>([]),
    loading = $state(true),
    error = $state(""),
    formError = $state(""),
    message = $state(""),
    revision = $state(0),
    open = $state(false),
    remove = $state(false),
    selected = $state<ServiceCategoryAdmin | null>(null),
    type = $state<FacilityType>("healthcare"),
    label = $state(""),
    order = $state<number | undefined>(0),
    active = $state(true),
    busy = $state(false);
  $effect(() => {
    const r = revision;
    void r;
    let live = true;
    loading = true;
    error = "";
    adminServiceCategoriesApi
      .list()
      .then((v) => {
        if (live) rows = v;
      })
      .catch((e) => {
        if (live) error = apiMessage(e, "服務分類載入失敗");
      })
      .finally(() => {
        if (live) loading = false;
      });
    return () => {
      live = false;
    };
  });
  function edit(c: ServiceCategoryAdmin | null, t: FacilityType) {
    selected = c;
    type = t;
    label = c?.label ?? "";
    order = c?.sort_order ?? 0;
    active = c?.is_active ?? true;
    formError = "";
    open = true;
  }
  async function save(e: SubmitEvent) {
    e.preventDefault();
    busy = true;
    formError = "";
    try {
      if (selected)
        await adminServiceCategoriesApi.update(selected.id, {
          label: label.trim(),
          sort_order: order ?? 0,
          is_active: active,
        });
      else
        await adminServiceCategoriesApi.create({
          facility_type: type,
          label: label.trim(),
        });
      open = false;
      revision++;
      message = "服務分類已儲存";
    } catch (e) {
      formError = apiMessage(e, "分類儲存失敗");
    } finally {
      busy = false;
    }
  }
  async function del() {
    if (!selected) return;
    busy = true;
    formError = "";
    try {
      await adminServiceCategoriesApi.delete(selected.id);
      remove = false;
      revision++;
      message = "服務分類已刪除";
    } catch (e) {
      formError = apiMessage(e, "分類刪除失敗，可能仍有院所使用中");
    } finally {
      busy = false;
    }
  }
</script>

<div class="space-y-5">
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">系統設定</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      管理民眾搜尋與院所建檔使用的服務類別。
    </p>
  </div>
  <h2 class="font-semibold">服務類別管理</h2>
  <Feedback {error} {message} />{#if error}<Button
      variant="outline"
      onclick={() => revision++}
    >
      重試服務分類
    </Button>{/if}{#if loading}<AdminSkeleton
      label="載入分類中…"
      variant="list"
    />{:else if !error}{#each Object.entries(FACILITY_TYPE_LABELS) as [key, name] (key)}<Card.Root
        class="gap-0 shadow-sm space-y-4 p-5"
      >
        <div class="flex justify-between gap-3">
          <h3 class="font-semibold">{name}</h3>
          <Button
            size="sm"
            variant="outline"
            onclick={() => edit(null, key as FacilityType)}
          >
            新增{name}分類
          </Button>
        </div>
        <ul class="divide-y">
          {#each rows
            .filter((c) => c.facility_type === key)
            .sort((a, b) => a.sort_order - b.sort_order) as c (c.id)}<li
              class="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <span class="text-sm">
                {c.label}{c.is_active ? "" : "（停用）"}
              </span>
              <div class="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => edit(c, c.facility_type)}
                >
                  編輯分類
                </Button><Button
                  variant="ghost"
                  size="sm"
                  onclick={() => {
                    selected = c;
                    formError = "";
                    remove = true;
                  }}
                >
                  刪除
                </Button>
              </div>
            </li>{:else}<li class="py-4 text-sm text-muted-foreground">
              尚無分類。
            </li>{/each}
        </ul>
      </Card.Root>{/each}{/if}
</div>
<Modal
  bind:open
  title={selected ? "編輯分類" : "新增分類"}
  description={FACILITY_TYPE_LABELS[type] + "的服務分類"}
  {busy}
>
  <form onsubmit={save} class="space-y-4">
    <Feedback error={formError} /><Field.Set disabled={busy} class="gap-5">
      <Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-1"].join("-")}
          class="text-sm font-medium"
        >
          分類名稱
        </Field.Label><Input
          bind:value={label}
          required
          maxlength={100}
          id={[formId, "field-1"].join("-")}
        />
      </Field.Field>{#if selected}<Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-2"].join("-")}
            class="text-sm font-medium"
          >
            排序
          </Field.Label><Input
            type="number"
            step="1"
            bind:value={order}
            required
            id={[formId, "field-2"].join("-")}
          />
        </Field.Field><Field.Field
          orientation="horizontal"
          class="items-center gap-2.5"
        >
          <Checkbox
            bind:checked={active}
            id={[formId, "field-3"].join("-")}
          /><Field.Label
            for={[formId, "field-3"].join("-")}
            class="cursor-pointer text-sm font-normal"
          >
            啟用分類
          </Field.Label>
        </Field.Field>{/if}
    </Field.Set>
    <Dialog.Footer class="admin-dialog-footer">
      <Button variant="outline" disabled={busy} onclick={() => (open = false)}>
        取消
      </Button><Button type="submit" disabled={busy}>儲存分類</Button>
    </Dialog.Footer>
  </form>
</Modal>
<Modal
  bind:open={remove}
  title="刪除分類"
  description={"確認刪除「" +
    (selected?.label ?? "") +
    "」？已被院所使用的分類可能無法刪除。"}
  {busy}
>
  <Feedback error={formError} />
  <div class="mt-4 flex justify-end gap-2">
    <Button variant="outline" disabled={busy} onclick={() => (remove = false)}>
      取消
    </Button><Button variant="destructive" disabled={busy} onclick={del}>
      確認刪除分類
    </Button>
  </div>
</Modal>

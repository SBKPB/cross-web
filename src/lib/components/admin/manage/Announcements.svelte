<script lang="ts">
  import AdminSkeleton from "../layout/AdminSkeleton.svelte";
  import * as Dialog from "#lib/components/ui/dialog/index.ts";
  import * as Card from "#lib/components/ui/card/index.ts";
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
  import type { Announcement } from "#lib/types/clinic.ts";
  let { facilityId }: { facilityId: string } = $props();
  let rows = $state<Announcement[]>([]),
    loading = $state(true),
    error = $state(""),
    formError = $state(""),
    revision = $state(0),
    editor = $state(false),
    remove = $state(false),
    selected = $state<Announcement | null>(null),
    busy = $state(false),
    title = $state(""),
    content = $state(""),
    active = $state(true),
    message = $state("");
  $effect(() => {
    const id = facilityId,
      r = revision;
    void r;
    let live = true;
    loading = true;
    error = "";
    adminClinicsApi.announcements
      .list(id)
      .then((v) => {
        if (live) rows = v;
      })
      .catch((e) => {
        if (live) error = apiMessage(e, "公告載入失敗");
      })
      .finally(() => {
        if (live) loading = false;
      });
    return () => {
      live = false;
    };
  });
  function edit(a: Announcement | null) {
    selected = a;
    title = a?.title ?? "";
    content = a?.content ?? "";
    active = a?.is_active ?? true;
    formError = "";
    editor = true;
  }
  async function save(e: SubmitEvent) {
    e.preventDefault();
    busy = true;
    formError = "";
    try {
      if (selected)
        await adminClinicsApi.announcements.update(facilityId, selected.id, {
          title: title.trim(),
          content: content.trim(),
          is_active: active,
        });
      else
        await adminClinicsApi.announcements.create(facilityId, {
          title: title.trim(),
          content: content.trim(),
        });
      editor = false;
      revision++;
      message = "公告已儲存";
    } catch (e) {
      formError = apiMessage(e, "公告儲存失敗");
    } finally {
      busy = false;
    }
  }
  async function del() {
    if (!selected) return;
    busy = true;
    formError = "";
    try {
      await adminClinicsApi.announcements.delete(facilityId, selected.id);
      remove = false;
      revision++;
      message = "公告已刪除";
    } catch (e) {
      formError = apiMessage(e, "公告刪除失敗");
    } finally {
      busy = false;
    }
  }
</script>

<div class="space-y-4">
  <div class="flex justify-between gap-3">
    <h2 class="font-semibold">院所公告</h2>
    <Button onclick={() => edit(null)}>新增公告</Button>
  </div>
  <Feedback {error} {message} />{#if error}<Button
      variant="outline"
      onclick={() => revision++}
    >
      重試公告
    </Button>{/if}{#if loading}<AdminSkeleton
      label="載入公告中…"
      variant="list"
    />{:else if !error}<div class="space-y-3">
      {#each rows as a (a.id)}<Card.Root
          role="article"
          class="gap-0 shadow-sm space-y-3 p-5"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h3 class="font-semibold">
              {a.title || "院所公告"} · {a.is_active ? "發布中" : "已隱藏"}
            </h3>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" onclick={() => edit(a)}>
                編輯公告
              </Button><Button
                variant="ghost"
                size="sm"
                onclick={() => {
                  selected = a;
                  formError = "";
                  remove = true;
                }}
              >
                刪除
              </Button>
            </div>
          </div>
          <p class="whitespace-pre-wrap text-sm">{a.content}</p>
          <p class="text-xs text-muted-foreground">
            {a.created_at.slice(0, 10)}
          </p>
        </Card.Root>{:else}<p
          class="rounded-xl border p-8 text-center text-muted-foreground"
        >
          尚無公告。
        </p>{/each}
    </div>{/if}
</div>
<Modal bind:open={editor} title={selected ? "編輯公告" : "新增公告"} {busy}>
  <form onsubmit={save} class="space-y-4">
    <Feedback error={formError} /><Field.Set disabled={busy} class="gap-5">
      <Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-1"].join("-")}
          class="text-sm font-medium"
        >
          公告標題
        </Field.Label><Input
          bind:value={title}
          required
          maxlength={255}
          id={[formId, "field-1"].join("-")}
        />
      </Field.Field><Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-2"].join("-")}
          class="text-sm font-medium"
        >
          公告內容
        </Field.Label><Textarea
          bind:value={content}
          required
          rows={6}
          id={[formId, "field-2"].join("-")}
        ></Textarea>
      </Field.Field>{#if selected}<Field.Field
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
            公開顯示公告
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
      </Button><Button type="submit" disabled={busy}>儲存公告</Button>
    </Dialog.Footer>
  </form>
</Modal>
<Modal
  bind:open={remove}
  title="刪除公告"
  description={"確認刪除「" + (selected?.title ?? "院所公告") + "」？"}
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

<script lang="ts">
  import * as Dialog from "#lib/components/ui/dialog/index.ts";
  import * as Field from "#lib/components/ui/field/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  const formId = $props.id();

  import Modal from "./Modal.svelte";
  import Feedback from "./Feedback.svelte";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { authApi } from "#lib/api/auth.ts";
  import { apiMessage } from "#lib/admin/scheduling.ts";
  let { open = $bindable(false) }: { open?: boolean } = $props();
  let current = $state(""),
    next = $state(""),
    confirm = $state(""),
    busy = $state(false),
    error = $state(""),
    done = $state(false);
  async function save(e: SubmitEvent) {
    e.preventDefault();
    error = "";
    if (next !== confirm) {
      error = "兩次新密碼不一致";
      return;
    }
    busy = true;
    try {
      await authApi.changePassword(current, next);
      current = "";
      next = "";
      confirm = "";
      done = true;
    } catch (e) {
      error = apiMessage(e, "修改密碼失敗");
    } finally {
      busy = false;
    }
  }
</script>

<Modal bind:open title="修改密碼" {busy}>
  <form onsubmit={save} class="space-y-4">
    <Feedback
      {error}
      message={done ? "密碼已更新，下次登入請使用新密碼。" : ""}
    />{#if !done}<Field.Set disabled={busy} class="gap-5">
        <Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-1"].join("-")}
            class="text-sm font-medium"
          >
            目前密碼
          </Field.Label><Input
            type="password"
            bind:value={current}
            autocomplete="current-password"
            required
            id={[formId, "field-1"].join("-")}
          />
        </Field.Field><Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-2"].join("-")}
            class="text-sm font-medium"
          >
            新密碼
          </Field.Label><Input
            type="password"
            bind:value={next}
            autocomplete="new-password"
            minlength={8}
            required
            id={[formId, "field-2"].join("-")}
          />
        </Field.Field><Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-3"].join("-")}
            class="text-sm font-medium"
          >
            確認新密碼
          </Field.Label><Input
            type="password"
            bind:value={confirm}
            autocomplete="new-password"
            minlength={8}
            required
            id={[formId, "field-3"].join("-")}
          />
        </Field.Field>
      </Field.Set>{/if}
    <Dialog.Footer class="admin-dialog-footer">
      <Button variant="outline" disabled={busy} onclick={() => (open = false)}>
        {done ? "關閉" : "取消"}
      </Button>{#if !done}<Button type="submit" disabled={busy}>
          {busy ? "儲存中…" : "儲存密碼"}
        </Button>{/if}
    </Dialog.Footer>
  </form>
</Modal>

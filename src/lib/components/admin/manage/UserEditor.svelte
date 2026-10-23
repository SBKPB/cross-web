<script lang="ts">
  import * as Dialog from "#lib/components/ui/dialog/index.ts";
  import * as Field from "#lib/components/ui/field/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import * as NativeSelect from "#lib/components/ui/native-select/index.ts";
  import { Checkbox } from "#lib/components/ui/checkbox/index.ts";
  const formId = $props.id();

  import { untrack } from "svelte";
  import Modal from "./Modal.svelte";
  import Feedback from "./Feedback.svelte";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { adminUsersApi } from "#lib/api/admin/users.ts";
  import { requiresFacility } from "#lib/auth/roles.ts";
  import { apiMessage } from "#lib/admin/scheduling.ts";
  import type { AdminUser, Role } from "#lib/types/user.ts";
  import type { MedicalFacility } from "#lib/types/clinic.ts";
  let {
    open = $bindable(false),
    user = null,
    roles,
    facilities,
    onSaved,
  }: {
    open?: boolean;
    user?: AdminUser | null;
    roles: Role[];
    facilities: MedicalFacility[];
    onSaved: () => void;
  } = $props();
  let email = $state(""),
    phone = $state(""),
    password = $state(""),
    facility = $state(""),
    active = $state(true),
    chosen = $state<string[]>([]),
    busy = $state(false),
    error = $state(""),
    createdId = $state<string | null>(null);
  $effect(() => {
    if (!open) return;
    const u = user;
    untrack(() => {
      email = u?.email ?? "";
      phone = u?.phone_number ?? "";
      password = "";
      facility = u?.facility_id ?? "";
      active = u?.is_active ?? true;
      chosen = [];
      createdId = null;
      error = "";
    });
  });
  async function save(e: SubmitEvent) {
    e.preventDefault();
    error = "";
    const bound = user
      ? user.roles.some(requiresFacility)
      : roles.some((r) => chosen.includes(r.id) && requiresFacility(r.name));
    if (bound && !facility) {
      error = "院所角色必須選擇所屬院所";
      return;
    }
    if (!user && !chosen.length) {
      error = "請選擇至少一個員工角色";
      return;
    }
    busy = true;
    try {
      if (!user && !createdId) {
        const created = await adminUsersApi.create({
          email: email.trim(),
          password,
          phone_number: phone.trim() || undefined,
        });
        createdId = created.id;
        password = "";
      }
      const id = user?.id ?? createdId!;
      await adminUsersApi.update(id, {
        email: email.trim(),
        phone_number: phone.trim() || null,
        facility_id: facility || null,
        is_active: active,
      });
      if (!user) await adminUsersApi.setUserRoles(id, chosen);
      onSaved();
      open = false;
    } catch (e) {
      error =
        (createdId
          ? "帳號已建立，剩餘設定尚未完成。按「繼續完成設定」重試，不會重複建立帳號。 "
          : "") + apiMessage(e, "帳號儲存失敗");
      if (createdId) onSaved();
    } finally {
      busy = false;
    }
  }
</script>

<Modal
  bind:open
  title={user ? "編輯帳號" : "新增員工帳號"}
  description="院所管理員與員工必須綁定所屬院所。"
  {busy}
>
  <form onsubmit={save} class="space-y-4">
    <Feedback {error} /><Field.Set disabled={busy} class="gap-5">
      <Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-1"].join("-")}
          class="text-sm font-medium"
        >
          電子郵件
        </Field.Label><Input
          type="email"
          bind:value={email}
          disabled={!!createdId}
          required
          autocomplete="off"
          id={[formId, "field-1"].join("-")}
        />
      </Field.Field>{#if !user && !createdId}<Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-2"].join("-")}
            class="text-sm font-medium"
          >
            初始密碼
          </Field.Label><Input
            type="password"
            bind:value={password}
            minlength={8}
            autocomplete="new-password"
            required
            id={[formId, "field-2"].join("-")}
          />
        </Field.Field>{/if}<Field.Field class="gap-2">
        <Field.Label
          for={[formId, "field-3"].join("-")}
          class="text-sm font-medium"
        >
          聯絡電話
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
          所屬院所
        </Field.Label><NativeSelect.Root
          aria-label="所屬院所"
          bind:value={facility}
          id={[formId, "field-4"].join("-")}
          class="w-full"
        >
          <NativeSelect.Option value="">
            未綁定院所
          </NativeSelect.Option>{#each facilities as f (f.id)}<NativeSelect.Option
              value={f.id}
            >
              {f.name}
            </NativeSelect.Option>{/each}
        </NativeSelect.Root>
      </Field.Field>{#if !user}<Field.Set class="gap-5">
          <Field.Legend>
            員工角色
          </Field.Legend>{#each roles as r (r.id)}<Field.Field
              orientation="horizontal"
              class="items-center gap-2.5"
            >
              <Checkbox
                id={[formId, "field-5", String(r.id)].join("-")}
                checked={chosen.includes(r.id)}
                onCheckedChange={(checked) =>
                  (chosen = checked
                    ? [...chosen, r.id]
                    : chosen.filter((item) => item !== r.id))}
              /><Field.Label
                for={[formId, "field-5", String(r.id)].join("-")}
                class="cursor-pointer text-sm font-normal"
              >
                {r.display_name}
              </Field.Label>
            </Field.Field>{/each}
        </Field.Set>{/if}<Field.Field
        orientation="horizontal"
        class="items-center gap-2.5"
      >
        <Checkbox
          bind:checked={active}
          id={[formId, "field-6"].join("-")}
        /><Field.Label
          for={[formId, "field-6"].join("-")}
          class="cursor-pointer text-sm font-normal"
        >
          啟用帳號
        </Field.Label>
      </Field.Field>
    </Field.Set>
    <Dialog.Footer class="admin-dialog-footer">
      <Button
        variant="outline"
        disabled={busy}
        onclick={() => {
          if (createdId) onSaved();
          open = false;
        }}
      >
        取消
      </Button><Button type="submit" disabled={busy}>
        {createdId ? "繼續完成設定" : "儲存帳號"}
      </Button>
    </Dialog.Footer>
  </form>
</Modal>

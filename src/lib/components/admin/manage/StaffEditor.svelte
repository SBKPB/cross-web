<script lang="ts">
  import * as Dialog from "#lib/components/ui/dialog/index.ts";
  import * as Field from "#lib/components/ui/field/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import * as NativeSelect from "#lib/components/ui/native-select/index.ts";
  import { Checkbox } from "#lib/components/ui/checkbox/index.ts";
  import { Textarea } from "#lib/components/ui/textarea/index.ts";
  const formId = $props.id();

  import { untrack } from "svelte";
  import Modal from "./Modal.svelte";
  import Feedback from "./Feedback.svelte";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { adminClinicsApi } from "#lib/api/admin/clinics.ts";
  import { apiMessage } from "#lib/admin/scheduling.ts";
  import type {
    ApiStaff,
    ApiStaffRole,
    ApiStaffCreate,
  } from "#lib/types/clinic.ts";
  let {
    open = $bindable(false),
    facilityId,
    staff = null,
    onSaved,
  }: {
    open?: boolean;
    facilityId: string;
    staff?: ApiStaff | null;
    onSaved: () => void;
  } = $props();
  const roles: Record<ApiStaffRole, string> = {
    doctor: "醫師",
    nurse: "護理師",
    receptionist: "櫃檯",
    admin: "行政",
    beautician: "美容師",
    therapist: "治療師",
  };
  let current = $state<ApiStaff | null>(null),
    name = $state(""),
    phone = $state(""),
    email = $state(""),
    role = $state<ApiStaffRole>("doctor"),
    active = $state(true),
    visible = $state(true),
    bookable = $state(true),
    department = $state(""),
    license = $state(""),
    licenseType = $state(""),
    nhi = $state(""),
    education = $state(""),
    experience = $state(""),
    specialties = $state(""),
    certifications = $state(""),
    years = $state<number | undefined>(),
    busy = $state(false),
    error = $state(""),
    message = $state("");
  $effect(() => {
    if (!open) return;
    const s = staff;
    untrack(() => {
      current = s;
      name = s?.name ?? "";
      phone = s?.phone ?? "";
      email = s?.email ?? "";
      role = s?.role ?? "doctor";
      active = s?.is_active ?? true;
      visible = s?.is_public_visible ?? true;
      bookable = s?.is_bookable ?? true;
      department = s?.department ?? "";
      license = s?.license_number ?? "";
      licenseType = s?.license_type ?? "";
      nhi = s?.nhi_provider_id ?? "";
      education = s?.education?.join("\n") ?? "";
      experience = s?.experience?.join("\n") ?? "";
      specialties = s?.main_specialties?.join("\n") ?? "";
      certifications = s?.certifications?.join("\n") ?? "";
      years = s?.experience_years;
      error = "";
      message = "";
    });
  });
  const lines = (s: string) =>
    s
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
  async function save(e: SubmitEvent) {
    e.preventDefault();
    busy = true;
    error = "";
    const data: ApiStaffCreate = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      role,
      is_public_visible: visible,
      is_bookable: bookable,
      ...(role === "doctor"
        ? {
            department,
            license_number: license,
            license_type: licenseType,
            nhi_provider_id: nhi,
            education: lines(education),
            experience: lines(experience),
            main_specialties: lines(specialties),
          }
        : {}),
      ...(["beautician", "therapist"].includes(role)
        ? {
            certifications: lines(certifications),
            experience_years: years ?? 0,
          }
        : {}),
    };
    try {
      current = current
        ? await adminClinicsApi.staff.update(facilityId, current.id, {
            ...data,
            is_active: active,
          })
        : await adminClinicsApi.staff.create(facilityId, data);
      onSaved();
      open = false;
    } catch (e) {
      error = apiMessage(e, "人員資料儲存失敗");
    } finally {
      busy = false;
    }
  }
  async function upload(e: Event) {
    const input = e.currentTarget as HTMLInputElement,
      file = input.files?.[0];
    if (!file || !current) return;
    busy = true;
    error = "";
    try {
      current = await adminClinicsApi.staff.uploadAvatar(
        facilityId,
        current.id,
        file,
      );
      onSaved();
      message = "照片已更新";
    } catch (e) {
      error = apiMessage(e, "照片上傳失敗");
    } finally {
      busy = false;
      input.value = "";
    }
  }
</script>

<Modal
  bind:open
  title={current ? "人員檔案與編輯" : "新增人員"}
  description="維護聯絡方式、公開資料與預約資格。學經歷及證照每行填寫一項。"
  {busy}
>
  <form onsubmit={save} class="space-y-5">
    <Feedback {error} {message} /><Field.Set disabled={busy} class="gap-5">
      {#if current}<div class="flex flex-wrap items-center gap-3">
          {#if current.avatar_url}<img
              src={current.avatar_url}
              alt={current.name}
              class="size-20 rounded-xl object-cover"
            />{/if}<Field.Field class="gap-2">
            <Field.Label
              for={[formId, "field-1"].join("-")}
              class="text-sm font-medium"
            >
              上傳人員照片
            </Field.Label><Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onchange={upload}
              id={[formId, "field-1"].join("-")}
            />
          </Field.Field>
        </div>{:else}<p class="text-sm text-muted-foreground">
          先儲存人員，再開啟檔案上傳照片。
        </p>{/if}
      <div class="grid gap-4 sm:grid-cols-2">
        <Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-2"].join("-")}
            class="text-sm font-medium"
          >
            姓名
          </Field.Label><Input
            bind:value={name}
            required
            id={[formId, "field-2"].join("-")}
          />
        </Field.Field><Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-3"].join("-")}
            class="text-sm font-medium"
          >
            角色
          </Field.Label><NativeSelect.Root
            aria-label="角色"
            bind:value={role}
            id={[formId, "field-3"].join("-")}
            class="w-full"
          >
            {#each Object.entries(roles) as [key, label] (key)}<NativeSelect.Option
                value={key}
              >
                {label}
              </NativeSelect.Option>{/each}
          </NativeSelect.Root>
        </Field.Field><Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-4"].join("-")}
            class="text-sm font-medium"
          >
            電話
          </Field.Label><Input
            type="tel"
            bind:value={phone}
            id={[formId, "field-4"].join("-")}
          />
        </Field.Field><Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-5"].join("-")}
            class="text-sm font-medium"
          >
            電子郵件
          </Field.Label><Input
            type="email"
            bind:value={email}
            id={[formId, "field-5"].join("-")}
          />
        </Field.Field>
      </div>
      <div class="flex flex-wrap gap-4">
        {#if current}<Field.Field
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
              啟用人員
            </Field.Label>
          </Field.Field>{/if}<Field.Field
          orientation="horizontal"
          class="items-center gap-2.5"
        >
          <Checkbox
            bind:checked={visible}
            id={[formId, "field-7"].join("-")}
          /><Field.Label
            for={[formId, "field-7"].join("-")}
            class="cursor-pointer text-sm font-normal"
          >
            公開顯示
          </Field.Label>
        </Field.Field><Field.Field
          orientation="horizontal"
          class="items-center gap-2.5"
        >
          <Checkbox
            bind:checked={bookable}
            id={[formId, "field-8"].join("-")}
          /><Field.Label
            for={[formId, "field-8"].join("-")}
            class="cursor-pointer text-sm font-normal"
          >
            開放預約
          </Field.Label>
        </Field.Field>
      </div>
      {#if role === "doctor"}<div class="grid gap-4 sm:grid-cols-2">
          <Field.Field class="gap-2">
            <Field.Label
              for={[formId, "field-9"].join("-")}
              class="text-sm font-medium"
            >
              科別
            </Field.Label><Input
              bind:value={department}
              id={[formId, "field-9"].join("-")}
            />
          </Field.Field><Field.Field class="gap-2">
            <Field.Label
              for={[formId, "field-10"].join("-")}
              class="text-sm font-medium"
            >
              執照號碼
            </Field.Label><Input
              bind:value={license}
              id={[formId, "field-10"].join("-")}
            />
          </Field.Field><Field.Field class="gap-2">
            <Field.Label
              for={[formId, "field-11"].join("-")}
              class="text-sm font-medium"
            >
              證照類別
            </Field.Label><Input
              bind:value={licenseType}
              id={[formId, "field-11"].join("-")}
            />
          </Field.Field><Field.Field class="gap-2">
            <Field.Label
              for={[formId, "field-12"].join("-")}
              class="text-sm font-medium"
            >
              健保醫事人員代碼
            </Field.Label><Input
              bind:value={nhi}
              id={[formId, "field-12"].join("-")}
            />
          </Field.Field>
        </div>
        <Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-13"].join("-")}
            class="text-sm font-medium"
          >
            學歷
          </Field.Label><Textarea
            bind:value={education}
            id={[formId, "field-13"].join("-")}
          ></Textarea>
        </Field.Field><Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-14"].join("-")}
            class="text-sm font-medium"
          >
            經歷
          </Field.Label><Textarea
            bind:value={experience}
            id={[formId, "field-14"].join("-")}
          ></Textarea>
        </Field.Field><Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-15"].join("-")}
            class="text-sm font-medium"
          >
            主要專長
          </Field.Label><Textarea
            bind:value={specialties}
            id={[formId, "field-15"].join("-")}
          ></Textarea>
        </Field.Field>{:else if ["beautician", "therapist"].includes(role)}<Field.Field
          class="gap-2"
        >
          <Field.Label
            for={[formId, "field-16"].join("-")}
            class="text-sm font-medium"
          >
            證照
          </Field.Label><Textarea
            bind:value={certifications}
            id={[formId, "field-16"].join("-")}
          ></Textarea>
        </Field.Field><Field.Field class="gap-2">
          <Field.Label
            for={[formId, "field-17"].join("-")}
            class="text-sm font-medium"
          >
            服務年資
          </Field.Label><Input
            type="number"
            min="0"
            max="100"
            bind:value={years}
            id={[formId, "field-17"].join("-")}
          />
        </Field.Field>{/if}{#if current}<p
          class="text-xs text-muted-foreground"
        >
          建立日期：{current.created_at?.slice(0, 10)} · 最後登入：{current.last_login ??
            "尚未登入"}
        </p>{/if}
    </Field.Set>
    <Dialog.Footer class="admin-dialog-footer">
      <Button variant="outline" disabled={busy} onclick={() => (open = false)}>
        取消
      </Button><Button type="submit" disabled={busy}>
        {busy ? "儲存中…" : "儲存人員"}
      </Button>
    </Dialog.Footer>
  </form>
</Modal>

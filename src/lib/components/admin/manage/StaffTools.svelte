<script lang="ts">
  import DateInput from "#lib/components/ui/date-input/DateInput.svelte";
  import AdminSkeleton from "../layout/AdminSkeleton.svelte";
  import * as Field from "#lib/components/ui/field/index.ts";
  import { Checkbox } from "#lib/components/ui/checkbox/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  const formId = $props.id();

  import Modal from "./Modal.svelte";
  import Feedback from "./Feedback.svelte";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { adminClinicsApi } from "#lib/api/admin/clinics.ts";
  import { apiMessage } from "#lib/admin/scheduling.ts";
  import { taipeiToday } from "#lib/constants/appointment.ts";
  import type {
    ApiStaff,
    ApiService,
    ApiStaffLeave,
  } from "#lib/types/clinic.ts";
  let {
    open = $bindable(false),
    onClose,
    mode,
    staff,
    facilityId,
  }: {
    open?: boolean;
    onClose: () => void;
    mode: "services" | "leaves";
    staff: ApiStaff;
    facilityId: string;
  } = $props();
  let services = $state<ApiService[]>([]),
    assigned = $state<string[]>([]),
    chosen = $state<string[]>([]),
    leaves = $state<ApiStaffLeave[]>([]),
    loading = $state(true),
    busy = $state(false),
    error = $state(""),
    message = $state(""),
    revision = $state(0),
    date = $state(taipeiToday()),
    note = $state(""),
    deleting = $state<string | null>(null);
  $effect(() => {
    if (!open) {
      onClose();
      return;
    }
    const id = facilityId,
      sid = staff.id,
      m = mode,
      r = revision;
    void r;
    let live = true;
    loading = true;
    error = "";
    (async () => {
      try {
        if (m === "services") {
          const [all, links] = await Promise.all([
            adminClinicsApi.services.list(id),
            adminClinicsApi.staffServices.list(id, sid),
          ]);
          if (live) {
            services = all;
            assigned = links.map((s) => s.service_id);
            chosen = [...assigned];
          }
        } else {
          const all = await adminClinicsApi.staffLeaves.list(id, sid);
          if (live) leaves = all;
        }
      } catch (e) {
        if (live) error = apiMessage(e, "資料載入失敗");
      } finally {
        if (live) loading = false;
      }
    })();
    return () => {
      live = false;
    };
  });
  async function saveServices() {
    busy = true;
    error = "";
    try {
      for (const id of chosen.filter((id) => !assigned.includes(id))) {
        await adminClinicsApi.staffServices.add(facilityId, staff.id, {
          service_id: id,
        });
        assigned = [...assigned, id];
      }
      for (const id of assigned.filter((id) => !chosen.includes(id))) {
        await adminClinicsApi.staffServices.remove(facilityId, staff.id, id);
        assigned = assigned.filter((x) => x !== id);
      }
      message = "服務對應已儲存";
    } catch (e) {
      error = apiMessage(e, "部分服務未儲存，已成功的項目會保留，可重試");
    } finally {
      busy = false;
    }
  }
  async function addLeave(e: SubmitEvent) {
    e.preventDefault();
    busy = true;
    error = "";
    try {
      const row = await adminClinicsApi.staffLeaves.create(
        facilityId,
        staff.id,
        { date, note: note.trim() || undefined },
      );
      leaves = [...leaves, row];
      note = "";
      message = "休假已新增";
    } catch (e) {
      error = apiMessage(e, "休假新增失敗");
    } finally {
      busy = false;
    }
  }
  async function removeLeave(id: string) {
    busy = true;
    error = "";
    try {
      await adminClinicsApi.staffLeaves.delete(facilityId, staff.id, id);
      leaves = leaves.filter((x) => x.id !== id);
      deleting = null;
      message = "休假已刪除";
    } catch (e) {
      error = apiMessage(e, "休假刪除失敗");
    } finally {
      busy = false;
    }
  }
</script>

<Modal
  bind:open
  title={staff.name + "・" + (mode === "services" ? "服務對應" : "休假管理")}
  description={mode === "services"
    ? "選擇此人員可提供的服務，儲存後影響預約人員選擇。"
    : "新增休假後，該日不提供可預約時段。"}
  {busy}
>
  <div class="space-y-4">
    <Feedback {error} {message} />{#if loading}<AdminSkeleton
        label="載入資料中…"
        variant="form"
      />{:else if error && services.length === 0 && leaves.length === 0}<Button
        variant="outline"
        onclick={() => revision++}
      >
        重新載入
      </Button>{/if}{#if !loading}{#if mode === "services"}<Field.Set
          disabled={busy}
          class="gap-5"
        >
          {#each services as s (s.id)}<Field.Field
              orientation="horizontal"
              class="items-center gap-2.5"
            >
              <Checkbox
                id={[formId, "field-1", String(s.id)].join("-")}
                checked={chosen.includes(s.id)}
                onCheckedChange={(checked) =>
                  (chosen = checked
                    ? [...chosen, s.id]
                    : chosen.filter((item) => item !== s.id))}
              /><Field.Label
                for={[formId, "field-1", String(s.id)].join("-")}
                class="cursor-pointer text-sm font-normal"
              >
                {s.service_name}（{s.duration_minutes} 分鐘）{s.is_active
                  ? ""
                  : "・停用"}
              </Field.Label>
            </Field.Field>{:else}<p>尚無服務，請先新增服務項目。</p>{/each}
        </Field.Set>
        <div class="flex justify-end">
          <Button
            disabled={busy || (!!error && services.length === 0)}
            onclick={saveServices}
          >
            儲存服務對應
          </Button>
        </div>{:else}<form onsubmit={addLeave} class="space-y-3">
          <Field.Set disabled={busy} class="grid gap-3 sm:grid-cols-2">
            <Field.Field class="gap-2">
              <Field.Label
                for={[formId, "field-2"].join("-")}
                class="text-sm font-medium"
              >
                休假日期
              </Field.Label><DateInput
                bind:value={date}
                required
                id={[formId, "field-2"].join("-")}
              />
            </Field.Field><Field.Field class="gap-2">
              <Field.Label
                for={[formId, "field-3"].join("-")}
                class="text-sm font-medium"
              >
                休假備註
              </Field.Label><Input
                bind:value={note}
                id={[formId, "field-3"].join("-")}
              />
            </Field.Field>
          </Field.Set><Button type="submit" disabled={busy}>新增休假</Button>
        </form>
        <ul class="divide-y rounded-xl border">
          {#each [...leaves].sort( (a, b) => b.date.localeCompare(a.date), ) as l (l.id)}<li
              class="flex flex-wrap items-center justify-between gap-2 p-3"
            >
              <span>{l.date} {l.note}</span>
              {#if deleting === l.id}<div class="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onclick={() => (deleting = null)}
                  >
                    取消
                  </Button><Button
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onclick={() => removeLeave(l.id)}
                  >
                    確認刪除休假
                  </Button>
                </div>{:else}<Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onclick={() => (deleting = l.id)}
                >
                  刪除
                </Button>{/if}
            </li>{:else}<li class="p-5 text-sm text-muted-foreground">
              尚無休假紀錄。
            </li>{/each}
        </ul>{/if}{/if}
  </div>
</Modal>

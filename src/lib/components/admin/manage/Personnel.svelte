<script lang="ts">
  import AdminSkeleton from "../layout/AdminSkeleton.svelte";
  import {
    Phone,
    Mail,
    Plus,
    UsersRound,
    BriefcaseBusiness,
    CalendarOff,
    ArrowRight,
    Trash2,
  } from "@lucide/svelte";
  import * as Avatar from "#lib/components/ui/avatar/index.ts";
  import * as Empty from "#lib/components/ui/empty/index.ts";
  import { Badge } from "#lib/components/ui/badge/index.ts";

  import * as NativeSelect from "#lib/components/ui/native-select/index.ts";
  import * as Card from "#lib/components/ui/card/index.ts";

  import { adminClinicsApi } from "#lib/api/admin/clinics.ts";
  import { apiMessage } from "#lib/admin/scheduling.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import type { ApiStaff } from "#lib/types/clinic.ts";
  import Feedback from "./Feedback.svelte";
  import Modal from "./Modal.svelte";
  import StaffEditor from "./StaffEditor.svelte";
  import StaffTools from "./StaffTools.svelte";
  let { facilityId }: { facilityId: string } = $props();
  let rows = $state<ApiStaff[]>([]),
    loading = $state(true),
    error = $state(""),
    message = $state(""),
    revision = $state(0),
    role = $state(""),
    editor = $state(false),
    selected = $state<ApiStaff | null>(null),
    tool = $state<"services" | "leaves" | null>(null),
    remove = $state(false),
    busy = $state(false);
  const roles: Record<string, string> = {
    doctor: "醫師",
    nurse: "護理師",
    receptionist: "櫃檯",
    admin: "行政",
    beautician: "美容師",
    therapist: "治療師",
  };
  $effect(() => {
    const id = facilityId,
      r = revision;
    void r;
    let live = true;
    loading = true;
    error = "";
    adminClinicsApi.staff
      .list(id)
      .then((v) => {
        if (live) rows = v;
      })
      .catch((e) => {
        if (live) error = apiMessage(e, "無法載入人員");
      })
      .finally(() => {
        if (live) loading = false;
      });
    return () => {
      live = false;
    };
  });
  async function deleteStaff() {
    if (!selected) return;
    busy = true;
    error = "";
    try {
      await adminClinicsApi.staff.delete(facilityId, selected.id);
      remove = false;
      revision++;
      message = "人員已刪除";
    } catch (e) {
      error = apiMessage(e, "人員刪除失敗");
    } finally {
      busy = false;
    }
  }
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <h2 class="font-semibold">人員列表</h2>
    <div class="flex gap-2">
      <NativeSelect.Root
        aria-label="篩選人員角色"
        bind:value={role}
        class="w-full"
      >
        <NativeSelect.Option value="">
          全部角色
        </NativeSelect.Option>{#each Object.entries(roles) as [key, label] (key)}<NativeSelect.Option
            value={key}
          >
            {label}
          </NativeSelect.Option>{/each}
      </NativeSelect.Root><Button
        onclick={() => {
          selected = null;
          editor = true;
        }}
      >
        <Plus class="size-4" />新增人員
      </Button>
    </div>
  </div>
  <Feedback {error} {message} />{#if error}<Button
      variant="outline"
      onclick={() => revision++}
    >
      重試人員列表
    </Button>{/if}{#if loading}<AdminSkeleton
      label="載入人員中…"
      variant="cards"
    />{:else if !error}<div class="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
      {#each rows.filter((p) => !role || p.role === role) as p (p.id)}
        <Card.Root
          role="article"
          class="gap-0 overflow-hidden py-0 shadow-sm transition-shadow hover:shadow-md"
        >
          <Card.Header class="gap-4 p-5 pb-0">
            <div class="flex items-start gap-3">
              <Avatar.Root class="size-14 rounded-2xl">
                <Avatar.Image
                  src={p.avatar_url ?? undefined}
                  alt={p.name}
                  class="object-cover"
                /><Avatar.Fallback
                  class="rounded-2xl bg-primary/8 text-xl font-medium text-primary"
                >
                  {p.name.slice(0, 1)}
                </Avatar.Fallback>
              </Avatar.Root>
              <div class="min-w-0 flex-1">
                <h3 class="truncate text-base font-semibold">{p.name}</h3>
                <p class="mt-1 text-xs text-muted-foreground">
                  {roles[p.role]}
                </p>
              </div>
              <Badge
                variant={p.is_active ? "secondary" : "outline"}
                class="mt-0.5 h-6"
              >
                {p.is_active ? "啟用" : "停用"}
              </Badge>
            </div>
          </Card.Header><Card.Content class="space-y-4 p-5">
            <div class="flex flex-wrap gap-2">
              <Badge
                variant={p.is_bookable ? "outline" : "secondary"}
                class="h-6 font-normal"
              >
                {p.is_bookable ? "開放預約" : "暫停預約"}
              </Badge><Badge
                variant="outline"
                class="h-6 font-normal text-muted-foreground"
              >
                {p.is_public_visible ? "公開顯示" : "不公開"}
              </Badge>
            </div>
            <div class="space-y-2.5 text-xs text-muted-foreground">
              <p class="flex items-center gap-2">
                <Phone class="size-3.5 shrink-0" />{p.phone || "電話未填"}
              </p>
              <p class="flex items-center gap-2">
                <Mail class="size-3.5 shrink-0" />
                <span class="truncate">{p.email || "信箱未填"}</span>
              </p>
            </div>
          </Card.Content><Card.Footer
            class="flex-wrap gap-2 border-t border-border/60 bg-muted/15 p-4"
          >
            <Button
              variant="outline"
              size="sm"
              class="gap-1.5"
              onclick={() => {
                selected = p;
                editor = true;
              }}
            >
              檔案與編輯<ArrowRight class="size-3" />
            </Button>{#if ["doctor", "beautician", "therapist"].includes(p.role)}<Button
                variant="ghost"
                size="sm"
                class="gap-1.5 text-muted-foreground"
                onclick={() => {
                  selected = p;
                  tool = "services";
                }}
              >
                <BriefcaseBusiness class="size-3.5" />服務對應
              </Button><Button
                variant="ghost"
                size="sm"
                class="gap-1.5 text-muted-foreground"
                onclick={() => {
                  selected = p;
                  tool = "leaves";
                }}
              >
                <CalendarOff class="size-3.5" />休假管理
              </Button>{/if}<Button
              variant="ghost"
              size="icon-sm"
              class="ml-auto text-muted-foreground hover:text-destructive"
              aria-label={"刪除人員 " + p.name}
              onclick={() => {
                error = "";
                selected = p;
                remove = true;
              }}
            >
              <Trash2 class="size-3.5" />
            </Button>
          </Card.Footer>
        </Card.Root>
      {:else}<Empty.Root
          class="col-span-full rounded-3xl bg-card py-14 ring-1 ring-foreground/5"
        >
          <Empty.Header>
            <Empty.Media variant="icon"><UsersRound /></Empty.Media><Empty.Title
            >
              尚無符合的人員
            </Empty.Title><Empty.Description>
              新增團隊成員，設定他們提供的服務與可預約時間。
            </Empty.Description>
          </Empty.Header><Empty.Content>
            <Button
              onclick={() => {
                selected = null;
                editor = true;
              }}
            >
              <Plus class="size-4" />新增人員
            </Button>
          </Empty.Content>
        </Empty.Root>{/each}
    </div>{/if}
</div>
{#if editor}<StaffEditor
    bind:open={editor}
    {facilityId}
    staff={selected}
    onSaved={() => {
      revision++;
      message = "人員資料已更新";
    }}
  />{/if}
{#if tool && selected}{#key tool + selected.id}<StaffTools
      open={true}
      onClose={() => (tool = null)}
      mode={tool}
      staff={selected}
      {facilityId}
    />{/key}{/if}
<Modal
  bind:open={remove}
  title="刪除人員"
  description={"確認刪除「" + (selected?.name ?? "") + "」？此操作無法復原。"}
  {busy}
>
  <Feedback {error} />
  <div class="mt-4 flex justify-end gap-2">
    <Button variant="outline" disabled={busy} onclick={() => (remove = false)}>
      取消
    </Button><Button
      variant="destructive"
      disabled={busy}
      onclick={deleteStaff}
    >
      確認刪除
    </Button>
  </div>
</Modal>

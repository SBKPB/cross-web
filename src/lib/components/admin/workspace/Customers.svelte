<script lang="ts">
  import AdminSkeleton from "../layout/AdminSkeleton.svelte";
  import * as Card from "#lib/components/ui/card/index.ts";
  import * as Table from "#lib/components/ui/table/index.ts";
  import * as Avatar from "#lib/components/ui/avatar/index.ts";
  import * as Empty from "#lib/components/ui/empty/index.ts";
  import { Badge } from "#lib/components/ui/badge/index.ts";
  import {
    UsersRound,
    Search,
    ArrowUpRight,
    CalendarPlus,
    ArrowLeft,
    ArrowRight,
  } from "@lucide/svelte";
  import * as Field from "#lib/components/ui/field/index.ts";
  import { Checkbox } from "#lib/components/ui/checkbox/index.ts";
  const formId = $props.id();

  import { adminClinicsApi } from "#lib/api/admin/clinics.ts";
  import { apiMessage } from "#lib/admin/scheduling.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import type { ApiPatientListItem } from "#lib/types/clinic.ts";
  import PatientDetail from "../manage/PatientDetail.svelte";
  import BookingDialog from "./BookingDialog.svelte";
  let { facilityId }: { facilityId: string } = $props();
  let search = $state(""),
    inactive = $state(false),
    rows = $state<ApiPatientListItem[]>([]),
    error = $state(""),
    loading = $state(false),
    revision = $state(0),
    offset = $state(0),
    selected = $state<string | null>(null),
    seed = $state<ApiPatientListItem | null>(null),
    booking = $state(false),
    message = $state("");
  $effect(() => {
    const q = search.trim(),
      id = facilityId,
      include_inactive = inactive,
      r = revision,
      o = offset;
    void r;
    let active = true;
    loading = true;
    error = "";
    const timer = setTimeout(() => {
      adminClinicsApi.patients
        .list(id, { q: q || undefined, include_inactive, limit: 50, offset: o })
        .then((data) => {
          if (active) rows = data;
        })
        .catch((e) => {
          if (active) error = apiMessage(e, "客戶名單載入失敗，請重試");
        })
        .finally(() => {
          if (active) loading = false;
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  });
</script>

{#snippet actions(p: ApiPatientListItem)}<Button
    variant="outline"
    size="sm"
    onclick={() => (selected = p.id)}
    aria-label={"查看" + p.name + "的客戶檔案"}
  >
    查看檔案<ArrowUpRight class="size-3.5" />
  </Button>{#if p.is_active}<Button
      size="sm"
      variant="ghost"
      class="gap-1.5 text-primary"
      onclick={() => {
        seed = p;
        booking = true;
      }}
      aria-label={"為" + p.name + "再次預約"}
    >
      <CalendarPlus class="size-3.5" />再次預約
    </Button>{/if}{/snippet}
<div class="space-y-7">
  <div>
    <p class="mb-2 text-xs font-medium text-muted-foreground">
      認識每一位到訪的客戶
    </p>
    <h1 class="text-2xl font-semibold tracking-tight">客戶管理</h1>
    <p class="mt-2 text-sm leading-6 text-muted-foreground">
      維護聯絡資料、回顧到訪紀錄，輕鬆安排下一次服務。
    </p>
  </div>
  <Card.Root class="gap-0 py-0 shadow-sm">
    <Card.Header class="gap-5 p-5 sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <span
            class="grid size-9 place-items-center rounded-2xl bg-primary/8 text-primary"
          >
            <UsersRound class="size-4" />
          </span>
          <h2 class="text-sm font-semibold">客戶名單</h2>
          <Badge variant="secondary" class="font-normal">
            本頁 {rows.length} 位
          </Badge>
        </div>
        <Field.Field orientation="horizontal" class="w-auto items-center gap-2">
          <Checkbox
            id={formId + "-inactive"}
            bind:checked={inactive}
            onCheckedChange={() => (offset = 0)}
          /><Field.Label
            for={formId + "-inactive"}
            class="text-xs font-normal text-muted-foreground"
          >
            包含停用客戶
          </Field.Label>
        </Field.Field>
      </div>
      <Field.Field class="max-w-md gap-2">
        <Field.Label
          for="customer-search"
          class="text-xs text-muted-foreground"
        >
          姓名、電話或身分證
        </Field.Label>
        <div class="relative">
          <Search
            class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          /><Input
            id="customer-search"
            class="h-10 pl-10"
            bind:value={search}
            oninput={() => (offset = 0)}
            placeholder="搜尋既有客戶"
          />
        </div>
      </Field.Field>
    </Card.Header>
    {#if error}<div class="px-6 pb-5">
        <p
          role="alert"
          class="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}<Button
            class="ml-2"
            variant="outline"
            onclick={() => revision++}
          >
            重試客戶名單
          </Button>
        </p>
      </div>{/if}
    {#if message}<p
        role="status"
        class="mx-6 mb-5 rounded-2xl bg-primary/8 p-3 text-sm text-primary"
      >
        {message}
      </p>{/if}
    {#if loading}<AdminSkeleton
        label="正在搜尋客戶…"
        variant="table"
      />{:else if !error}
      {#if rows.length}<div class="hidden border-t border-border/60 md:block">
          <Table.Root>
            <Table.Header class="bg-muted/35">
              <Table.Row>
                <Table.Head class="pl-6">客戶</Table.Head><Table.Head>
                  聯絡與識別
                </Table.Head><Table.Head>預約紀錄</Table.Head><Table.Head>
                  最近預約
                </Table.Head><Table.Head class="pr-6 text-right">
                  操作
                </Table.Head>
              </Table.Row>
            </Table.Header><Table.Body>
              {#each rows as p (p.id)}<Table.Row>
                  <Table.Cell class="pl-6">
                    <div class="flex items-center gap-3">
                      <Avatar.Root class="size-10 rounded-2xl">
                        <Avatar.Fallback
                          class="rounded-2xl bg-primary/7 text-sm text-primary"
                        >
                          {p.name.slice(0, 1)}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <div>
                        <button
                          class="font-semibold hover:text-primary"
                          onclick={() => (selected = p.id)}
                        >
                          {p.name}
                        </button>
                        {#if !p.is_active}<Badge variant="outline" class="ml-2">
                            停用
                          </Badge>{/if}
                        <p class="mt-1 text-xs text-muted-foreground">
                          {p.member_linked ? "已綁定會員" : "現場客戶"}
                        </p>
                      </div>
                    </div>
                  </Table.Cell><Table.Cell>
                    <p class="text-sm">{p.phone || "電話未填"}</p>
                    <p class="mt-1 text-xs text-muted-foreground">
                      身分證末四碼 {p.national_id_last4 ?? "未記錄"}
                    </p>
                  </Table.Cell><Table.Cell>
                    <p class="text-sm">共 {p.appointment_count} 次</p>
                    <p class="mt-1 text-xs text-muted-foreground">
                      未到 {p.no_show_count} 次
                    </p>
                  </Table.Cell><Table.Cell
                    class="text-sm tabular-nums text-muted-foreground"
                  >
                    {p.last_visit_date ?? "未記錄"}
                  </Table.Cell><Table.Cell class="pr-6">
                    <div class="flex justify-end gap-1">
                      {@render actions(p)}
                    </div>
                  </Table.Cell>
                </Table.Row>{/each}
            </Table.Body>
          </Table.Root>
        </div>
        <ul
          class="divide-y divide-border/60 border-t border-border/60 md:hidden"
        >
          {#each rows as p (p.id)}<li class="space-y-4 p-5">
              <div class="flex items-center gap-3">
                <Avatar.Root class="size-10 rounded-2xl">
                  <Avatar.Fallback
                    class="rounded-2xl bg-primary/7 text-sm text-primary"
                  >
                    {p.name.slice(0, 1)}
                  </Avatar.Fallback>
                </Avatar.Root>
                <div class="min-w-0">
                  <button
                    class="text-left font-semibold hover:text-primary"
                    onclick={() => (selected = p.id)}
                  >
                    {p.name}{p.is_active ? "" : "（停用）"}
                  </button>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {p.phone || "電話未填"} · 身分證末四碼 {p.national_id_last4 ??
                      "未記錄"}
                  </p>
                </div>
              </div>
              <p class="text-xs text-muted-foreground">
                最近預約 {p.last_visit_date ?? "未記錄"} · 共 {p.appointment_count}
                次 · 未到 {p.no_show_count} 次
              </p>
              <div class="flex flex-wrap gap-2">{@render actions(p)}</div>
            </li>{/each}
        </ul>
      {:else}<Empty.Root class="border-t border-border/60 py-14">
          <Empty.Header>
            <Empty.Media variant="icon"><UsersRound /></Empty.Media><Empty.Title
            >
              {search ? "找不到符合的客戶" : "尚無客戶資料"}
            </Empty.Title><Empty.Description>
              {search
                ? "試著調整搜尋條件，或確認客戶是否已停用。"
                : "第一筆預約建立後，客戶資料會整理在這裡。"}
            </Empty.Description>
          </Empty.Header>{#if search}<Empty.Content>
              <Button
                variant="outline"
                onclick={() => {
                  search = "";
                  offset = 0;
                }}
              >
                清除客戶搜尋
              </Button>
            </Empty.Content>{/if}
        </Empty.Root>{/if}
      <Card.Footer
        class="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-4"
      >
        <p class="text-xs text-muted-foreground">
          第 {Math.floor(offset / 50) + 1} 頁 · 每頁最多 50 位
        </p>
        <div class="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={offset === 0}
            onclick={() => (offset = Math.max(0, offset - 50))}
          >
            <ArrowLeft class="size-3.5" />上一頁
          </Button><Button
            size="sm"
            variant="outline"
            disabled={rows.length < 50}
            onclick={() => (offset += 50)}
          >
            下一頁<ArrowRight class="size-3.5" />
          </Button>
        </div>
      </Card.Footer>{/if}
  </Card.Root>
</div>
{#if selected}<PatientDetail
    {facilityId}
    patientId={selected}
    onClose={() => (selected = null)}
    onSaved={() => revision++}
  />{/if}
<BookingDialog
  bind:open={booking}
  {facilityId}
  patient={seed}
  onCreated={() => {
    message = "預約已建立";
    revision++;
  }}
/>

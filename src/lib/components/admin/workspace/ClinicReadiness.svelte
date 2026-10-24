<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { CircleCheck, CircleHelp, ArrowUpRight } from "@lucide/svelte";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { adminClinicsApi } from "#lib/api/admin/clinics.ts";
  import { bookingApi } from "#lib/api/booking.ts";
  import {
    loadBookingCatalog,
    clinicHref,
    type BookingCatalog,
  } from "#lib/admin/workspace.ts";
  import { canAccessFeature } from "#lib/feature-access.ts";
  import type { MedicalFacility } from "#lib/types/clinic.ts";
  let {
    facility,
    subscriptionHref,
  }: { facility: MedicalFacility; subscriptionHref: string } = $props();
  let catalog = $state.raw<BookingCatalog | null>(null);
  let busy = $state(false),
    error = $state(""),
    checked = $state(false);
  let scheduleCount = $state<number | null>(null);
  let slotsAvailable = $state<boolean | null>(null);
  let slotsError = $state(false);
  let expanded = $state(false);
  onMount(() => { expanded = !facility.is_active; });
  let active = true;
  onDestroy(() => {
    active = false;
  });
  const online = $derived(canAccessFeature(facility, "online_booking"));
  const hasPair = $derived(
    !!catalog &&
      catalog.staff.some(
        (staff) =>
          staff.is_public_visible &&
          catalog!.assignments[staff.id]?.some((id) =>
            catalog!.services.some((service) => service.id === id),
          ),
      ),
  );
  async function refresh() {
    if (busy) return;
    busy = true;
    error = "";
    checked = false;
    slotsAvailable = null;
    slotsError = false;
    scheduleCount = null;
    catalog = null;
    try {
      const day = (offset: number) =>
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Taipei",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(Date.now() + offset * 86400000));
      const [data, schedules] = await Promise.all([
        loadBookingCatalog(facility.id),
        adminClinicsApi.schedules.listAll(facility.id, {
          start_date: day(0),
          end_date: day(30),
        }),
      ]);
      if (!active) return;
      catalog = data;
      scheduleCount = schedules.length;
      if (facility.is_active && online && data.services.length) {
        let cursor = 0,
          found = false,
          failed = false;
        await Promise.all(
          Array.from(
            { length: Math.min(3, data.services.length) },
            async () => {
              while (!found && cursor < data.services.length && active) {
                const service = data.services[cursor++];
                try {
                  const dates = await bookingApi.getAvailableSlots(
                    facility.id,
                    service.id,
                    null,
                  );
                  if (
                    dates.some((date) =>
                      date.slots.some((slot) => slot.isAvailable),
                    )
                  )
                    found = true;
                } catch {
                  failed = true;
                }
              }
            },
          ),
        );
        if (!active) return;
        slotsAvailable = found ? true : failed ? null : false;
        slotsError = failed && !found;
      }
      checked = true;
    } catch {
      if (active) error = "無法取得完整設定狀態，請重試。";
    } finally {
      if (active) busy = false;
    }
  }
  const items = $derived([
    {
      title: "院所介紹與 Logo",
      done: !!(facility.description?.trim() && facility.logo_url),
      text: "讓客人認識院所與品牌。",
      href: clinicHref(facility.id, "info"),
    },
    {
      title: "公開上架狀態",
      done: facility.is_active,
      text: facility.is_active
        ? "院所已啟用，可查看公開頁。"
        : "尚未啟用，請確認審核進度或院所停用狀態。",
      href: clinicHref(facility.id, "info"),
    },
    {
      title: "啟用服務項目",
      done: checked ? !!catalog?.services.length : null,
      text: "確認諮詢／療程、時長與價格公開設定。",
      href: clinicHref(facility.id, "services"),
    },
    {
      title: "可預約人員與服務對應",
      done: checked ? hasPair : null,
      text: "確認對外公開且可接受預約的人員，並指定可提供的服務。",
      href: clinicHref(facility.id, "personnel"),
    },
    {
      title: "未來 30 天班表",
      done: checked ? !!scheduleCount : null,
      text: "排班後仍須確認休假、營業時間及剩餘名額。",
      href: clinicHref(facility.id, "schedule"),
    },
    {
      title: "線上預約方案",
      done: online,
      text: online
        ? "目前具線上預約功能資格。"
        : "免費版可展示門面與處理電話／現場代訂；線上預約需有效方案或試用資格。",
      href: subscriptionHref,
    },
    {
      title: "實際可預約時段",
      done: slotsAvailable,
      text:
        !facility.is_active || !online
          ? "院所啟用並具方案資格後才能檢查。"
          : slotsError
            ? "時段讀取失敗，請重新檢查。"
            : slotsAvailable === false
              ? "目前查詢範圍內沒有可預約時段，請確認服務、人員與班表。"
              : slotsAvailable
                ? "已找到可預約時段；名額以客人送出時為準。"
                : "檢查服務、人員、休假與剩餘名額後的實際結果。",
      href: `/clinic/${facility.id}`,
    },
  ]);
</script>

<details
  bind:open={expanded}
  class="rounded-2xl border border-border bg-card p-5"
  ontoggle={(event) => {
    if (event.currentTarget.open && !checked && !busy) void refresh();
  }}
>
  <summary class="cursor-pointer text-base font-semibold">
    院所門面與預約上線檢查
  </summary>
  <div class="mt-4 space-y-4">
    <p class="text-sm leading-6 text-muted-foreground">
      先完成公開門面，再確認線上預約。帳號開通、院所上架與可預約時段是不同狀態。
    </p>
    <div class="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        class="min-h-11"
        disabled={busy}
        onclick={refresh}
      >
        {busy ? "正在檢查…" : "重新檢查設定"}
      </Button><Button
        href={`/clinic/${facility.id}`}
        target="_blank"
        rel="noopener noreferrer"
        variant="ghost"
        class="min-h-11"
      >
        查看客人看到的門面<ArrowUpRight class="size-4" />
        <span class="sr-only">（另開視窗）</span>
      </Button>
    </div>
    {#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}
    <ul class="grid gap-3 lg:grid-cols-2" aria-busy={busy}>
      {#each items as item (item.title)}
        <li class="flex items-start gap-3 rounded-xl border p-4">
          {#if item.done}<CircleCheck
              class="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />{:else}<CircleHelp
              class="mt-0.5 size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />{/if}
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold">
              {item.title}
              <span class="ml-2 text-xs font-normal text-muted-foreground">
                {item.done === true
                  ? "已確認"
                  : item.done === false
                    ? "待處理"
                    : "待確認"}
              </span>
            </p>
            <p class="mt-1 text-sm leading-6 text-muted-foreground">
              {item.text}
            </p>
            <a
              href={item.href}
              class="mt-1 inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
            >
              {item.title === "實際可預約時段"
                ? "查看預約方式"
                : "前往查看與設定"}
            </a>
          </div>
        </li>
      {/each}
    </ul>
  </div>
</details>

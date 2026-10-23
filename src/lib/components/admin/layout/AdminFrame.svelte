<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    LayoutDashboard,
    CalendarDays,
    ListOrdered,
    Users,
    CalendarClock,
    ChartNoAxesCombined,
    Settings2,
    CreditCard,
    Building2,
    ClipboardCheck,
    Tags,
    MoreHorizontal,
    LogOut,
    KeyRound,
    ArrowUpRight,
  } from "@lucide/svelte";
  import * as Sheet from "#lib/components/ui/sheet/index.ts";

  import { Menu, X } from "@lucide/svelte";

  import * as Avatar from "#lib/components/ui/avatar/index.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { getAuth } from "#lib/auth/auth.svelte.ts";
  import ThemeToggle from "#lib/components/ThemeToggle.svelte";
  import Password from "../manage/Password.svelte";
  type Item = { key: string; label: string; href: string };
  let {
    heading,
    facilityName = "",
    system = false,
    activeKey,
    groups,
    children,
    actions,
    mobile = [],
  }: {
    heading: string;
    facilityName?: string;
    system?: boolean;
    activeKey: string;
    groups: { label: string; items: Item[] }[];
    children: Snippet;
    actions?: Snippet;
    mobile?: Item[];
  } = $props();
  const auth = getAuth();
  let menuOpen = $state(false);
  const icons: Record<string, typeof LayoutDashboard> = {
    today: LayoutDashboard,
    dashboard: LayoutDashboard,
    appointments: CalendarDays,
    queue: ListOrdered,
    patients: Users,
    schedule: CalendarClock,
    analytics: ChartNoAxesCombined,
    info: Settings2,
    subscription: CreditCard,
    clinics: Building2,
    users: Users,
    applications: ClipboardCheck,
    settings: Tags,
  };
  let password = $state(false);
  const userName = $derived(
    auth.user?.display_name || auth.user?.email || "管理員",
  );
  const role = $derived(
    system
      ? "平台管理員"
      : auth.user?.roles.includes("facility_admin")
        ? "院所管理員"
        : "院所員工",
  );
</script>

{#snippet navigation()}
  <div class="flex h-full w-full flex-col bg-card p-4 text-foreground">
    <header class="space-y-5 pb-6">
      <a href="/admin/dashboard" class="flex items-center gap-3 p-2">
        <span
          class="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"
        >
          <img src="/cross-icon.png" width="32" height="32" alt="" />
        </span>
        <span>
          <strong class="text-lg tracking-tight">Cross</strong>
          <span class="mt-0.5 block text-xs text-muted-foreground">
            {system ? "平台營運管理" : "院所預約管理"}
          </span>
        </span>
      </a>
      {#if facilityName}<div
          class="rounded-2xl border border-border bg-background p-3"
        >
          <p class="mb-1 text-[11px] text-muted-foreground">目前院所</p>
          <p class="truncate text-sm font-semibold">{facilityName}</p>
        </div>{/if}
    </header>
    <nav
      class="min-h-0 flex-1 overflow-y-auto"
      aria-label={system ? "平台管理導覽" : "後台主要導覽"}
    >
      {#each groups as group (group.label)}
        <section class="mb-6">
          <p class="mb-2 px-3 text-[11px] font-medium text-muted-foreground">
            {group.label}
          </p>
          <div class="space-y-1">
            {#each group.items as item (item.key)}{@const Icon =
                icons[item.key] ?? Settings2}
              <a
                href={item.href}
                aria-current={activeKey === item.key ? "page" : undefined}
                onclick={() => (menuOpen = false)}
                class="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors {activeKey ===
                item.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted hover:text-foreground'}"
              >
                <Icon class="size-[18px]" strokeWidth={1.7} />
                <span>{item.label}</span>
              </a>
            {/each}
          </div>
        </section>
      {/each}
      {#if system && facilityName}<Button
          href="/admin/clinics"
          variant="outline"
          class="w-full"
        >
          <ArrowUpRight class="size-4" />返回平台院所管理
        </Button>{/if}
    </nav>
    <footer class="mt-4 space-y-4 border-t border-border pt-4">
      <div class="flex min-w-0 items-center gap-3">
        <Avatar.Root class="size-10">
          <Avatar.Fallback>
            {userName.slice(0, 1).toUpperCase()}
          </Avatar.Fallback>
        </Avatar.Root>
        <div class="min-w-0">
          <p class="truncate text-xs font-semibold">{userName}</p>
          <p class="mt-1 text-[11px] text-muted-foreground">{role}</p>
        </div>
      </div>
      <div class="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          class="flex-1 text-xs"
          onclick={() => (password = true)}
        >
          <KeyRound class="size-3.5" />修改密碼
        </Button><Button
          variant="ghost"
          size="sm"
          class="flex-1 text-xs"
          onclick={() => auth.logout("/admin/login")}
        >
          <LogOut class="size-3.5" />登出
        </Button>
      </div>
    </footer>
  </div>
{/snippet}
<div class="flex min-h-dvh">
  <aside
    class="sticky top-0 hidden h-dvh w-[16.5rem] shrink-0 border-r border-border md:block"
  >
    {@render navigation()}
  </aside>
  <div class="flex min-w-0 flex-1 flex-col">
    <header
      class="sticky top-0 z-30 flex h-[4.75rem] shrink-0 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur md:px-8"
    >
      <div class="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          class="md:hidden"
          aria-label={system ? "開啟平台選單" : "開啟後台選單"}
          onclick={() => (menuOpen = true)}
        >
          <Menu class="size-5" />
        </Button>
        <div class="min-w-0">
          <p class="hidden text-[11px] text-muted-foreground md:block">
            {system ? "平台管理" : "院所工作區"}
          </p>
          <p class="truncate text-sm font-semibold md:mt-1">{heading}</p>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <ThemeToggle />{#if actions}{@render actions()}{:else}<Button
            href="/"
            variant="outline"
            size="sm"
          >
            <ArrowUpRight class="size-4" />
            <span class="hidden sm:inline">查看網站</span>
          </Button>{/if}
      </div>
    </header>
    <main
      class="admin-canvas mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 py-6 pb-28 sm:px-6 md:px-8 md:py-8 md:pb-10 lg:px-10"
    >
      {@render children()}
    </main>
  </div>
</div>
<Sheet.Root bind:open={menuOpen}>
  <Sheet.Content
    side="left"
    class="fixed inset-y-0 left-0 h-dvh max-h-dvh w-[18rem] max-w-[calc(100%-3rem)] gap-0 rounded-none p-0"
    showCloseButton={false}
  >
    <Sheet.Title class="sr-only">
      {system ? "平台管理選單" : "院所管理選單"}
    </Sheet.Title><Sheet.Description class="sr-only">
      選擇要操作的功能
    </Sheet.Description><Button
      class="absolute top-4 right-3 z-10"
      variant="ghost"
      size="icon-sm"
      aria-label="關閉選單"
      onclick={() => (menuOpen = false)}
    >
      <X class="size-4" />
    </Button>{@render navigation()}
  </Sheet.Content>
</Sheet.Root>
{#if mobile.length}<div
    class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    role="navigation"
    aria-label="手機後台主要導覽"
  >
    <div class="grid grid-cols-4 gap-1">
      {#each mobile.slice(0, 3) as item (item.key)}{@const Icon =
          icons[item.key] ?? CalendarDays}
        <a
          href={item.href}
          aria-current={activeKey === item.key ? "page" : undefined}
          class="flex flex-col items-center gap-1.5 rounded-xl py-3 text-[11px] font-medium {activeKey ===
          item.key
            ? 'text-primary'
            : 'text-muted-foreground'}"
        >
          <Icon class="size-5" />{item.label}
        </a>{/each}
      <button
        class="flex flex-col items-center gap-1.5 py-3 text-[11px] text-muted-foreground"
        onclick={() => (menuOpen = true)}
      >
        <MoreHorizontal class="size-5" />更多
      </button>
    </div>
  </div>{/if}
{#if password}<Password bind:open={password} />{/if}

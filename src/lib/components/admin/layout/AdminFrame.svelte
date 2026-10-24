<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import { afterNavigate } from "$app/navigation";
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
    PanelLeftClose,
    PanelLeftOpen,
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
  let collapsed = $state(false);
  let manualSidebar = false;
  const sidebarId = $props.id();
  const clinicWorkspace = $derived(
    groups.some((group) => group.items.some((item) => item.key === "today")),
  );
  const homeHref = $derived(
    groups
      .flatMap((group) => group.items)
      .find((item) => item.key === "today" || item.key === "dashboard")?.href ??
      "/admin/dashboard",
  );
  const otherMobilePage = $derived(
    !mobile.slice(0, 3).some((item) => item.key === activeKey),
  );
  onMount(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const desktop = window.matchMedia("(min-width: 768px)");
    try {
      const saved = localStorage.getItem("cross_admin_sidebar_collapsed");
      manualSidebar = saved === "true" || saved === "false";
      collapsed = manualSidebar ? saved === "true" : !wide.matches;
    } catch {
      collapsed = !wide.matches;
    }
    const resize = () => {
      if (!manualSidebar) collapsed = !wide.matches;
      if (desktop.matches) menuOpen = false;
    };
    wide.addEventListener("change", resize);
    desktop.addEventListener("change", resize);
    return () => {
      wide.removeEventListener("change", resize);
      desktop.removeEventListener("change", resize);
    };
  });
  afterNavigate(() => {
    menuOpen = false;
  });
  function toggleSidebar() {
    manualSidebar = true;
    collapsed = !collapsed;
    try {
      localStorage.setItem("cross_admin_sidebar_collapsed", String(collapsed));
    } catch {
      /* 儲存受限時仍可在本頁收合。 */
    }
  }
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

{#snippet navigation(compact: boolean)}
  <div
    class="flex h-full min-h-0 w-full flex-col bg-sidebar px-3 py-4 text-sidebar-foreground"
    data-sidebar-compact={compact}
  >
    <header class="shrink-0 space-y-4 pb-5">
      <a
        href={homeHref}
        aria-label={clinicWorkspace ? "Cross · 今日工作台" : "Cross · 平台總覽"}
        title={compact ? "Cross · 工作台" : undefined}
        onclick={() => (menuOpen = false)}
        class={compact
          ? "mx-auto flex size-11 items-center justify-center rounded-xl focus-visible:outline-2 focus-visible:outline-sidebar-ring"
          : "flex min-h-11 items-center gap-3 rounded-xl px-2 pr-10 focus-visible:outline-2 focus-visible:outline-sidebar-ring md:pr-2"}
      >
        <span
          class="grid size-10 shrink-0 place-items-center rounded-xl border border-sidebar-border bg-background"
        >
          <img src="/cross-icon.png" width="28" height="28" alt="" />
        </span>
        <span class={compact ? "sr-only" : "min-w-0"}>
          <strong class="text-lg tracking-tight text-foreground">Cross</strong>
          <span class="mt-0.5 block text-[11px] text-muted-foreground">
            {clinicWorkspace ? "院所預約管理" : "平台營運管理"}
          </span>
        </span>
      </a>
      {#if facilityName}
        <div
          title={facilityName}
          class={compact
            ? "mx-auto grid size-10 place-items-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground"
            : "flex items-center gap-2.5 rounded-xl border border-sidebar-border bg-background/60 px-3 py-3"}
        >
          <Building2
            class="size-[18px] shrink-0 text-sidebar-accent-foreground"
            aria-hidden="true"
          />
          <div class={compact ? "sr-only" : "min-w-0"}>
            <p class="text-[10px] text-muted-foreground">目前院所</p>
            <p class="mt-1 truncate text-xs font-semibold text-foreground">
              {facilityName}
            </p>
          </div>
        </div>
      {/if}
    </header>
    <nav
      class="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]"
      aria-label={system && !clinicWorkspace ? "平台管理導覽" : "後台主要導覽"}
    >
      {#each groups as group, index (group.label)}
        <section class={compact ? "mb-3" : "mb-5"}>
          <p
            class={compact
              ? "sr-only"
              : "mb-2 px-3 text-[11px] font-medium tracking-wide text-muted-foreground"}
          >
            {group.label}
          </p>
          {#if compact && index > 0}<div
              class="mx-auto mb-3 w-6 border-t border-sidebar-border"
              aria-hidden="true"
            ></div>{/if}
          <div class="space-y-1">
            {#each group.items as item (item.key)}{@const Icon =
                icons[item.key] ?? Settings2}
              <a
                href={item.href}
                aria-label={item.label}
                title={compact ? item.label : undefined}
                aria-current={activeKey === item.key ? "page" : undefined}
                onclick={() => (menuOpen = false)}
                class="relative flex min-h-11 items-center rounded-xl text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sidebar-ring {compact
                  ? 'mx-auto w-11 justify-center'
                  : 'gap-3 px-3'} {activeKey === item.key
                  ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
                  : 'font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'}"
              >
                {#if activeKey === item.key}<span
                    class="absolute inset-y-3 left-0 w-[3px] rounded-full bg-sidebar-primary"
                    aria-hidden="true"
                  ></span>{/if}
                <Icon
                  class="size-[18px] shrink-0"
                  strokeWidth={activeKey === item.key ? 2 : 1.7}
                  aria-hidden="true"
                />
                <span class={compact ? "sr-only" : "truncate"}>
                  {item.label}
                </span>
              </a>
            {/each}
          </div>
        </section>
      {/each}
      {#if system && clinicWorkspace}<Button
          href="/admin/clinics"
          variant="outline"
          size={compact ? "icon" : "default"}
          class={compact ? "mx-auto flex size-11" : "min-h-11 w-full text-xs"}
          aria-label="返回平台院所管理"
          title={compact ? "返回平台院所管理" : undefined}
        >
          <ArrowUpRight class="size-4" aria-hidden="true" />
          <span class={compact ? "sr-only" : ""}>返回平台院所管理</span>
        </Button>{/if}
    </nav>
    <footer class="mt-3 shrink-0 space-y-2 border-t border-sidebar-border pt-3">
      <div
        class={compact
          ? "flex justify-center"
          : "flex min-w-0 items-center gap-2.5 px-2"}
        title={userName + " · " + role}
      >
        <Avatar.Root class="size-9 shrink-0">
          <Avatar.Fallback
            class="bg-sidebar-accent text-sidebar-accent-foreground"
          >
            {userName.slice(0, 1).toUpperCase()}
          </Avatar.Fallback>
        </Avatar.Root>
        <div class={compact ? "sr-only" : "min-w-0"}>
          <p class="truncate text-xs font-semibold text-foreground">
            {userName}
          </p>
          <p class="mt-1 text-[10px] text-muted-foreground">{role}</p>
        </div>
      </div>
      <div class={compact ? "flex flex-col items-center gap-1" : "flex gap-1"}>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          class={compact ? "size-11" : "min-h-11 flex-1 gap-1.5 text-xs"}
          aria-label="修改密碼"
          title={compact ? "修改密碼" : undefined}
          onclick={() => {
            menuOpen = false;
            password = true;
          }}
        >
          <KeyRound class="size-4" aria-hidden="true" />
          <span class={compact ? "sr-only" : ""}>修改密碼</span>
        </Button>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          class={compact
            ? "size-11 hover:bg-destructive/10 hover:text-destructive"
            : "min-h-11 flex-1 gap-1.5 text-xs hover:bg-destructive/10 hover:text-destructive"}
          aria-label="登出"
          title={compact ? "登出" : undefined}
          onclick={() => auth.logout("/admin/login")}
        >
          <LogOut class="size-4" aria-hidden="true" />
          <span class={compact ? "sr-only" : ""}>登出</span>
        </Button>
      </div>
    </footer>
  </div>
{/snippet}
<div class="flex min-h-dvh">
  <aside
    id={`${sidebarId}-desktop-sidebar`}
    aria-label={clinicWorkspace ? "院所側邊欄" : "平台側邊欄"}
    data-collapsed={collapsed}
    class="sticky top-0 hidden h-dvh shrink-0 border-r border-sidebar-border transition-[width] duration-200 motion-reduce:transition-none md:block {collapsed
      ? 'w-20'
      : 'w-[16.5rem]'}"
  >
    {@render navigation(collapsed)}
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
          aria-label={system && !clinicWorkspace
            ? "開啟平台選單"
            : "開啟後台選單"}
          aria-expanded={menuOpen}
          onclick={() => (menuOpen = true)}
        >
          <Menu class="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="hidden size-11 md:inline-flex"
          aria-label={collapsed ? "展開側邊欄" : "收合側邊欄"}
          title={collapsed ? "展開側邊欄" : "收合側邊欄"}
          aria-expanded={!collapsed}
          aria-controls={`${sidebarId}-desktop-sidebar`}
          onclick={toggleSidebar}
        >
          {#if collapsed}<PanelLeftOpen
              class="size-5"
              aria-hidden="true"
            />{:else}<PanelLeftClose class="size-5" aria-hidden="true" />{/if}
        </Button>
        <div class="min-w-0">
          <p class="hidden text-[11px] text-muted-foreground md:block">
            {clinicWorkspace ? "院所工作區" : "平台管理"}
          </p>
          <p class="truncate text-sm font-semibold md:mt-1">{heading}</p>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <ThemeToggle />{#if actions}{@render actions()}{:else}<Button
            href="/"
            aria-label="查看網站"
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
      {system && !clinicWorkspace ? "平台管理選單" : "院所管理選單"}
    </Sheet.Title><Sheet.Description class="sr-only">
      選擇要操作的功能
    </Sheet.Description><Button
      class="absolute top-4 right-3 z-10 size-11"
      variant="ghost"
      size="icon-sm"
      aria-label="關閉選單"
      onclick={() => (menuOpen = false)}
    >
      <X class="size-4" />
    </Button>{@render navigation(false)}
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
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-muted-foreground'}"
        >
          <Icon class="size-5" />{item.label}
        </a>{/each}
      <button
        class="flex flex-col items-center gap-1.5 rounded-xl py-3 text-[11px] font-medium {otherMobilePage
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-muted-foreground'}"
        aria-expanded={menuOpen}
        onclick={() => (menuOpen = true)}
      >
        <MoreHorizontal class="size-5" />更多
      </button>
    </div>
  </div>{/if}
{#if password}<Password bind:open={password} />{/if}

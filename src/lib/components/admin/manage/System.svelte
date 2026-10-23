<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.ts";
  import Clinics from "./Clinics.svelte";
  import Users from "./Users.svelte";
  import Applications from "./Applications.svelte";
  import Categories from "./Categories.svelte";
  import Overview from "./Overview.svelte";
  let { name }: { name: string } = $props();
  const links = [
    ["dashboard", "總覽"],
    ["clinics", "院所管理"],
    ["users", "使用者管理"],
    ["applications", "加入申請"],
    ["settings", "系統設定"],
  ];
  import AdminFrame from "../layout/AdminFrame.svelte";
</script>

<div class="cross-admin min-h-dvh bg-background">
  <AdminFrame
    heading={links.find(([key]) => key === name)?.[1] ?? "營運分析"}
    system
    activeKey={name}
    groups={[
      {
        label: "平台營運",
        items: links
          .slice(0, 4)
          .map(([key, label]) => ({ key, label, href: "/admin/" + key })),
      },
      {
        label: "系統管理",
        items: links
          .slice(4)
          .map(([key, label]) => ({ key, label, href: "/admin/" + key })),
      },
    ]}
  >
    <div data-native-admin="true" class="space-y-7">
      {#if name === "dashboard"}<Overview
        />{:else if name === "clinics"}<Clinics
        />{:else if name === "users"}<Users
        />{:else if name === "applications"}<Applications
        />{:else if name === "settings"}<Categories
        />{:else if name === "analytics"}<div class="space-y-4">
          <h1 class="text-2xl font-semibold tracking-tight">營運分析</h1>
          <p>請從院所管理選擇院所，查看該院所的營運分析。</p>
          <Button href="/admin/clinics">選擇院所</Button>
        </div>{/if}
    </div>
  </AdminFrame>
</div>

<script lang="ts">
  import AdminSkeleton from "../layout/AdminSkeleton.svelte";
  import {
    Building2,
    CircleCheck,
    CreditCard,
    CalendarClock,
    ArrowUpRight,
    ArrowRight,
    Layers3,
  } from "@lucide/svelte";
  import * as Avatar from "#lib/components/ui/avatar/index.ts";
  import * as Table from "#lib/components/ui/table/index.ts";
  import * as Empty from "#lib/components/ui/empty/index.ts";
  import { Badge } from "#lib/components/ui/badge/index.ts";
  import * as Card from "#lib/components/ui/card/index.ts";

  import { adminClinicsApi } from "#lib/api/admin/clinics.ts";
  import { apiMessage } from "#lib/admin/scheduling.ts";
  import {
    PLAN_LABELS,
    isExpired,
    daysUntilExpiry,
  } from "#lib/feature-access.ts";
  import { FACILITY_TYPE_LABELS } from "#lib/constants/clinic-constants.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import Feedback from "./Feedback.svelte";
  import type {
    MedicalFacility,
    SubscriptionPlan,
    FacilityType,
  } from "#lib/types/clinic.ts";
  let rows = $state<MedicalFacility[]>([]),
    loading = $state(true),
    error = $state(""),
    revision = $state(0);
  $effect(() => {
    const r = revision;
    void r;
    let live = true;
    loading = true;
    error = "";
    adminClinicsApi
      .list()
      .then((v) => {
        if (live) rows = v;
      })
      .catch((e) => {
        if (live) error = apiMessage(e, "院所概況載入失敗");
      })
      .finally(() => {
        if (live) loading = false;
      });
    return () => {
      live = false;
    };
  });
  const stats = $derived([
    { label: "總院所數", value: rows.length },
    { label: "啟用中院所", value: rows.filter((f) => f.is_active).length },
    {
      label: "有效付費院所",
      value: rows.filter(
        (f) =>
          f.subscription_plan !== "free" &&
          f.subscription_status === "active" &&
          !isExpired(f.subscription_expires_at),
      ).length,
    },
    {
      label: "7 天內到期",
      value: rows.filter((f) => {
        const d = daysUntilExpiry(f.subscription_expires_at);
        return d !== null && d >= 0 && d <= 7;
      }).length,
    },
  ]);
</script>

<div class="space-y-7">
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="mb-2 text-xs font-medium text-muted-foreground">
        一起讓更多院所的預約更簡單
      </p>
      <h1 class="text-2xl font-semibold tracking-tight">總覽</h1>
      <p class="mt-2 text-sm leading-6 text-muted-foreground">
        掌握合作院所、訂閱狀態與平台的成長。
      </p>
    </div>
    <Button href="/admin/clinics" class="h-10 gap-2 px-5">
      管理院所<ArrowUpRight class="size-4" />
    </Button>
  </div>
  <Feedback {error} />{#if error}<Button
      variant="outline"
      onclick={() => revision++}
    >
      重試總覽
    </Button>{/if}{#if loading}<AdminSkeleton
      label="載入平台概況中…"
      variant="dashboard"
    />{:else if !error}
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
      {#each stats as stat, i (stat.label)}{@const Icon = [
          Building2,
          CircleCheck,
          CreditCard,
          CalendarClock,
        ][i]}<Card.Root class="gap-0 py-0 shadow-sm">
          <Card.Content class="p-4 sm:p-5">
            <div class="mb-4 flex items-center justify-between gap-2">
              <h2 class="text-xs font-medium text-muted-foreground">
                {stat.label}
              </h2>
              <span
                class="grid size-9 place-items-center rounded-2xl bg-primary/7 text-primary"
              >
                <Icon class="size-[18px]" strokeWidth={1.7} />
              </span>
            </div>
            <p
              class="text-[2rem] font-semibold leading-none tracking-tight tabular-nums sm:text-4xl"
            >
              {stat.value}
              <span class="ml-2 text-xs font-normal text-muted-foreground">
                間
              </span>
            </p>
            <p class="mt-4 text-[11px] text-muted-foreground">
              {[
                "平台合作院所總數",
                "已公開提供院所資訊",
                "有效且未過期的付費訂閱",
                "需要安排續約的院所",
              ][i]}
            </p>
          </Card.Content>
        </Card.Root>{/each}
    </div>
    <div class="grid gap-5 lg:grid-cols-2">
      <Card.Root class="gap-5 shadow-sm">
        <Card.Header>
          <div class="flex items-center gap-2 text-primary">
            <CreditCard class="size-4" /><Card.Title
              class="text-sm text-foreground"
            >
              登記方案分布
            </Card.Title>
          </div>
          <Card.Description class="mt-1 text-xs">
            了解合作院所選擇的服務方案
          </Card.Description>
        </Card.Header><Card.Content class="space-y-5">
          {#each Object.entries(PLAN_LABELS) as [key, label] (key)}{@const total =
              rows.filter(
                (f) => f.subscription_plan === (key as SubscriptionPlan),
              ).length}
            <div>
              <div class="mb-2.5 flex items-center justify-between text-xs">
                <span class="font-medium">{label}</span>
                <span class="tabular-nums text-muted-foreground">
                  {total} 間
                </span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full bg-primary/80"
                  style:width={(total / Math.max(1, rows.length)) * 100 + "%"}
                ></div>
              </div>
            </div>{/each}
        </Card.Content>
      </Card.Root>
      <Card.Root class="gap-5 shadow-sm">
        <Card.Header>
          <div class="flex items-center gap-2 text-primary">
            <Layers3 class="size-4" /><Card.Title
              class="text-sm text-foreground"
            >
              院所類型分布
            </Card.Title>
          </div>
          <Card.Description class="mt-1 text-xs">
            依服務類型查看合作組成
          </Card.Description>
        </Card.Header><Card.Content class="grid grid-cols-2 gap-3">
          {#each Object.entries(FACILITY_TYPE_LABELS) as [key, label] (key)}<div
              class="rounded-2xl bg-muted/45 p-4"
            >
              <p class="text-xs text-muted-foreground">{label}</p>
              <p class="mt-2 text-2xl font-semibold tabular-nums">
                {rows.filter((f) => f.facility_type === (key as FacilityType))
                  .length}
                <span
                  class="ml-1 text-[11px] font-normal text-muted-foreground"
                >
                  間
                </span>
              </p>
            </div>{/each}
        </Card.Content>
      </Card.Root>
    </div>
    <Card.Root class="gap-0 overflow-hidden pb-0 shadow-sm">
      <Card.Header class="pb-5">
        <div class="flex items-center justify-between gap-3">
          <div class="space-y-1.5">
            <Card.Title class="text-sm">
              最近加入院所
            </Card.Title><Card.Description class="text-xs">
              歡迎新夥伴，開始安排第一次預約
            </Card.Description>
          </div>
          <Button
            variant="ghost"
            size="sm"
            href="/admin/clinics"
            class="gap-1 text-xs text-muted-foreground"
          >
            查看全部<ArrowRight class="size-3.5" />
          </Button>
        </div>
      </Card.Header>{#if rows.length}<div class="border-t border-border/60">
          <Table.Root>
            <Table.Header class="bg-muted/30">
              <Table.Row>
                <Table.Head class="pl-6">院所</Table.Head><Table.Head
                  class="hidden sm:table-cell"
                >
                  加入日期
                </Table.Head><Table.Head>方案</Table.Head><Table.Head
                  class="pr-6 text-right"
                >
                  狀態
                </Table.Head>
              </Table.Row>
            </Table.Header><Table.Body>
              {#each [...rows]
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .slice(0, 5) as f (f.id)}<Table.Row>
                  <Table.Cell class="pl-6">
                    <a
                      href={"/admin/clinics/" + f.id}
                      class="flex items-center gap-3"
                    >
                      <Avatar.Root class="size-10 rounded-2xl">
                        <Avatar.Image
                          src={f.logo_url ?? undefined}
                          alt={f.name}
                          class="object-contain"
                        /><Avatar.Fallback
                          class="rounded-2xl bg-primary/7 text-sm text-primary"
                        >
                          {f.name.slice(0, 1)}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <span
                        class="max-w-48 truncate text-sm font-semibold hover:text-primary"
                      >
                        {f.name}
                      </span>
                    </a>
                  </Table.Cell><Table.Cell
                    class="hidden text-xs tabular-nums text-muted-foreground sm:table-cell"
                  >
                    {f.created_at.slice(0, 10)}
                  </Table.Cell><Table.Cell>
                    <Badge variant="outline">
                      {PLAN_LABELS[f.subscription_plan]}
                    </Badge>
                  </Table.Cell><Table.Cell class="pr-6 text-right">
                    <Badge variant={f.is_active ? "secondary" : "outline"}>
                      {f.is_active ? "啟用" : "停用"}
                    </Badge>
                  </Table.Cell>
                </Table.Row>{/each}
            </Table.Body>
          </Table.Root>
        </div>{:else}<Empty.Root class="border-t border-border/60 py-12">
          <Empty.Header>
            <Empty.Media variant="icon"><Building2 /></Empty.Media><Empty.Title>
              尚無院所
            </Empty.Title><Empty.Description>
              從院所管理新增合作夥伴，開始建立預約服務。
            </Empty.Description>
          </Empty.Header>
        </Empty.Root>{/if}
    </Card.Root>{/if}
</div>

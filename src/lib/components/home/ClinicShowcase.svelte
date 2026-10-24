<script lang="ts">
  import { Card, CardContent } from "#lib/components/ui/card/index.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import * as Tabs from "#lib/components/ui/tabs/index.ts";
  import { CalendarDays, Building2, CircleCheck } from "@lucide/svelte";
  import { DEMO_CLINIC_ID } from "#lib/clinic-discovery.ts";
</script>

<section
  id="product-preview"
  class="home-container scroll-mt-24 py-14 sm:py-20"
  aria-labelledby="preview-title"
>
  <p class="home-eyebrow">院所門面與日常管理</p>
  <h2 id="preview-title" class="home-heading mt-3">
    客人容易預約，團隊清楚安排。
  </h2>
  <p class="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
    對外介紹服務與專業團隊，對內集中處理預約、排班與客戶資料。下方使用虛構資料示意，不是實際院所或預約。
  </p>
  <Tabs.Root value="storefront" class="mt-7">
    <Tabs.List class="grid h-auto w-full grid-cols-2 sm:w-fit">
      <Tabs.Trigger value="storefront" class="min-h-11">
        客人看到的門面
      </Tabs.Trigger><Tabs.Trigger value="workspace" class="min-h-11">
        團隊使用的工作台
      </Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="storefront" class="mt-5">
      <Card class="gap-0 py-0">
        <CardContent class="grid gap-7 p-6 sm:p-9 lg:grid-cols-2">
          <div>
            <span
              class="inline-flex rounded-full bg-accent px-3 py-1 text-xs text-primary"
            >
              虛構門面示意
            </span>
            <Building2 class="mt-6 size-9 text-primary" />
            <h3 class="mt-4 text-2xl font-semibold">示範美學診所</h3>
            <p class="mt-3 text-sm leading-7 text-muted-foreground">
              院所介紹、品牌
              Logo、專業團隊、服務與交通資訊，整合成專屬公開頁。價格可依服務設定是否公開。
            </p>
            <Button
              href={`/clinic/${DEMO_CLINIC_ID}`}
              variant="outline"
              class="mt-5 min-h-11"
            >
              體驗示範門面
            </Button>
            <p class="mt-2 text-xs text-muted-foreground">
              示範院所僅供體驗，不建立實際預約。
            </p>
          </div>
          <div class="space-y-3 rounded-2xl bg-muted/50 p-5">
            <p class="text-sm font-semibold">服務與預約方式</p>
            {#each [{ title: "初次諮詢", time: "30 分鐘" }, { title: "療程諮詢", time: "45 分鐘" }] as service (service.title)}<div
                class="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-4"
              >
                <div>
                  <p class="text-sm font-medium">{service.title}</p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {service.time} · 示意服務
                  </p>
                </div>
                <CalendarDays class="size-5 text-primary" />
              </div>{/each}
            <p class="text-sm leading-7 text-muted-foreground">
              實際頁面依方案顯示線上預約，或院所允許的電話／現場預約。
            </p>
          </div>
        </CardContent>
      </Card>
    </Tabs.Content>
    <Tabs.Content value="workspace" class="mt-5">
      <Card class="gap-0 py-0">
        <CardContent class="grid gap-7 p-6 sm:p-9 lg:grid-cols-2">
          <div>
            <span
              class="inline-flex rounded-full bg-accent px-3 py-1 text-xs text-primary"
            >
              虛構工作台示意
            </span>
            <h3 class="mt-6 text-2xl font-semibold">從今日預約開始工作。</h3>
            <p class="mt-3 text-sm leading-7 text-muted-foreground">
              查看預約與處理狀態、安排人員班表；需要更新門面時，從院所設定編輯，直接查看公開頁與分享。
            </p>
            <ul class="mt-5 space-y-3 text-sm">
              {#each ["今日預約與客戶資訊", "人員、服務對應與排班", "院所介紹、服務與價格公開設定"] as text (text)}<li
                  class="flex gap-2"
                >
                  <CircleCheck class="size-4 shrink-0 text-primary" />{text}
                </li>{/each}
            </ul>
          </div>
          <div class="space-y-3 rounded-2xl bg-muted/50 p-5">
            <p class="text-sm font-semibold">今日工作台 · 示意資料</p>
            {#each [{ time: "10:00", name: "示範客戶 A", service: "初次諮詢" }, { time: "14:30", name: "示範客戶 B", service: "療程諮詢" }] as appointment (appointment.time)}<div
                class="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
              >
                <div>
                  <p class="text-sm font-semibold">
                    {appointment.time} · {appointment.name}
                  </p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {appointment.service}
                  </p>
                </div>
                <span
                  class="rounded-full bg-accent px-3 py-1 text-xs text-primary"
                >
                  已預約
                </span>
              </div>{/each}
            <p class="text-xs leading-6 text-muted-foreground">
              可用管理功能依院所方案與角色提供。
            </p>
          </div>
        </CardContent>
      </Card>
    </Tabs.Content>
  </Tabs.Root>
</section>

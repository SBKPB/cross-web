<script lang="ts">
  import AdminSkeleton from "../layout/AdminSkeleton.svelte";
  import * as Dialog from "#lib/components/ui/dialog/index.ts";
  import * as Card from "#lib/components/ui/card/index.ts";
  import * as Field from "#lib/components/ui/field/index.ts";
  import { Textarea } from "#lib/components/ui/textarea/index.ts";
  const formId = $props.id();

  import { adminApplicationsApi } from "#lib/api/admin/applications.ts";
  import {
    serviceCategoriesApi,
    FALLBACK_TAXONOMY,
    categoryLabel,
    facilityTypeLabel,
    paymentLabel,
  } from "#lib/api/service-categories.ts";
  import { apiMessage } from "#lib/admin/scheduling.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import Feedback from "./Feedback.svelte";
  import Modal from "./Modal.svelte";
  import type {
    ApplicationStatus,
    FacilityApplication,
  } from "#lib/types/clinic.ts";
  const labels: Record<ApplicationStatus, string> = {
    pending_review: "待審核",
    pending_verification: "待驗證信箱",
    approved: "已核准",
    rejected: "已拒絕",
  };
  let status = $state<ApplicationStatus>("pending_review"),
    rows = $state<FacilityApplication[]>([]),
    loading = $state(true),
    error = $state(""),
    message = $state(""),
    formError = $state(""),
    revision = $state(0),
    selected = $state<FacilityApplication | null>(null),
    action = $state<"approve" | "reject">("approve"),
    open = $state(false),
    busy = $state(false),
    note = $state(""),
    tax = $state(FALLBACK_TAXONOMY);
  $effect(() => {
    const s = status,
      r = revision;
    void r;
    let live = true;
    loading = true;
    error = "";
    adminApplicationsApi
      .list(s)
      .then((v) => {
        if (live) rows = v;
      })
      .catch((e) => {
        if (live) error = apiMessage(e, "申請列表載入失敗");
      })
      .finally(() => {
        if (live) loading = false;
      });
    return () => {
      live = false;
    };
  });
  $effect(() => {
    void serviceCategoriesApi.get().then((v) => (tax = v));
  });
  function review(row: FacilityApplication, a: "approve" | "reject") {
    selected = row;
    action = a;
    note = "";
    formError = "";
    open = true;
  }
  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!selected) return;
    busy = true;
    formError = "";
    try {
      if (action === "approve")
        await adminApplicationsApi.approve(
          selected.id,
          note.trim() || undefined,
        );
      else
        await adminApplicationsApi.reject(
          selected.id,
          note.trim() || undefined,
        );
      open = false;
      revision++;
      message =
        action === "approve"
          ? "申請已核准，院所與管理員帳號已建立，請完成院所設定後再上架。"
          : "申請已拒絕";
    } catch (e) {
      formError = apiMessage(e, "審核失敗，請確認目前申請狀態");
    } finally {
      busy = false;
    }
  }
</script>

<div class="space-y-5">
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">加入申請</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      審核院所導入申請並建立合作院所。
    </p>
  </div>
  <nav aria-label="申請狀態" class="flex flex-wrap gap-2">
    {#each Object.entries(labels) as [key, label] (key)}<Button
        variant={status === key ? "default" : "outline"}
        onclick={() => (status = key as ApplicationStatus)}
      >
        {label}
      </Button>{/each}
  </nav>
  <Feedback {error} {message} />{#if error}<Button
      variant="outline"
      onclick={() => revision++}
    >
      重試申請列表
    </Button>{/if}{#if loading}<AdminSkeleton
      label="載入申請中…"
      variant="list"
    />{:else if !error}<div class="space-y-4">
      {#each rows as a (a.id)}<Card.Root
          role="article"
          class="gap-0 shadow-sm space-y-4 p-5"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="font-semibold">{a.business_name}</h2>
              <p class="mt-1 text-sm text-muted-foreground">
                {labels[a.status]} · {a.created_at.slice(0, 10)}
              </p>
            </div>
            {#if a.status === "pending_review"}<div class="flex gap-2">
                <Button variant="outline" onclick={() => review(a, "reject")}>
                  拒絕申請
                </Button><Button onclick={() => review(a, "approve")}>
                  核准申請
                </Button>
              </div>{/if}
          </div>
          <dl class="grid gap-3 text-sm sm:grid-cols-2">
            {#each [{ label: "聯絡人", value: a.contact_name }, { label: "電話", value: a.phone }, { label: "電子郵件", value: a.email }, { label: "地址", value: [a.city, a.address]
                    .filter(Boolean)
                    .join(" ") }, { label: "團隊規模", value: a.team_size }, { label: "類型／付款", value: facilityTypeLabel(tax, a.facility_type) + "／" + paymentLabel(tax, a.payment_type) }, { label: "服務分類", value: a.service_categories
                    .map((c) => categoryLabel(tax, c))
                    .join("、") }, { label: "服務內容", value: a.services }, { label: "信箱驗證日期", value: a.verified_at?.slice(0, 10) }] as item (item.label)}<div
                class="min-w-0"
              >
                <dt class="text-muted-foreground">{item.label}</dt>
                <dd class="mt-1 whitespace-pre-wrap break-words">
                  {item.value || "未填"}
                </dd>
              </div>{/each}
          </dl>
          {#if a.message}<p
              class="whitespace-pre-wrap rounded-xl bg-muted/40 p-3 text-sm"
            >
              申請留言：{a.message}
            </p>{/if}{#if a.review_note}<p class="whitespace-pre-wrap text-sm">
              審核備註：{a.review_note}
            </p>{/if}{#if a.created_facility_id}<Button
              variant="outline"
              href={"/admin/clinics/" + a.created_facility_id}
            >
              前往已建立院所
            </Button>{/if}{#if a.created_user_id}<p
              class="text-xs text-muted-foreground"
            >
              管理員帳號已建立，可至使用者管理搜尋 {a.email}。
            </p>{/if}
        </Card.Root>{:else}<p
          class="rounded-xl border p-8 text-center text-muted-foreground"
        >
          目前沒有{labels[status]}的申請。
        </p>{/each}
    </div>{/if}
</div>
<Modal
  bind:open
  title={action === "approve" ? "核准申請" : "拒絕申請"}
  description={(selected?.business_name ?? "") +
    (action === "approve"
      ? "・將建立未上架院所與管理員帳號。"
      : "・請確認申請內容後拒絕。")}
  {busy}
>
  <form onsubmit={submit} class="space-y-4">
    <Feedback error={formError} /><Field.Field class="gap-2">
      <Field.Label
        for={[formId, "field-1"].join("-")}
        class="text-sm font-medium"
      >
        審核備註
      </Field.Label><Textarea
        bind:value={note}
        disabled={busy}
        id={[formId, "field-1"].join("-")}
      ></Textarea>
    </Field.Field>
    <Dialog.Footer class="admin-dialog-footer">
      <Button variant="outline" disabled={busy} onclick={() => (open = false)}>
        取消
      </Button><Button
        type="submit"
        variant={action === "approve" ? "default" : "destructive"}
        disabled={busy}
      >
        {action === "approve" ? "確認核准" : "確認拒絕"}
      </Button>
    </Dialog.Footer>
  </form>
</Modal>

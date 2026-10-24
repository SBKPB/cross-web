<script lang="ts">
  import * as Card from "#lib/components/ui/card/index.ts";
  import * as Field from "#lib/components/ui/field/index.ts";

  import { onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import AuthSplitLayout from "#lib/components/auth/AuthSplitLayout.svelte";
  import { getAuth } from "#lib/auth/auth.svelte.ts";
  import { getAdminHomePath } from "#lib/auth/roles.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import { clinicLineContact } from "#lib/contact.ts";
  import Feedback from "./Feedback.svelte";
  import { apiMessage } from "#lib/admin/scheduling.ts";
  const auth = getAuth();
  let email = $state(""),
    password = $state(""),
    busy = $state(false),
    error = $state("");
  onDestroy(() => (auth.sessionExpiredMessage = null));
  async function submit(e: SubmitEvent) {
    e.preventDefault();
    busy = true;
    error = "";
    try {
      const user = await auth.login(email.trim(), password);
      await goto(getAdminHomePath(user));
    } catch (e) {
      error = apiMessage(e, "登入失敗，請確認電子郵件與密碼");
    } finally {
      busy = false;
    }
  }
</script>

<AuthSplitLayout variant="console">
  <Card.Root class="gap-0 shadow-sm w-full max-w-sm space-y-6 p-6 sm:p-8">
    <div>
      <a href="/" class="text-sm text-primary">← 返回首頁</a>
      <h1 class="text-2xl font-semibold tracking-tight">後台登入</h1>
      <p class="mt-2 text-sm text-muted-foreground">
        登入院所工作區或平台管理後台。
      </p>
    </div>
    <Feedback error={error || auth.sessionExpiredMessage || ""} />
    <form onsubmit={submit} class="space-y-4">
      <Field.Set disabled={busy} class="gap-5">
        <div class="space-y-2">
          <Field.Label for="admin-email" class="text-sm">
            電子郵件
          </Field.Label><Input
            id="admin-email"
            type="email"
            bind:value={email}
            autocomplete="username"
            required
          />
        </div>
        <div class="space-y-2">
          <Field.Label for="admin-password" class="text-sm">
            密碼
          </Field.Label><Input
            id="admin-password"
            type="password"
            bind:value={password}
            autocomplete="current-password"
            required
          />
        </div>
      </Field.Set><Button type="submit" class="w-full" disabled={busy}>
        {busy ? "登入中…" : "登入"}
      </Button>
    </form>
    <div class="space-y-3 border-t border-border pt-4 text-sm text-muted-foreground">
      <p>忘記密碼或無法登入？<a href={clinicLineContact} target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-4">LINE 聯絡協助（另開視窗）</a></p>
      <p>尚未加入？<a href="/join" class="text-primary underline underline-offset-4">了解院所導入</a></p>
      <p>一般會員？<a href="/auth" class="text-primary underline underline-offset-4">前往會員登入</a></p>
    </div>
  </Card.Root>
</AuthSplitLayout>

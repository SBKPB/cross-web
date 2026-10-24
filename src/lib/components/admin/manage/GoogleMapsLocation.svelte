<script lang="ts">
  import { onDestroy } from "svelte";
  import MapPin from "@lucide/svelte/icons/map-pin";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import LoaderCircle from "@lucide/svelte/icons/loader-circle";
  import * as Field from "#lib/components/ui/field/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { api } from "#lib/api/client.ts";
  import { apiMessage } from "#lib/admin/scheduling.ts";
  import {
    googleMapsCoordinates,
    googleMapsPreview,
    type MapCoordinates,
  } from "#lib/maps/google-maps.ts";

  let {
    latitude = $bindable(),
    longitude = $bindable(),
    pending = $bindable(false),
    valid = $bindable(true),
  }: {
    latitude?: number;
    longitude?: number;
    pending?: boolean;
    valid?: boolean;
  } = $props();
  const id = $props.id();
  let link = $state(""),
    error = $state(""),
    message = $state("");
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  let sequence = 0;
  const point = $derived(
    latitude !== undefined && longitude !== undefined
      ? { latitude, longitude }
      : null,
  );
  const preview = $derived(point ? googleMapsPreview(point) : "");

  function cancel() {
    sequence++;
    clearTimeout(timer);
    controller?.abort();
    pending = false;
  }
  function changed() {
    cancel();
    error = "";
    message = "";
    valid = !link.trim();
    if (link.trim()) timer = setTimeout(() => void resolve(), 500);
  }
  async function resolve() {
    cancel();
    const current = sequence;
    const input = link.trim();
    if (!input) {
      valid = true;
      return;
    }
    error = "";
    message = "";
    valid = false;
    pending = true;
    controller = new AbortController();
    try {
      const value =
        googleMapsCoordinates(input) ??
        (await api.post<MapCoordinates>(
          "/api/maps/resolve",
          { url: input },
          { signal: controller.signal },
        ));
      if (current !== sequence) return;
      if (
        !Number.isFinite(value.latitude) ||
        !Number.isFinite(value.longitude) ||
        Math.abs(value.latitude) > 90 ||
        Math.abs(value.longitude) > 180
      )
        throw new Error("無法辨識地點，請重新複製院所的分享連結。");
      latitude = value.latitude;
      longitude = value.longitude;
      valid = true;
      message = "已取得地圖位置，儲存院所後生效。";
    } catch (e) {
      if (current === sequence)
        error = apiMessage(
          e,
          "位置解析失敗，請重新複製 Google 地圖分享連結後再試。",
        );
    } finally {
      if (current === sequence) pending = false;
    }
  }
  function remove() {
    cancel();
    link = "";
    latitude = undefined;
    longitude = undefined;
    valid = true;
    error = "";
    message = "已移除位置，儲存院所後生效。";
  }
  onDestroy(cancel);
</script>

<Field.Field class="gap-2">
  <Field.Label for={id} class="text-sm font-medium">
    Google 地圖分享連結（選填）
  </Field.Label>
  <Field.Description id={`${id}-help`}>
    在 Google 地圖開啟院所，點「分享 →
    複製連結」後貼上，即可自動取得位置，不用輸入經緯度。
  </Field.Description>
  <div class="flex flex-col gap-2 sm:flex-row">
    <Input
      {id}
      type="url"
      bind:value={link}
      oninput={changed}
      placeholder="https://maps.app.goo.gl/…"
      maxlength={8192}
      aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
      aria-invalid={!!error && !valid}
      class="min-w-0 flex-1"
    />
    <Button
      type="button"
      variant="outline"
      onclick={resolve}
      disabled={pending || !link.trim()}
      class="min-h-11"
    >
      {#if pending}<LoaderCircle
          class="size-4 animate-spin"
          aria-hidden="true"
        />解析中…{:else}解析位置{/if}
    </Button>
  </div>
  {#if error}<p
      id={`${id}-error`}
      role="alert"
      class="text-sm leading-6 text-destructive"
    >
      {error} 如暫不設定，清空連結後仍可儲存院所資訊。
    </p>{/if}
  <div aria-live="polite" aria-atomic="true" class="text-sm leading-6">
    {#if pending}<p class="text-muted-foreground">正在取得地圖位置，請稍候…</p>
    {:else if message}<p class="text-primary">{message}</p>
    {:else if point}<p
        class="inline-flex items-center gap-2 text-muted-foreground"
      >
        <MapPin class="size-4" aria-hidden="true" />已設定地圖位置
      </p>{/if}
  </div>
  {#if point}
    <div class="flex flex-wrap gap-2">
      <Button
        href={preview}
        target="_blank"
        rel="noopener noreferrer"
        variant="outline"
        class="min-h-11"
      >
        在 Google 地圖確認 <ExternalLink class="size-4" aria-hidden="true" />
      </Button>
      <Button type="button" variant="ghost" onclick={remove} class="min-h-11">
        移除位置
      </Button>
    </div>
  {/if}
</Field.Field>

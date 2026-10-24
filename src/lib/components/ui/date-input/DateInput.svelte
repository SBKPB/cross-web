<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import { today, type DateValue } from "@internationalized/date";
  import CalendarDays from "@lucide/svelte/icons/calendar-days";
  import { Input } from "#lib/components/ui/input/index.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import { Calendar } from "#lib/components/ui/calendar/index.ts";
  import * as Popover from "#lib/components/ui/popover/index.ts";
  import { calendarDate, dateInputError } from "#lib/date-input.ts";
  import { cn } from "#lib/utils.ts";
  import type { HTMLInputAttributes } from "svelte/elements";

  type ChangeEvent = Event & { currentTarget: HTMLInputElement };
  let {
    value = $bindable(""),
    ref = $bindable(null),
    id,
    min,
    max,
    required = false,
    disabled = false,
    readonly = false,
    purpose = "date",
    class: className,
    onchange,
    onblur,
    "aria-describedby": describedBy,
    "aria-invalid": ariaInvalid,
    ...restProps
  }: Omit<
    HTMLInputAttributes,
    | "type"
    | "value"
    | "min"
    | "max"
    | "onchange"
    | "files"
    | "required"
    | "disabled"
    | "readonly"
  > & {
    value?: string;
    ref?: HTMLInputElement | null;
    min?: string;
    max?: string;
    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    purpose?: "date" | "birthday";
    onchange?: (event: ChangeEvent) => void;
  } = $props();
  const uid = $props.id();
  const inputId = $derived(id ?? uid);
  const todayDate = today("Asia/Taipei");
  const effectiveMax = $derived(
    max ?? (purpose === "birthday" ? todayDate.toString() : undefined),
  );
  const lower = $derived(calendarDate(min));
  const upper = $derived(calendarDate(effectiveMax));
  let draft = $state(untrack(() => value)),
    open = $state(false),
    touched = $state(false);
  let fieldLabel = $state("日期");
  let content = $state<HTMLElement | null>(null);
  let placeholder = $state<DateValue>(
    untrack(() => calendarDate(value) ?? lower ?? todayDate),
  );
  let lastNotified = untrack(() => value);
  const selected = $derived(calendarDate(value));
  const error = $derived(dateInputError(draft, min, effectiveMax, required));
  const years = $derived.by(() => {
    const start = lower?.year ?? Math.min(1900, placeholder.year);
    const end = upper?.year ?? Math.max(todayDate.year + 30, placeholder.year);
    const items = Array.from(
      { length: Math.max(0, end - start + 1) },
      (_, index) => start + index,
    );
    return purpose === "birthday" ? items.reverse() : items;
  });
  $effect(() => {
    const next = value;
    untrack(() => {
      draft = next;
      lastNotified = next;
    });
  });
  $effect(() => {
    ref?.setCustomValidity(error);
  });
  $effect(() => {
    if (disabled || readonly) open = false;
  });
  onMount(() => {
    fieldLabel =
      ref?.labels?.[0]?.textContent
        ?.replace(/\s+/g, " ")
        .trim()
        .replace(/\s*\*$/, "") || "日期";
  });

  function publish(event: ChangeEvent) {
    const next = event.currentTarget.value;
    draft = next;
    if (dateInputError(next, min, effectiveMax)) return;
    value = next;
    if (next !== lastNotified) {
      lastNotified = next;
      onchange?.(event);
    }
  }
  function opening(next: boolean) {
    if (next) {
      const date = selected ?? lower ?? todayDate;
      placeholder =
        upper && date.compare(upper) > 0
          ? upper
          : lower && date.compare(lower) < 0
            ? lower
            : date;
    }
    open = next;
  }
  async function choose(date: DateValue | undefined) {
    if (!date || dateInputError(date.toString(), min, effectiveMax, required))
      return;
    draft = date.toString();
    value = draft;
    touched = false;
    await tick();
    if (ref) {
      // 與原日期欄位相同，選取當下即通知篩選、排班及時段更新。
      lastNotified = "";
      ref.value = draft;
      ref.dispatchEvent(new Event("input", { bubbles: true }));
      ref.dispatchEvent(new Event("change", { bubbles: true }));
    }
    open = false;
  }
  async function clear() {
    draft = "";
    value = "";
    touched = false;
    await tick();
    if (ref) {
      lastNotified = "\u0000";
      ref.value = "";
      ref.dispatchEvent(new Event("input", { bubbles: true }));
    }
    open = false;
  }
</script>

<div data-slot="date-input" class={cn("min-w-0 w-full", className)}>
  <Popover.Root {open} onOpenChange={opening}>
    <div class="relative">
      <Input
        {...restProps}
        bind:ref
        id={inputId}
        type="text"
        value={draft}
        {disabled}
        {readonly}
        {required}
        placeholder={restProps.placeholder ?? "YYYY-MM-DD"}
        autocomplete={restProps.autocomplete ?? "off"}
        aria-describedby={[
          describedBy,
          touched && error ? `${uid}-error` : undefined,
        ]
          .filter(Boolean)
          .join(" ") || undefined}
        aria-invalid={ariaInvalid || (touched && !!error) || undefined}
        class="min-h-11 pr-12 tabular-nums"
        oninput={publish}
        onchange={publish}
        onblur={(event) => {
          touched = true;
          onblur?.(event);
        }}
        onkeydown={(event) => {
          if (event.key === "ArrowDown" && !disabled && !readonly) {
            event.preventDefault();
            opening(true);
          }
        }}
      />
      <Popover.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || readonly}
            class="absolute top-0 right-0 size-11 rounded-full text-muted-foreground hover:text-primary"
            aria-label={`開啟${fieldLabel}日曆`}
          >
            <CalendarDays class="size-4" aria-hidden="true" />
          </Button>
        {/snippet}
      </Popover.Trigger>
    </div>
    <Popover.Content
      bind:ref={content}
      align="start"
      collisionPadding={12}
      class="date-input-popover z-[80] max-h-[min(32rem,var(--bits-popover-content-available-height))] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain p-0"
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        void tick().then(() => {
          const target =
            content?.querySelector<HTMLElement>(
              '[data-bits-day][tabindex="0"]:not([aria-disabled="true"])',
            ) ??
            content?.querySelector<HTMLElement>(
              '[data-bits-day]:not([aria-disabled="true"])',
            );
          target?.focus();
        });
      }}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        ref?.focus();
      }}
    >
      <Popover.Title class="sr-only">選擇{fieldLabel}</Popover.Title>
      <Calendar
        type="single"
        value={selected}
        onValueChange={choose}
        bind:placeholder
        locale="zh-TW"
        weekdayFormat="narrow"
        captionLayout="dropdown"
        {years}
        minValue={lower}
        maxValue={upper}
        preventDeselect
        initialFocus
        fixedWeeks
        calendarLabel={fieldLabel}
        class="w-full p-2"
        style="--cell-size:clamp(2.25rem, calc((100vw - 3rem) / 7), 2.75rem)"
      />
      <div
        class="flex items-center justify-between gap-2 border-t border-border p-2"
      >
        <Button
          type="button"
          variant="ghost"
          disabled={!!dateInputError(todayDate.toString(), min, effectiveMax)}
          class="min-h-11"
          onclick={() => choose(todayDate)}
        >
          今天
        </Button>
        {#if !required}<Button
            type="button"
            variant="ghost"
            class="min-h-11"
            onclick={clear}
          >
            清除日期
          </Button>{/if}
        <Popover.Close
          class="min-h-11 rounded-full px-4 text-sm font-medium hover:bg-muted"
        >
          關閉
        </Popover.Close>
      </div>
    </Popover.Content>
  </Popover.Root>
  {#if touched && error}<p
      id={`${uid}-error`}
      role="alert"
      class="mt-1 text-xs leading-5 text-destructive"
    >
      {error}
    </p>{/if}
</div>

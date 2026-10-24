<script lang="ts">
  import {
    DateFormatter,
    getLocalTimeZone,
    type DateValue,
  } from "@internationalized/date";
  import * as Select from "#lib/components/ui/select/index.ts";
  import type CalendarMonthSelect from "./calendar-month-select.svelte";
  import type CalendarYearSelect from "./calendar-year-select.svelte";
  import type Calendar from "./calendar.svelte";
  import type { ComponentProps } from "svelte";

  let {
    captionLayout,
    months,
    monthFormat,
    years,
    yearFormat,
    month,
    locale,
    placeholder = $bindable(),
    monthIndex = 0,
  }: {
    captionLayout: ComponentProps<typeof Calendar>["captionLayout"];
    months: ComponentProps<typeof CalendarMonthSelect>["months"];
    monthFormat: ComponentProps<typeof CalendarMonthSelect>["monthFormat"];
    years: ComponentProps<typeof CalendarYearSelect>["years"];
    yearFormat: ComponentProps<typeof CalendarYearSelect>["yearFormat"];
    month: DateValue;
    placeholder: DateValue | undefined;
    locale: string;
    monthIndex: number;
  } = $props();

  function formatYear(date: DateValue) {
    const dateObj = date.toDate(getLocalTimeZone());
    if (typeof yearFormat === "function")
      return yearFormat(dateObj.getFullYear());
    return new DateFormatter(locale, { year: yearFormat }).format(dateObj);
  }

  function formatMonth(date: DateValue) {
    const dateObj = date.toDate(getLocalTimeZone());
    if (typeof monthFormat === "function")
      return monthFormat(dateObj.getMonth() + 1);
    return new DateFormatter(locale, { month: monthFormat }).format(dateObj);
  }
</script>

{#snippet MonthSelect()}
  {@const items = (months ?? Array.from({ length: 12 }, (_, i) => i + 1)).map(
    (value) => ({
      value: String(value),
      label: formatMonth(month.set({ month: value })),
    }),
  )}
  <Select.Root
    type="single"
    {items}
    value={String(month.month)}
    onValueChange={(value) => {
      if (placeholder && value)
        placeholder = placeholder
          .set({ month: Number(value) })
          .subtract({ months: monthIndex });
    }}
  >
    <Select.Trigger aria-label="選擇月份" class="min-h-11 min-w-0 px-3">
      <Select.Value />
    </Select.Trigger>
    <Select.Content class="z-[90] max-h-64" align="start">
      {#each items as item (item.value)}<Select.Item
          value={item.value}
          label={item.label}
          class="min-h-10"
        />{/each}
    </Select.Content>
  </Select.Root>
{/snippet}

{#snippet YearSelect()}
  {@const items = (
    years ?? Array.from({ length: 151 }, (_, i) => month.year - 100 + i)
  ).map((value) => ({
    value: String(value),
    label: formatYear(month.set({ year: value })),
  }))}
  <Select.Root
    type="single"
    {items}
    value={String(month.year)}
    onValueChange={(value) => {
      if (placeholder && value)
        placeholder = placeholder
          .set({ year: Number(value) })
          .subtract({ months: monthIndex });
    }}
  >
    <Select.Trigger aria-label="選擇年份" class="min-h-11 min-w-0 px-3">
      <Select.Value />
    </Select.Trigger>
    <Select.Content class="z-[90] max-h-64" align="start">
      {#each items as item (item.value)}<Select.Item
          value={item.value}
          label={item.label}
          class="min-h-10"
        />{/each}
    </Select.Content>
  </Select.Root>
{/snippet}

{#if captionLayout === "dropdown"}
  {@render YearSelect()}
  {@render MonthSelect()}
{:else if captionLayout === "dropdown-months"}
  {@render MonthSelect()}
  {#if placeholder}
    {formatYear(placeholder)}
  {/if}
{:else if captionLayout === "dropdown-years"}
  {#if placeholder}
    {formatMonth(placeholder)}
  {/if}
  {@render YearSelect()}
{:else}
  {formatMonth(month)} {formatYear(month)}
{/if}

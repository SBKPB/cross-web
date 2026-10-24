<script>
  import DateInput from "#lib/components/ui/date-input/DateInput.svelte";
  import { Button } from "#lib/components/ui/button/index.ts";
  import * as Dialog from "#lib/components/ui/dialog/index.ts";
  let date = $state("2026-10-24"),
    birth = $state(""),
    changes = $state([]),
    submitted = $state(false),
    open = $state(false);
</script>

<main class="mx-auto max-w-xl space-y-6 p-4">
  <form
    class="space-y-4"
    onsubmit={(event) => {
      event.preventDefault();
      submitted = true;
    }}
  >
    <div>
      <label for="date">預約日期</label>
      <DateInput
        id="date"
        name="appointment_date"
        bind:value={date}
        min="2026-10-20"
        max="2026-12-10"
        required
        onchange={(e) => (changes = [...changes, e.currentTarget.value])}
      />
    </div>
    <div>
      <label for="birth">生日</label>
      <DateInput id="birth" bind:value={birth} purpose="birthday" />
    </div>
    <div>
      <label for="disabled">停用日期</label>
      <DateInput id="disabled" value="2026-10-24" disabled />
    </div>
    <Button type="submit">儲存</Button>
    <output data-testid="date">{date}</output>
    <output data-testid="changes">{JSON.stringify(changes)}</output>
    <output data-testid="saved">{String(submitted)}</output>
  </form>
  <Dialog.Root bind:open>
    <Dialog.Trigger>開啟表單</Dialog.Trigger><Dialog.Content>
      <Dialog.Title>測試表單</Dialog.Title><Dialog.Description>
        日期彈出視窗應支援巢狀表單。
      </Dialog.Description>
      <label for="nested">表單日期</label>
      <DateInput id="nested" bind:value={date} />
    </Dialog.Content>
  </Dialog.Root>
</main>

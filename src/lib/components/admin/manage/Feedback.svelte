<script lang="ts">
  let { error = "", message = "" }: { error?: string; message?: string } =
    $props();
</script>

{#if error}<p
    role="alert"
    class="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
  >
    {error}
  </p>{/if}
{#if message}<p
    role="status"
    class="rounded-xl bg-primary/10 p-3 text-sm text-primary"
  >
    {message}
  </p>{/if}

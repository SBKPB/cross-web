<script lang="ts">
  import PublicFrame from '#lib/components/public/PublicFrame.svelte';
  let { children } = $props();
</script>
<PublicFrame>{@render children()}</PublicFrame>

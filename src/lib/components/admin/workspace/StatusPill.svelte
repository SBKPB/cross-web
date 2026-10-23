<script lang="ts">
  import type { AppointmentStatus } from '#lib/types/clinic.ts';
  import { APPOINTMENT_STATUS_LABELS } from '#lib/constants/appointment.ts';
  let { status }: { status: AppointmentStatus } = $props();
  const colors = { confirmed: 'bg-primary/10 text-primary', checked_in: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200', in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200', completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200', cancelled: 'bg-muted text-muted-foreground', no_show: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' };
</script>
<span class="inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium {colors[status]}">{APPOINTMENT_STATUS_LABELS[status]}</span>

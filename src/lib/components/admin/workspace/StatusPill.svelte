<script lang="ts">
  import { Badge, type BadgeVariant } from "#lib/components/ui/badge/index.ts";
  import type { AppointmentStatus } from "#lib/types/clinic.ts";
  import { APPOINTMENT_STATUS_LABELS } from "#lib/constants/appointment.ts";
  let { status }: { status: AppointmentStatus } = $props();
  const variants: Record<AppointmentStatus, BadgeVariant> = {
    confirmed: "outline",
    checked_in: "secondary",
    in_progress: "default",
    completed: "secondary",
    cancelled: "outline",
    no_show: "destructive",
  };
</script>

<Badge variant={variants[status]} class="h-6 gap-1.5 px-2.5 font-medium">
  <span
    aria-hidden="true"
    class="size-1.5 rounded-full bg-current opacity-65"
  ></span>
  {APPOINTMENT_STATUS_LABELS[status]}
</Badge>

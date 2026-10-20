<script lang="ts">
	import Calendar from "@lucide/svelte/icons/calendar";
	import CheckCircle from "@lucide/svelte/icons/circle-check-big";
	import Clock from "@lucide/svelte/icons/clock";
	import MapPin from "@lucide/svelte/icons/map-pin";
	import User from "@lucide/svelte/icons/user";
	import { formatAppointmentDateTime } from "$lib/booking/calendar";
	import type { BookingResponse } from "$lib/types/booking";

	// 移植自舊版 components/booking/success-card.tsx
	let { booking, primaryColor = "#1d4ed8" }: { booking: BookingResponse; primaryColor?: string } = $props();

	const formatted = $derived(formatAppointmentDateTime(booking.appointment_datetime));
</script>

<div class="px-4">
	<!-- Success Icon -->
	<div class="flex flex-col items-center py-8">
		<div
			class="flex size-20 items-center justify-center rounded-full"
			style:background-color={`${primaryColor}1a`}
			style:box-shadow={`0 0 0 8px ${primaryColor}0d`}
		>
			<CheckCircle class="size-12" style="color: {primaryColor}" />
		</div>
		<h1 class="mt-5 text-2xl font-semibold text-foreground">預約成功</h1>
		<p class="mt-1.5 text-sm text-muted-foreground">
			預約編號:<span class="ml-1 font-mono font-medium text-foreground">{booking.booking_number}</span>
		</p>
		<!-- 預約成立即取號，讓民眾事先知道自己幾號 -->
		{#if booking.queue_number != null}
			<div
				class="mt-3 rounded-full px-4 py-1.5 text-sm font-medium tabular-nums"
				style:background-color={`${primaryColor}1a`}
				style:color={primaryColor}
			>
				您的看診號 {booking.queue_number} 號
			</div>
		{/if}
	</div>

	<!-- Booking Details -->
	<div class="overflow-hidden rounded-3xl border border-border/80 bg-card">
		<!-- Clinic -->
		<div class="border-b border-border/60 p-5">
			<h2 class="font-semibold text-foreground">{booking.clinic.name}</h2>
			{#if booking.clinic.address}
				<a
					href={`https://maps.google.com/?q=${encodeURIComponent(booking.clinic.address)}`}
					target="_blank"
					rel="noopener noreferrer"
					class="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<MapPin class="mt-0.5 size-3.5 shrink-0" />
					<span>{booking.clinic.address}</span>
				</a>
			{/if}
		</div>

		<!-- Appointment Info -->
		<div class="space-y-4 p-5">
			<div class="flex items-center gap-3">
				<div class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
					<Calendar class="size-5 text-muted-foreground" />
				</div>
				<div>
					<p class="font-medium text-foreground">{formatted.date}</p>
					<p class="text-sm text-muted-foreground">{formatted.time}</p>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<div class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
					<Clock class="size-5 text-muted-foreground" />
				</div>
				<div>
					<p class="font-medium text-foreground">{booking.service.name}</p>
					<p class="text-sm text-muted-foreground">約 {booking.service.duration_minutes} 分鐘</p>
				</div>
			</div>

			{#if booking.doctor}
				<div class="flex items-center gap-3">
					<div class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
						<User class="size-5 text-muted-foreground" />
					</div>
					<div>
						<p class="font-medium text-foreground">{booking.doctor.name} {booking.doctor.title}</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Patient Info -->
		<div class="border-t border-border/60 bg-muted/50 p-5">
			<p class="text-sm text-muted-foreground">
				預約人：<span class="font-medium text-foreground">{booking.patient_name}</span>
			</p>
		</div>
	</div>
</div>

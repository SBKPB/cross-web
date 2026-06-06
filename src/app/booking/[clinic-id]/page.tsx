import { notFound, redirect } from "next/navigation";
import { BookingProvider } from "@/components/booking/booking-context";
import { BookingFlow } from "@/components/booking/booking-flow";
import { BookingError } from "@/components/booking/booking-error";
import { bookingApi } from "@/lib/api/booking";
import type { ClinicConfig, ServiceOption, DoctorOption } from "@/types/booking";

interface BookingPageProps {
  params: Promise<{
    "clinic-id": string;
  }>;
}

interface BookingData {
  clinicConfig: ClinicConfig | null;
  services: ServiceOption[];
  doctors: DoctorOption[];
  error: boolean;
}

async function loadBookingData(clinicId: string): Promise<BookingData> {
  try {
    const [clinicConfig, services, doctors] = await Promise.all([
      bookingApi.getClinicConfig(clinicId),
      bookingApi.getServices(clinicId),
      bookingApi.getDoctors(clinicId),
    ]);
    return { clinicConfig, services, doctors, error: false };
  } catch (error) {
    console.error("Failed to load booking data:", error);
    return { clinicConfig: null, services: [], doctors: [], error: true };
  }
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { "clinic-id": clinicId } = await params;

  const data = await loadBookingData(clinicId);

  if (data.error) {
    return <BookingError />;
  }

  if (!data.clinicConfig) {
    notFound();
  }

  // 線上預約為付費功能：未開通的院所導回院所頁（顯示現場 / 電話預約）
  if (data.clinicConfig.online_booking_enabled === false) {
    redirect(`/clinic/${clinicId}`);
  }

  return (
    <BookingProvider>
      <BookingFlow
        clinicId={clinicId}
        clinicConfig={data.clinicConfig}
        services={data.services}
        doctors={data.doctors}
      />
    </BookingProvider>
  );
}

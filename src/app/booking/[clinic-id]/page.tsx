import { notFound } from "next/navigation";
import { BookingProvider } from "@/lib/booking/booking-context";
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

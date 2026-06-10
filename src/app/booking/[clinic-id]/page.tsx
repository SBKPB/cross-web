import { notFound, redirect } from "next/navigation";
import { BookingProvider } from "@/components/booking/booking-context";
import { BookingFlow } from "@/components/booking/booking-flow";
import { BookingError } from "@/components/booking/booking-error";
import { bookingApi } from "@/lib/api/booking";
import { clinicsApi } from "@/lib/api/clinics";
import type { ClinicConfig, ServiceOption, DoctorOption } from "@/types/booking";
import type { PaymentType } from "@/types/clinic";

interface BookingPageProps {
  params: Promise<{
    "clinic-id": string;
  }>;
}

interface BookingData {
  clinicConfig: ClinicConfig | null;
  services: ServiceOption[];
  doctors: DoctorOption[];
  /** 院所付款方式（健保 / 自費 / 兩者）；服務的健保 badge 依此 gating */
  paymentType?: PaymentType;
  error: boolean;
}

// 預約 config 端點不含 payment_type，從公開診所列表（快取 300 秒）補查
async function getPaymentType(clinicId: string): Promise<PaymentType | undefined> {
  try {
    const clinics = await clinicsApi.getClinics();
    return clinics.find((c) => c.id === clinicId)?.payment_type;
  } catch {
    // 查不到時維持 undefined（既有慣例：缺值視為 nhi）
    return undefined;
  }
}

async function loadBookingData(clinicId: string): Promise<BookingData> {
  try {
    const [clinicConfig, services, doctors, paymentType] = await Promise.all([
      bookingApi.getClinicConfig(clinicId),
      bookingApi.getServices(clinicId),
      bookingApi.getDoctors(clinicId),
      getPaymentType(clinicId),
    ]);
    return { clinicConfig, services, doctors, paymentType, error: false };
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
        paymentType={data.paymentType}
      />
    </BookingProvider>
  );
}

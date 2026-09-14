import { PublicFrame } from "@/components/public/public-frame";
export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <PublicFrame footer={false}>{children}</PublicFrame>;
}

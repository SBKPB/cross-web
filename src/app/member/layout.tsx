import { PublicFrame } from "@/components/public/public-frame";
import { MemberNavigation } from "@/components/public/member-navigation";
export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <PublicFrame><MemberNavigation />{children}</PublicFrame>;
}

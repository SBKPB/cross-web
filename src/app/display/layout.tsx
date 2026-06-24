import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "候診叫號看板",
  description: "現場候診室叫號大螢幕",
};

// 全螢幕公開看板：避開 admin/member 外框，給候診室 TV / iPad 瀏覽器用
export default function DisplayLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-background">{children}</div>;
}

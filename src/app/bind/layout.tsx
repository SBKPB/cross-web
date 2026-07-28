import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LINE 帳號綁定",
  description: "綁定 LINE 帳號以查詢與管理預約",
};

export default function BindLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-white pb-[env(safe-area-inset-bottom)]">
      {children}
    </div>
  );
}

import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";

// 在地落地頁原本是沒有 header / footer 的裸頁，只靠麵包屑回上層。
// 首頁的縣市入口把 /area 變成主要導覽目的地後，缺少站台外框會變成死路。
export default function AreaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

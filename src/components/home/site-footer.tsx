import Link from "next/link";
import { Building2 } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Cross</span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              整合全台醫療資源，讓預約看診變得更簡單。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wide">
                服務
              </h4>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>
                  <Link href="/search" className="hover:text-primary">
                    找診所
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-primary">
                    診所加入
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wide">
                關於
              </h4>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>
                  <a
                    href="https://blog.twinhao.com/5nilhs02DalcM7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    隱私權政策
                  </a>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-primary">
                    服務條款
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            &copy; 2025 Cross Healthcare. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

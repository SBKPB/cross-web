import Link from "next/link";
import { Building2 } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">Cross</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

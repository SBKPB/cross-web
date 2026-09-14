import { Skeleton } from "@/components/ui/skeleton";

export default function BookingLoading() {
  return (
    <div className="min-h-[75vh] bg-background pb-24" role="status" aria-label="載入預約資訊中">
      <div className="bg-[#eff4fa] dark:bg-[#142238]">
        <div className="mx-auto max-w-3xl px-5 py-8">
          <Skeleton className="mb-6 h-4 w-28" />
          <div className="flex gap-4"><Skeleton className="size-16 shrink-0 rounded-2xl" /><div className="min-w-0 flex-1 space-y-3"><Skeleton className="h-4 w-40 max-w-full" /><Skeleton className="h-7 w-64 max-w-full" /><Skeleton className="h-4 w-48 max-w-full" /></div></div>
        </div>
      </div>
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="flex justify-center gap-8 py-3">{[1, 2, 3].map((step) => <Skeleton key={step} className="size-8 rounded-full" />)}</div>
        <Skeleton className="h-7 w-40" />
        {[1, 2, 3].map((step) => <Skeleton key={step} className="h-28 rounded-3xl" />)}
      </div>
    </div>
  );
}

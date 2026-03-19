export default function BookingLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Skeleton */}
      <div className="bg-white">
        <div className="h-32 animate-pulse bg-slate-200" />
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="size-14 animate-pulse rounded-xl bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Skeleton */}
      <div className="border-b bg-white px-4 py-3">
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="size-8 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-white"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

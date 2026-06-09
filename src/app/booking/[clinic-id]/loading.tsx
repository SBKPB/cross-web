export default function BookingLoading() {
  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header Skeleton */}
      <div className="bg-card">
        <div className="h-32 animate-pulse bg-muted" />
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="size-14 animate-pulse rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Skeleton */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="size-8 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-card"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

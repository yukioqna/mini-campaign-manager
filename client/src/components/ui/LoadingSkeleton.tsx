export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="h-5 bg-slate-100 rounded skeleton-pulse w-32" aria-hidden="true" />
          <div className="h-5 bg-slate-100 rounded skeleton-pulse w-48 flex-1" aria-hidden="true" />
          <div className="ml-auto flex gap-2">
            <div className="h-6 w-16 bg-slate-100 rounded-full skeleton-pulse" aria-hidden="true" />
            <div className="h-8 w-8 bg-slate-100 rounded skeleton-pulse" aria-hidden="true" />
          </div>
        </div>
      ))}
    </div>
  );
}

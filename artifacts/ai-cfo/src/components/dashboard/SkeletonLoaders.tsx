/** Skeleton placeholder cards shown while dashboard data is loading. */

export function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl p-5 border border-border animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-3 w-24 bg-secondary rounded" />
        <div className="w-4 h-4 bg-secondary rounded" />
      </div>
      <div className="h-8 w-28 bg-secondary rounded mb-3" />
      <div className="h-3 w-16 bg-secondary rounded" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
      <div className="h-5 w-40 bg-secondary rounded mb-2" />
      <div className="h-3 w-56 bg-secondary rounded mb-8" />
      <div className="h-[260px] bg-secondary/50 rounded-lg" />
    </div>
  );
}

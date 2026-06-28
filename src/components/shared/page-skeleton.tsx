import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic loading skeleton shown instantly on navigation (via each area's
 * loading.tsx) while the dynamic page + its data stream in. Keeps the app shell
 * visible and gives immediate feedback so routing feels instant.
 */
export function PageSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[var(--radius-card)]" />
        ))}
      </div>

      {/* Main content block */}
      <Skeleton className="h-80 w-full rounded-[var(--radius-card)]" />
    </div>
  );
}

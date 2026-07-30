import { Skeleton } from "@dbk/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-(--container-content-xl)">
      <Skeleton className="mb-[var(--space-300)] h-8 w-64" />
      <div className="grid grid-cols-2 gap-[var(--space-200)] lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

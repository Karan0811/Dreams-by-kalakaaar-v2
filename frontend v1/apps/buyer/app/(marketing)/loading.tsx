import { Skeleton } from "@dbk/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-(--container-content-xl) px-[var(--space-200)] py-[var(--space-1200)] lg:px-[var(--space-600)]">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="mt-4 h-4 w-1/2" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    </div>
  );
}

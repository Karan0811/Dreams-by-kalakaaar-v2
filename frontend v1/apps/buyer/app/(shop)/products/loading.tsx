import { ProductGridSkeleton } from "@/components/ProductListClient";
import { Skeleton } from "@dbk/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-(--container-content-xl) px-[var(--space-200)] py-[var(--space-400)] lg:px-[var(--space-600)]">
      <Skeleton className="mb-[var(--space-300)] h-8 w-48" />
      <ProductGridSkeleton />
    </div>
  );
}

"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { useWishlist, useRemoveFromWishlist } from "@dbk/api-client";
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton, toast } from "@dbk/ui";

export function WishlistClient() {
  const { data: items, isLoading, isError, refetch } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="We couldn't load your wishlist." onRetry={() => refetch()} />;
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Your wishlist is empty"
        description="Save pieces you love while browsing and they'll show up here."
        action={
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        }
      />
    );
  }

  function handleRemove(productId: string) {
    removeFromWishlist.mutate(productId, {
      onSuccess: () => toast("Removed from wishlist"),
      onError: () => toast.error("Couldn't update your wishlist. Please try again."),
    });
  }

  return (
    <div className="flex flex-col gap-[var(--space-300)]">
      <h1 className="font-serif text-[22px] text-text-primary">Wishlist</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((entry) => (
          <Card key={entry.id} className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/products/${entry.product.slug}`}
                className="text-[14px] font-medium text-text-primary hover:text-text-link"
              >
                {entry.product.title}
              </Link>
              <Button
                variant="tertiary"
                size="sm"
                aria-label="Remove from wishlist"
                isLoading={removeFromWishlist.isPending}
                onClick={() => handleRemove(entry.productId)}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
            {entry.product.status !== "ACTIVE" ? (
              <Badge variant="neutral">No longer available</Badge>
            ) : (
              <Link href={`/products/${entry.product.slug}`} className="text-[13px] font-medium text-text-link hover:underline">
                View product
              </Link>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

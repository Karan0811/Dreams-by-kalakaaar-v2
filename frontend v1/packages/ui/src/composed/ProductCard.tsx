import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { ProductSummary } from "@dbk/types";
import { formatMoney } from "@dbk/utils";
import { AvailabilityStatusBadge } from "../feedback/StatusBadge";
import { WishlistButton } from "./WishlistButton";

/**
 * The primary Product Card, used across Category/Collection/Search/
 * Storefront/Wishlist grids (§3.12's reusable pattern) and the Home page's
 * personalized row. This component itself stays a Server Component — only
 * `WishlistButton` inside it is a Client Component, per
 * 11-frontend-architecture.md §7.8's "leaf Client Component" rule, so the
 * card's image and text never need to hydrate.
 */
export function ProductCard({ product }: { product: ProductSummary }) {
  const isSoldOut = product.availability === "sold_out";
  const image = product.images[0];

  return (
    <div className="group relative flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-[var(--radius-300)] bg-background-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
      >
        {image ? (
          <Image
            src={image.url}
            alt={image.altText}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className={`object-cover transition-transform duration-[var(--duration-standard)] group-hover:scale-[1.03] ${
              isSoldOut ? "opacity-60" : ""
            }`}
          />
        ) : null}
        {isSoldOut ? (
          <span className="absolute left-2 top-2">
            <AvailabilityStatusBadge status="sold_out" />
          </span>
        ) : null}
      </Link>

      <WishlistButton productId={product.id} className="absolute right-2 top-2" />

      <div className="mt-[var(--space-100)] flex flex-col gap-0.5">
        <Link
          href={`/creators/${product.creator.slug}`}
          className="text-[12px] text-text-secondary hover:text-text-link"
        >
          {product.creator.displayName}
          {product.creator.isVerified ? (
            <span className="ml-1 text-brand-accent" aria-label="Verified creator">
              ✓
            </span>
          ) : null}
        </Link>
        <Link href={`/products/${product.slug}`} className="line-clamp-2 text-[14px] font-medium text-text-primary">
          {product.title}
        </Link>
        <div className="mt-0.5 flex items-center justify-between">
          <p className="font-sans text-[14px] font-semibold tabular-nums text-text-primary">
            {formatMoney(product.price)}
          </p>
          {product.rating ? (
            <span className="flex items-center gap-0.5 text-[12px] text-text-secondary">
              <Star className="size-3 fill-[var(--color-brand-accent)] text-[var(--color-brand-accent)]" aria-hidden />
              <span className="tabular-nums">{product.rating.toFixed(1)}</span>
            </span>
          ) : null}
        </div>
        {product.availability !== "sold_out" && product.availability !== "in_stock" ? (
          <AvailabilityStatusBadge status={product.availability} />
        ) : null}
      </div>
    </div>
  );
}

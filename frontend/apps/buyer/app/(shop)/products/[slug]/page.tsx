import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { fetchProductBySlug } from "@dbk/api-client/server";
import { formatMoney } from "@dbk/utils";
import { Avatar, AvailabilityStatusBadge, Badge } from "@dbk/ui";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductPurchasePanel } from "@/components/ProductPurchasePanel";
import { ProductReviews } from "@/components/ProductReviews";
import { RelatedProducts } from "@/components/RelatedProducts";
import { StickyAddToCartBar } from "@/components/StickyAddToCartBar";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug).catch(() => null);
  if (!product) return {};
  return {
    title: product.title,
    description: product.shortDescription,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug).catch(() => null);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-(--container-content-xl) px-[var(--space-200)] py-[var(--space-400)] pb-24 lg:px-[var(--space-600)] lg:pb-[var(--space-400)]">
      <nav aria-label="Breadcrumb" className="mb-[var(--space-300)] text-[13px] text-text-secondary">
        <Link href="/" className="hover:text-text-link">Home</Link>
        <span className="mx-1.5" aria-hidden>/</span>
        <Link href={`/categories/${product.category.slug}`} className="hover:text-text-link">
          {product.category.name}
        </Link>
        <span className="mx-1.5" aria-hidden>/</span>
        <span aria-current="page">{product.title}</span>
      </nav>

      <div className="grid gap-[var(--space-600)] lg:grid-cols-2">
        <ProductGallery images={product.images} productTitle={product.title} />

        <div className="flex flex-col gap-[var(--space-300)]">
          <div>
            <h1 className="font-serif text-[26px] text-text-primary">{product.title}</h1>
            <Link
              href={`/creators/${product.creator.slug}`}
              className="mt-1 flex items-center gap-2 text-[14px] text-text-secondary hover:text-text-link"
            >
              <Avatar src={product.creator.avatarUrl} alt="" fallback={product.creator.displayName.slice(0, 2)} size="sm" />
              By {product.creator.displayName}
              {product.creator.isVerified ? <Badge variant="brand">Verified</Badge> : null}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <p className="font-sans text-[24px] font-semibold tabular-nums text-text-primary">
              {formatMoney(product.price)}
            </p>
            {product.compareAtPrice ? (
              <p className="text-[15px] text-text-secondary line-through">
                {formatMoney(product.compareAtPrice)}
              </p>
            ) : null}
            <AvailabilityStatusBadge status={product.availability} />
          </div>

          {product.rating ? (
            <div className="flex items-center gap-1 text-[13px] text-text-secondary">
              <Star className="size-3.5 fill-[var(--color-brand-accent)] text-[var(--color-brand-accent)]" aria-hidden />
              <span className="font-medium text-text-primary">{product.rating.toFixed(1)}</span>
              <span>({product.reviewCount} reviews)</span>
            </div>
          ) : null}

          <div id="purchase-panel">
            <ProductPurchasePanel product={product} />
          </div>

          <div className="border-t border-border pt-[var(--space-300)]">
            <h2 className="text-[14px] font-medium text-text-primary">Description</h2>
            <p className="mt-1 whitespace-pre-line text-[14px] text-text-secondary">{product.description}</p>
          </div>

          {product.materials.length > 0 ? (
            <div>
              <h2 className="text-[14px] font-medium text-text-primary">Materials</h2>
              <ul className="mt-1 flex flex-wrap gap-2">
                {product.materials.map((material) => (
                  <li key={material}>
                    <Badge>{material}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <ProductReviews productSlug={slug} />

      <RelatedProducts categoryId={product.category.id} excludeProductId={product.id} />

      <StickyAddToCartBar product={product} />
    </div>
  );
}

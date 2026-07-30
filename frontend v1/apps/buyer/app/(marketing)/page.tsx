import Link from "next/link";
import {
  ArrowRight,
  Gem,
  HandHeart,
  Hammer,
  Image as ImageIcon,
  Shirt,
  ShieldCheck,
  Sparkles,
  Briefcase,
} from "lucide-react";
import { fetchProductList } from "@dbk/api-client/server";
import { Button, ProductCard } from "@dbk/ui";

const pillars = [
  {
    icon: HandHeart,
    title: "Made by hand, not a factory line",
    body: "Every piece on Dreams by Kalakaaar is made by an individual creator — no mass production, no lookalikes.",
  },
  {
    icon: ShieldCheck,
    title: "Verified creators, real accountability",
    body: "Every storefront goes through a verification process, so you know exactly who made what you're buying.",
  },
  {
    icon: Sparkles,
    title: "Customization, when it matters",
    body: "Many creators offer personalization — from engraving to color choices — right from the product page.",
  },
] as const;

/**
 * Category tiles use icons rather than photography (10.6): with no CMS/asset
 * pipeline wired up yet, hardcoding paths under `public/images/...` that
 * don't exist would render broken images in production. An icon tile is a
 * legitimate, self-contained visual that never 404s; swap for real creator
 * photography once the media pipeline (14-infrastructure-devops-architecture.md)
 * is connected, without changing this section's structure.
 */
const categories = [
  { slug: "ceramics-pottery", name: "Ceramics & Pottery", icon: HandHeart },
  { slug: "textiles-home", name: "Textiles & Home", icon: Shirt },
  { slug: "jewelry", name: "Jewelry", icon: Gem },
  { slug: "art-prints", name: "Art & Prints", icon: ImageIcon },
  { slug: "woodwork", name: "Woodwork", icon: Hammer },
  { slug: "leather-goods", name: "Leather Goods", icon: Briefcase },
] as const;

/**
 * Home ("/"), per 07-ui-screens-wireframes.md §3.2. The featured-products
 * row calls the real product-list endpoint through the server-only
 * `fetchProductList` (11-frontend-architecture.md §7.4) — if the upstream
 * API isn't reachable yet (e.g., local frontend-only development), the
 * section is simply omitted rather than rendering broken cards, matching
 * §3.2's "excluded from rendering, not shown broken" rule for empty
 * Collections.
 */
export default async function HomePage() {
  const featured = await fetchProductList({ sort: "newest" }).catch(() => null);

  return (
    <div>
      <section className="border-b border-border bg-background-subtle">
        <div className="mx-auto grid max-w-(--container-content-xl) items-center gap-[var(--space-600)] px-[var(--space-200)] py-[var(--space-1200)] md:grid-cols-2 lg:px-[var(--space-600)]">
          <div>
            <h1 className="font-serif text-[36px] leading-[1.1] text-text-primary md:text-[48px]">
              Handmade goods, from the people who made them.
            </h1>
            <p className="mt-[var(--space-200)] max-w-md text-[16px] text-text-secondary">
              Discover ceramics, textiles, jewelry, and more from independent creators across
              India — each piece with a name, a story, and a pair of hands behind it.
            </p>
            <div className="mt-[var(--space-400)] flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/products">
                  Shop All Products
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/collections">Explore Collections</Link>
              </Button>
            </div>
          </div>
          {/* Decorative, self-contained gradient panel — deliberately not a
              photograph; see the categories comment above for the rationale. */}
          <div
            aria-hidden
            className="relative hidden aspect-[4/3] items-center justify-center overflow-hidden rounded-[var(--radius-400)] bg-gradient-to-br from-brand-primary/15 via-brand-accent/20 to-brand-secondary/15 md:flex"
          >
            <HandHeart className="size-24 text-brand-primary/40" strokeWidth={1} />
          </div>
        </div>
      </section>

      <section aria-labelledby="why-heading" className="mx-auto max-w-(--container-content-xl) px-[var(--space-200)] py-[var(--space-800)] lg:px-[var(--space-600)]">
        <h2 id="why-heading" className="sr-only">
          Why shop on Dreams by Kalakaaar
        </h2>
        <div className="grid gap-[var(--space-400)] md:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="flex flex-col gap-2">
              <pillar.icon className="size-[var(--size-icon-lg)] text-brand-primary" aria-hidden />
              <h3 className="text-[16px] font-medium text-text-primary">{pillar.title}</h3>
              <p className="text-[14px] text-text-secondary">{pillar.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="categories-heading" className="border-t border-border bg-background-subtle">
        <div className="mx-auto max-w-(--container-content-xl) px-[var(--space-200)] py-[var(--space-800)] lg:px-[var(--space-600)]">
          <div className="mb-[var(--space-400)] flex items-center justify-between">
            <h2 id="categories-heading" className="font-serif text-[24px] text-text-primary">
              Shop by category
            </h2>
            <Link href="/categories" className="text-[14px] font-medium text-text-link hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-[var(--space-200)] md:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="group flex flex-col items-center gap-2 rounded-[var(--radius-300)] p-[var(--space-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
              >
                <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[var(--radius-300)] bg-surface transition-colors group-hover:bg-background-subtle">
                  <category.icon
                    className="size-8 text-brand-primary transition-transform duration-[var(--duration-standard)] group-hover:scale-110"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </div>
                <span className="text-center text-[13px] font-medium text-text-primary">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featured && featured.data.length > 0 ? (
        <section aria-labelledby="featured-heading" className="mx-auto max-w-(--container-content-xl) px-[var(--space-200)] py-[var(--space-800)] lg:px-[var(--space-600)]">
          <div className="mb-[var(--space-400)] flex items-center justify-between">
            <h2 id="featured-heading" className="font-serif text-[24px] text-text-primary">
              New this week
            </h2>
            <Link href="/products?sort=newest" className="text-[14px] font-medium text-text-link hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-[var(--space-300)] md:grid-cols-3 lg:grid-cols-4">
            {featured.data.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

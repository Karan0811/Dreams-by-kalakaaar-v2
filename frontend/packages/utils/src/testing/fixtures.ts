import { createId, type Product, type ProductSummary } from "@dbk/types";

/** Shared test fixtures (11-frontend-architecture.md §4.2, packages/utils
 * §"testing"). Kept minimal and realistic so component tests across apps/ui
 * exercise the same representative shapes rather than each test hand-rolling
 * slightly different mock data. */
export function makeProductSummary(overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id: createId("00000000-0000-4000-8000-000000000001"),
    slug: "hand-thrown-ceramic-vase",
    title: "Hand-Thrown Ceramic Vase",
    price: { amountMinor: 249900, currency: "INR" },
    compareAtPrice: null,
    images: [
      {
        id: createId("00000000-0000-4000-8000-000000000002"),
        url: "/placeholder/vase.jpg",
        altText: "A hand-thrown terracotta ceramic vase",
        position: 0,
      },
    ],
    creator: {
      id: createId("00000000-0000-4000-8000-000000000003"),
      slug: "clay-and-co",
      displayName: "Clay & Co.",
      avatarUrl: null,
      isVerified: true,
    },
    availability: "in_stock",
    rating: 4.8,
    reviewCount: 132,
    ...overrides,
  };
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  const summary = makeProductSummary();
  return {
    ...summary,
    shortDescription: "A one-of-a-kind vase, thrown and glazed by hand in Jaipur.",
    description:
      "Each vase is individually thrown on a potter's wheel, then finished with a reactive glaze that means no two pieces are ever exactly alike.",
    category: {
      id: createId("00000000-0000-4000-8000-000000000004"),
      slug: "home-decor",
      name: "Home Décor",
    },
    isHandmade: true,
    leadTimeDays: 5,
    customizationFields: [],
    materials: ["Stoneware clay", "Reactive glaze"],
    tags: ["ceramics", "vase", "home-decor"],
    ...overrides,
  };
}

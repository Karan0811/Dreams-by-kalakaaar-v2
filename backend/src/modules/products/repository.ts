import { and, asc, desc, eq, ilike, inArray, isNull, lt, gt, or, sql, type SQL } from 'drizzle-orm';
import { db, withTransaction } from '@/shared/db/client';
import {
  categories,
  creators,
  inventory,
  media,
  productMedia,
  productVariants,
  products,
  stores,
  userProfiles,
} from '@/shared/db/schema';
import type {
  AdjustInventoryInput,
  AttachProductMediaInput,
  CreateProductInput,
  CreateProductVariantInput,
  ListProductsQuery,
  ListStoreProductsQuery,
  ProductSort,
  UpdateProductInput,
  UpdateProductMediaInput,
  UpdateProductVariantInput,
} from './schemas';
import { sortUsesCursorPagination } from './schemas';
import * as sharedMediaRepository from '@/shared/storage/media-repository';

/** Products module Repository Layer — 08-database-design.md Section 8. */

export async function findStoreById(storeId: string) {
  const [row] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  return row ?? null;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function createProduct(storeId: string, input: CreateProductInput) {
  return withTransaction(async (tx) => {
    const baseSlug = slugify(input.title);
    const uniqueSuffix = Math.random().toString(36).slice(2, 8);

    const [product] = await tx
      .insert(products)
      .values({
        storeId,
        title: input.title,
        slug: `${baseSlug}-${uniqueSuffix}`,
        description: input.description,
        productType: input.productType,
        leadTimeDays: input.leadTimeDays,
        primaryCategoryId: input.primaryCategoryId,
        status: 'DRAFT',
      })
      .returning();

    if (!product) throw new Error('Failed to create Product row.');

    for (const variantInput of input.variants) {
      const [variant] = await tx
        .insert(productVariants)
        .values({
          productId: product.id,
          attributes: variantInput.attributes,
          priceAmount: variantInput.priceAmount,
          priceCurrency: variantInput.priceCurrency,
          skuReference: variantInput.skuReference,
        })
        .returning();

      if (!variant) throw new Error('Failed to create ProductVariant row.');

      await tx.insert(inventory).values({
        variantId: variant.id,
        quantityAvailable: variantInput.initialQuantity,
      });
    }

    return product;
  });
}

/** Every non-deleted-row read shares this guard — 08-database-design.md's soft-delete convention. */
const notDeleted = isNull(products.deletedAt);

export async function findProductById(productId: string) {
  const [row] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), notDeleted))
    .limit(1);
  return row ?? null;
}

export async function findPublicProductByIdOrSlug(idOrSlug: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  const [row] = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, 'ACTIVE'),
        notDeleted,
        isUuid ? eq(products.id, idOrSlug) : eq(products.slug, idOrSlug),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function findVariantsForProduct(productId: string) {
  return db
    .select({
      id: productVariants.id,
      attributes: productVariants.attributes,
      priceAmount: productVariants.priceAmount,
      priceCurrency: productVariants.priceCurrency,
      skuReference: productVariants.skuReference,
      status: productVariants.status,
      quantityAvailable: inventory.quantityAvailable,
      quantityReserved: inventory.quantityReserved,
      lowStockThreshold: inventory.lowStockThreshold,
    })
    .from(productVariants)
    .leftJoin(inventory, eq(productVariants.id, inventory.variantId))
    .where(eq(productVariants.productId, productId));
}

export async function findVariantById(variantId: string) {
  const [row] = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1);
  return row ?? null;
}

export async function findMediaForProduct(productId: string) {
  return db
    .select({
      id: productMedia.id,
      mediaId: productMedia.mediaId,
      variantId: productMedia.variantId,
      displayOrder: productMedia.displayOrder,
      isPrimary: productMedia.isPrimary,
      // Sprint 01 fix: this previously selected only from productMedia, so
      // the response never included the actual image URL — just the join
      // row's own metadata. A caller had no way to render anything.
      publicUrl: media.publicUrl,
      altText: media.altText,
      mimeType: media.mimeType,
    })
    .from(productMedia)
    .innerJoin(media, eq(productMedia.mediaId, media.id))
    .where(eq(productMedia.productId, productId))
    .orderBy(productMedia.displayOrder);
}

export async function updateProduct(productId: string, input: UpdateProductInput) {
  const [updated] = await db
    .update(products)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(products.id, productId), notDeleted))
    .returning();
  return updated ?? null;
}

export async function updateProductStatus(productId: string, status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') {
  const [updated] = await db
    .update(products)
    .set({
      status,
      updatedAt: new Date(),
      archivedAt: status === 'ARCHIVED' ? new Date() : null,
    })
    .where(and(eq(products.id, productId), notDeleted))
    .returning();
  return updated ?? null;
}

/** Sprint 01 — soft delete. Sets `deletedAt`; every read above already excludes it via `notDeleted`. */
export async function softDeleteProduct(productId: string) {
  const [updated] = await db
    .update(products)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(products.id, productId), notDeleted))
    .returning();
  return updated ?? null;
}

export interface Cursor {
  sortValue: string;
  id: string;
}

function encodeCursor(sortValue: string, id: string): string {
  return Buffer.from(`${sortValue}|${id}`).toString('base64url');
}

function decodeCursor(cursor: string): Cursor {
  const [sortValue, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
  return { sortValue: sortValue ?? '', id: id ?? '' };
}

/**
 * A per-product-row scalar subquery for its cheapest variant's price. Used
 * identically in SELECT, WHERE (min/max price filters), and ORDER BY
 * (price sorts) — see `productSortSchema`'s doc comment for why price sorts
 * use page-number rather than keyset pagination.
 */
const minPriceExpr = sql<number>`(select min(${productVariants.priceAmount}) from ${productVariants} where ${productVariants.productId} = ${products.id})`;

const inStockExpr = sql<boolean>`exists (
  select 1 from ${productVariants}
  where ${productVariants.productId} = ${products.id}
    and ${productVariants.id} in (select ${inventory.variantId} from ${inventory} where ${inventory.quantityAvailable} > 0)
)`;

/** Structured filters shared by both the public and creator-scoped listing queries. */
function buildFilterConditions(
  query: ListProductsQuery | ListStoreProductsQuery,
  minPriceExpression: SQL | SQL.Aliased = minPriceExpr,
) {
  return [
    query.categoryId ? eq(products.primaryCategoryId, query.categoryId) : undefined,
    query.storeId ? eq(products.storeId, query.storeId) : undefined,
    query.productType ? eq(products.productType, query.productType) : undefined,
    query.q
      ? or(ilike(products.title, `%${query.q}%`), ilike(products.description, `%${query.q}%`))
      : undefined,
    query.minPrice !== undefined ? sql`${minPriceExpression} >= ${query.minPrice}` : undefined,
    query.maxPrice !== undefined ? sql`${minPriceExpression} <= ${query.maxPrice}` : undefined,
    query.inStockOnly ? inStockExpr : undefined,
  ];
}

/** One grouped scan replaces the repeated per-product min-price subqueries
 * used by price filters/sorts. The existing (product_id, price_amount) index
 * still helps the aggregation, while the grouped result is joined once to the
 * product page. Keep all variants here to preserve the existing min-price
 * semantics; availability is handled separately by the catalog enrichment. */
function buildVariantPriceAggregate() {
  return db
    .select({
      productId: productVariants.productId,
      minPrice: sql<number>`min(${productVariants.priceAmount})`.as('min_price'),
    })
    .from(productVariants)
    .groupBy(productVariants.productId)
    .as('variant_price_aggregate');
}

function sortColumn(sort: ProductSort) {
  switch (sort) {
    case 'priceLow':
    case 'priceHigh':
      return minPriceExpr;
    case 'bestSelling':
      return products.unitsSold;
    case 'oldest':
    case 'newest':
    default:
      return products.createdAt;
  }
}

function sortDirection(sort: ProductSort): 'asc' | 'desc' {
  return sort === 'oldest' || sort === 'priceLow' ? 'asc' : 'desc';
}

/**
 * Shared listing executor. `scopeCondition` distinguishes the two callers
 * (creator-scoped-to-one-Store vs. public-ACTIVE-only); everything else —
 * filtering, sorting, and choosing keyset vs. page pagination — is identical.
 */
async function runProductListQuery(
  scopeCondition: ReturnType<typeof eq> | ReturnType<typeof and>,
  query: ListProductsQuery | ListStoreProductsQuery,
) {
  const col = sortColumn(query.sort);
  const dir = sortDirection(query.sort);
  const useCursor = sortUsesCursorPagination(query.sort);

  const filterConditions = buildFilterConditions(query);

  if (useCursor) {
    const cursorFilter = query.cursor ? decodeCursor(query.cursor) : null;
    const cursorCondition = cursorFilter
      ? dir === 'desc'
        ? or(
            lt(products.createdAt, new Date(cursorFilter.sortValue)),
            and(eq(products.createdAt, new Date(cursorFilter.sortValue)), lt(products.id, cursorFilter.id)),
          )
        : or(
            gt(products.createdAt, new Date(cursorFilter.sortValue)),
            and(eq(products.createdAt, new Date(cursorFilter.sortValue)), gt(products.id, cursorFilter.id)),
          )
      : undefined;

    const rows = await db
      .select()
      .from(products)
      .where(and(scopeCondition, notDeleted, ...filterConditions, cursorCondition))
      .orderBy(dir === 'desc' ? desc(products.createdAt) : asc(products.createdAt), dir === 'desc' ? desc(products.id) : asc(products.id))
      .limit(query.limit + 1);

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const lastRow = page.at(-1);

    return {
      data: page,
      pagination: {
        nextCursor: hasMore && lastRow ? encodeCursor(lastRow.createdAt.toISOString(), lastRow.id) : null,
        hasMore,
        limit: query.limit,
        page: null,
        totalPages: null,
        totalCount: query.includeTotalCount ? await countProducts(scopeCondition, filterConditions) : undefined,
      },
    };
  }

  // Page-number pagination for price/popularity sorts (see productSortSchema's doc comment).
  const offset = (query.page - 1) * query.limit;

  // Price filters and price ordering previously repeated the correlated
  // min-price subquery for every product in WHERE, SELECT, and ORDER BY.
  // Aggregate active variants once and join that small relation to the page.
  // This keeps best-selling/newest paths unchanged and avoids introducing a
  // denormalized price column with update/consistency obligations.
  const needsPriceAggregate =
    query.minPrice !== undefined ||
    query.maxPrice !== undefined ||
    query.sort === 'priceLow' ||
    query.sort === 'priceHigh';

  if (needsPriceAggregate) {
    const variantPrices = buildVariantPriceAggregate();
    const priceFilterConditions = buildFilterConditions(query, variantPrices.minPrice);
    const [rows, countRows] = await Promise.all([
      db
        .select({ product: products })
        .from(products)
        .innerJoin(variantPrices, eq(variantPrices.productId, products.id))
        .where(and(scopeCondition, notDeleted, ...priceFilterConditions))
        .orderBy(
          dir === 'asc' ? asc(variantPrices.minPrice) : desc(variantPrices.minPrice),
          desc(products.id),
        )
        .limit(query.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .innerJoin(variantPrices, eq(variantPrices.productId, products.id))
        .where(and(scopeCondition, notDeleted, ...priceFilterConditions)),
    ]);
    const data = rows.map((row) => row.product);
    const totalCount = countRows[0]?.count ?? 0;

    return {
      data,
      pagination: {
        nextCursor: null,
        hasMore: offset + data.length < totalCount,
        limit: query.limit,
        page: query.page,
        totalPages: Math.max(1, Math.ceil(totalCount / query.limit)),
        totalCount,
      },
    };
  }

  const [rows, totalCount] = await Promise.all([
    db
      .select()
      .from(products)
      .where(and(scopeCondition, notDeleted, ...filterConditions))
      .orderBy(dir === 'desc' ? desc(col) : asc(col), desc(products.id))
      .limit(query.limit)
      .offset(offset),
    countProducts(scopeCondition, filterConditions),
  ]);

  return {
    data: rows,
    pagination: {
      nextCursor: null,
      hasMore: offset + rows.length < totalCount,
      limit: query.limit,
      page: query.page,
      totalPages: Math.max(1, Math.ceil(totalCount / query.limit)),
      totalCount,
    },
  };
}

async function countProducts(
  scopeCondition: ReturnType<typeof eq> | ReturnType<typeof and>,
  filterConditions: ReturnType<typeof buildFilterConditions>,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(and(scopeCondition, notDeleted, ...filterConditions));
  return row?.count ?? 0;
}

/** Creator-side listing: every non-deleted status, scoped to one Store. */
export async function listProductsForStore(storeId: string, query: ListStoreProductsQuery) {
  const scopeCondition = and(
    eq(products.storeId, storeId),
    query.status ? eq(products.status, query.status) : undefined,
  )!;
  return runProductListQuery(scopeCondition, query);
}

/** Public listing: ACTIVE only, optionally filtered by category/store/search/price/stock. */
export async function listPublicProducts(query: ListProductsQuery) {
  const scopeCondition = eq(products.status, 'ACTIVE');
  const t0 = performance.now(); // ADDED
  const result = await runProductListQuery(scopeCondition, query);
  const t1 = performance.now(); // ADDED
  const data = await enrichProductsForPublicResponse(result.data);
  const t2 = performance.now(); // ADDED
  console.log('products.repo.performance', { // ADDED
    runProductListQueryMs: Number((t1 - t0).toFixed(2)),
    enrichMs: Number((t2 - t1).toFixed(2)),
    dbTotalMs: Number((t2 - t0).toFixed(2)),
  });
  return { ...result, data };
}

/**
 * Builds the buyer-facing "ProductSummary"/"Product" contract
 * (`@dbk/types`'s `Product`/`ProductSummary`) from a batch of raw
 * `products` rows.
 *
 * BUG FIX: `runProductListQuery` (and, before this fix, `listPublicProducts`
 * directly) only ever selected bare `products` columns — no price, image,
 * creator, or availability data existed anywhere in the response. Every
 * layer above this (service, route handler, the frontend's `apiFetch<T>`)
 * passed that raw row straight through with a *type* claiming it was a
 * `ProductSummary`, but nothing ever actually constructed one — the type
 * assertion was simply false, unchecked at runtime, until `ProductCard`
 * crashed on `product.images[0]`. This is the actual construction step
 * that was always missing.
 *
 * Batches every join by the input rows' ids/storeIds/categoryIds (not a
 * per-row query) — safe for a page of up to 100 products, matching
 * `listProductsQuerySchema`'s `limit` cap.
 *
 * Fields with no backing column anywhere in the schema (materials, tags,
 * customizationFields, creator.isVerified, creator.city/bannerUrl,
 * category.imageUrl, compareAtPrice) are set to their honest "nothing
 * tracked yet" value (empty array / null / false) rather than omitted —
 * omitting them would just move this same crash to whichever field a
 * caller reads next. None of Materials/Tags/Customization/Reviews modules
 * are built yet (`backend/SCOPE.md`); `isHandmade: true` is not a filler
 * value, it's a true, platform-wide invariant of this marketplace.
 */
export async function enrichProductsForPublicResponse<T extends typeof products.$inferSelect>(
  rows: T[],
): Promise<Array<T & PublicProductFields>> {
  if (rows.length === 0) return [];

  const productIds = rows.map((r) => r.id);
  const storeIds = [...new Set(rows.map((r) => r.storeId))];
  const categoryIds = [...new Set(rows.map((r) => r.primaryCategoryId).filter((id): id is string => Boolean(id)))];

  const [priceRows, imageRows, stockRows, storeRows, categoryRows] = await Promise.all([
    db
      .select({
        productId: productVariants.productId,
        minPriceAmount: sql<number>`min(${productVariants.priceAmount})::int`,
        priceCurrency: sql<string>`min(${productVariants.priceCurrency})`,
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds))
      .groupBy(productVariants.productId),

    db
      .select({
        productId: productMedia.productId,
        url: media.publicUrl,
        altText: media.altText,
        displayOrder: productMedia.displayOrder,
        isPrimary: productMedia.isPrimary,
        mediaId: productMedia.mediaId,
      })
      .from(productMedia)
      .innerJoin(media, eq(productMedia.mediaId, media.id))
      .where(inArray(productMedia.productId, productIds))
      .orderBy(productMedia.displayOrder),

    db
      .select({
        productId: productVariants.productId,
        anyInStock: sql<boolean>`bool_or(${inventory.quantityAvailable} > 0)`,
        anyLowStock: sql<boolean>`bool_or(${inventory.quantityAvailable} <= ${inventory.lowStockThreshold})`,
      })
      .from(productVariants)
      .leftJoin(inventory, eq(productVariants.id, inventory.variantId))
      .where(inArray(productVariants.productId, productIds))
      .groupBy(productVariants.productId),

    db
      .select({
        storeId: stores.id,
        storeSlug: stores.slug,
        storeName: stores.name,
        storeTagline: stores.tagline,
        avatarUrl: media.publicUrl,
      })
      .from(stores)
      .innerJoin(creators, eq(stores.creatorId, creators.id))
      .leftJoin(userProfiles, eq(creators.userId, userProfiles.userId))
      .leftJoin(media, eq(userProfiles.avatarMediaId, media.id))
      .where(inArray(stores.id, storeIds)),

    categoryIds.length > 0
      ? db.select().from(categories).where(inArray(categories.id, categoryIds))
      : Promise.resolve([]),
  ]);

  const priceByProduct = new Map(priceRows.map((r) => [r.productId, r]));
  const stockByProduct = new Map(stockRows.map((r) => [r.productId, r]));
  const storeById = new Map(storeRows.map((r) => [r.storeId, r]));
  const categoryById = new Map(categoryRows.map((r) => [r.id, r]));
  const imagesByProduct = new Map<string, typeof imageRows>();
  for (const image of imageRows) {
    const list = imagesByProduct.get(image.productId) ?? [];
    list.push(image);
    imagesByProduct.set(image.productId, list);
  }

  return rows.map((row) => {
    const price = priceByProduct.get(row.id);
    const stock = stockByProduct.get(row.id);
    const store = storeById.get(row.storeId);
    const category = row.primaryCategoryId ? categoryById.get(row.primaryCategoryId) : undefined;
    const productImages = (imagesByProduct.get(row.id) ?? []).sort(
      (a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || a.displayOrder - b.displayOrder,
    );

    const availability: PublicProductFields['availability'] =
      row.productType === 'MADE_TO_ORDER'
        ? 'made_to_order'
        : !stock?.anyInStock
          ? 'sold_out'
          : stock.anyLowStock
            ? 'low_stock'
            : 'in_stock';

    return {
      ...row,
      price: { amountMinor: price?.minPriceAmount ?? 0, currency: (price?.priceCurrency ?? 'INR') as 'INR' },
      compareAtPrice: null,
      images: productImages.map((img, index) => ({
        id: img.mediaId,
        url: img.url ?? '',
        altText: img.altText ?? row.title,
        position: index,
      })),
      creator: {
        id: row.storeId,
        slug: store?.storeSlug ?? '',
        displayName: store?.storeName ?? '',
        avatarUrl: store?.avatarUrl ?? null,
        bannerUrl: null, // no store banner-image column exists yet
        tagline: store?.storeTagline ?? null,
        isVerified: false, // no creator-verification system exists yet — honest default, not a filler value
        city: null, // creators/stores don't track a display city yet
      },
      category: category
        ? { id: category.id, slug: category.slug, name: category.name, parentId: category.parentId, imageUrl: null }
        : { id: '', slug: '', name: '', parentId: null, imageUrl: null },
      availability,
      // reviewCount/averageRating are real denormalized columns
      // (08-database-design.md §2.3), but no Reviews module exists yet to
      // ever write to them (backend/SCOPE.md) — they're always 0 today.
      // No ×N scaling convention is documented anywhere for averageRating,
      // so this passes it through as-is rather than guessing one.
      rating: row.reviewCount > 0 ? row.averageRating : null,
      reviewCount: row.reviewCount,
      isHandmade: true, // every listing on this platform is handmade by definition, not a placeholder
      shortDescription: row.description.length > 140 ? `${row.description.slice(0, 137)}...` : row.description,
      customizationFields: [], // CustomizationOption/Value are deferred (backend/SCOPE.md) — genuinely none exist yet
      materials: [], // ProductMaterial is deferred — genuinely none tracked yet
      tags: [], // ProductTag is deferred — genuinely none tracked yet
    };
  });
}

interface PublicProductFields {
  price: { amountMinor: number; currency: 'INR' };
  compareAtPrice: null;
  images: { id: string; url: string; altText: string; position: number }[];
  creator: {
    id: string;
    slug: string;
    displayName: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
    tagline: string | null;
    isVerified: boolean;
    city: string | null;
  };
  category: { id: string; slug: string; name: string; parentId: string | null; imageUrl: string | null };
  availability: 'in_stock' | 'low_stock' | 'made_to_order' | 'sold_out';
  rating: number | null;
  reviewCount: number;
  isHandmade: boolean;
  shortDescription: string;
  customizationFields: never[];
  materials: never[];
  tags: never[];
}

export async function countVariantsMissingInventory(productId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productVariants)
    .leftJoin(inventory, eq(productVariants.id, inventory.variantId))
    .where(and(eq(productVariants.productId, productId), sql`${inventory.id} IS NULL`));

  return row?.count ?? 0;
}

export async function countMediaForProduct(productId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productMedia)
    .where(eq(productMedia.productId, productId));

  return row?.count ?? 0;
}

/* ------------------------------------------------------------------------ */
/* Sprint 01 — Product Images                                               */
/* ------------------------------------------------------------------------ */

export async function createPendingMediaRow(params: {
  uploadedById: string;
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
}) {
  return sharedMediaRepository.createPendingMediaRow({ ...params, type: 'IMAGE' });
}

export async function findMediaById(mediaId: string) {
  return sharedMediaRepository.findMediaById(mediaId);
}

export async function markMediaReady(mediaId: string, altText: string) {
  return sharedMediaRepository.markMediaReady(mediaId, altText);
}

export async function attachMediaToProduct(productId: string, input: AttachProductMediaInput) {
  return withTransaction(async (tx) => {
    if (input.isPrimary) {
      await tx
        .update(productMedia)
        .set({ isPrimary: false })
        .where(eq(productMedia.productId, productId));
    }

    const [{ maxOrder } = { maxOrder: -1 }] = await tx
      .select({ maxOrder: sql<number>`coalesce(max(${productMedia.displayOrder}), -1)::int` })
      .from(productMedia)
      .where(eq(productMedia.productId, productId));

    const [row] = await tx
      .insert(productMedia)
      .values({
        productId,
        mediaId: input.mediaId,
        variantId: input.variantId,
        mediaType: 'IMAGE',
        displayOrder: maxOrder + 1,
        isPrimary: input.isPrimary,
      })
      .returning();

    if (!row) throw new Error('Failed to create ProductMedia row.');
    return row;
  });
}

export async function findProductMediaRow(productId: string, productMediaId: string) {
  const [row] = await db
    .select()
    .from(productMedia)
    .where(and(eq(productMedia.id, productMediaId), eq(productMedia.productId, productId)))
    .limit(1);
  return row ?? null;
}

export async function updateProductMediaRow(
  productId: string,
  productMediaId: string,
  input: UpdateProductMediaInput,
) {
  return withTransaction(async (tx) => {
    if (input.isPrimary) {
      await tx
        .update(productMedia)
        .set({ isPrimary: false })
        .where(eq(productMedia.productId, productId));
    }

    const [row] = await tx
      .update(productMedia)
      .set({
        displayOrder: input.displayOrder,
        isPrimary: input.isPrimary,
      })
      .where(and(eq(productMedia.id, productMediaId), eq(productMedia.productId, productId)))
      .returning();

    if (row && input.altText) {
      await tx.update(media).set({ altText: input.altText }).where(eq(media.id, row.mediaId));
    }

    return row ?? null;
  });
}

export async function deleteProductMediaRow(productId: string, productMediaId: string) {
  const [row] = await db
    .delete(productMedia)
    .where(and(eq(productMedia.id, productMediaId), eq(productMedia.productId, productId)))
    .returning();
  return row ?? null;
}

/* ------------------------------------------------------------------------ */
/* Sprint 01 — Inventory Management                                         */
/* ------------------------------------------------------------------------ */

/**
 * Always a signed delta against the current row, applied inside a single
 * `UPDATE ... SET quantity_available = quantity_available + $delta` — never
 * read-then-write in application code, so concurrent adjustments (two
 * creators' requests, or a future checkout reservation) can never lose an
 * update to a race condition.
 */
export async function adjustVariantInventory(variantId: string, input: AdjustInventoryInput) {
  const [row] = await db
    .update(inventory)
    .set({
      quantityAvailable: sql`greatest(${inventory.quantityAvailable} + ${input.quantityDelta}, 0)`,
      ...(input.lowStockThreshold !== undefined ? { lowStockThreshold: input.lowStockThreshold } : {}),
      updatedAt: new Date(),
    })
    .where(eq(inventory.variantId, variantId))
    .returning();
  return row ?? null;
}

/** Sprint 02 — Inventory read (the CRUD's missing "R"; create/update already exist via variant creation and `adjustVariantInventory`). */
export async function findInventoryByVariantId(variantId: string) {
  const [row] = await db.select().from(inventory).where(eq(inventory.variantId, variantId)).limit(1);
  return row ?? null;
}

/* ------------------------------------------------------------------------ */
/* Sprint 02 — standalone Product Variant CRUD                              */
/* ------------------------------------------------------------------------ */

export async function findVariantBySku(skuReference: string) {
  const [row] = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.skuReference, skuReference))
    .limit(1);
  return row ?? null;
}

export async function countActiveVariantsForProduct(productId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productVariants)
    .where(and(eq(productVariants.productId, productId), eq(productVariants.status, 'ACTIVE')));
  return row?.count ?? 0;
}

export async function createProductVariant(productId: string, input: CreateProductVariantInput) {
  return withTransaction(async (tx) => {
    const [variant] = await tx
      .insert(productVariants)
      .values({
        productId,
        attributes: input.attributes,
        priceAmount: input.priceAmount,
        priceCurrency: input.priceCurrency,
        skuReference: input.skuReference,
      })
      .returning();
    if (!variant) throw new Error('Failed to create ProductVariant row.');

    await tx.insert(inventory).values({
      variantId: variant.id,
      quantityAvailable: input.initialQuantity,
    });

    return variant;
  });
}

export async function updateProductVariant(variantId: string, input: UpdateProductVariantInput) {
  const [row] = await db
    .update(productVariants)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(productVariants.id, variantId))
    .returning();
  return row ?? null;
}

/** Archives rather than hard-deletes — `orderItems.variantId` is `onDelete: 'restrict'` (historical orders must keep referencing the exact variant that was purchased), the same reasoning Products' own soft-delete already follows. */
export async function archiveProductVariant(variantId: string) {
  const [row] = await db
    .update(productVariants)
    .set({ status: 'ARCHIVED', updatedAt: new Date() })
    .where(eq(productVariants.id, variantId))
    .returning();
  return row ?? null;
}

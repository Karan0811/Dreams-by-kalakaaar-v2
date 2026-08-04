/**
 * Demo data seed script — realistic Indian handmade-marketplace data for
 * local development and manual testing. Separate from seed.ts (the RBAC
 * catalog, which is application-critical config every environment needs)
 * since this is optional demo content; run `npm run db:seed` first, then
 * this.
 *
 * Seeds only tables that actually exist in shared/db/schema/ today:
 *   Categories, Users (+ profiles + a real Argon2id-hashed password so every
 *   seeded account can actually log in), Creators, Stores, Products,
 *   ProductVariants, Inventory, Media, ProductMedia, ProductCategories.
 *
 * Deliberately does NOT seed Collections, Tags, Reviews, Wishlist, Cart,
 * Orders, or Addresses — none of those tables exist in the schema yet
 * (backend/SCOPE.md: Categories module implements only `Category` itself;
 * Products module implements only Product/Variant/Media/ProductCategory;
 * Cart/Checkout/Orders/Reviews are separate, undelivered modules). Adding
 * ad-hoc tables here to satisfy a seed-data checklist, without the actual
 * module/migration/API work behind them, would be exactly the kind of
 * parallel, unreviewed implementation this project's conventions rule out.
 *
 * Run with `npm run db:seed:demo`. Safe to re-run: every insert is
 * conflict-checked against a natural unique key (email, slug) and skipped
 * if it already exists, matching seed.ts's own idempotency convention.
 */
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
if (!process.env.DATABASE_URL) dotenv.config();

import * as schema from '@/shared/db/schema';
import { hashPassword } from '@/shared/auth/password';

type Db = ReturnType<typeof drizzle<typeof schema>>;

const DEMO_PASSWORD = 'DemoPass123!'; // every seeded account uses this — documented in docs/testing and CHANGELOG, not a production credential

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { name: 'Pottery & Ceramics', slug: 'pottery-ceramics', description: 'Hand-thrown and hand-built stoneware, terracotta, and glazed ceramics.' },
  { name: 'Textiles & Home Decor', slug: 'textiles-home-decor', description: 'Block-printed, hand-embroidered, and handwoven textiles and home accents.' },
  { name: 'Jewelry', slug: 'jewelry', description: 'Handcrafted jewelry in silver, brass, beadwork, and natural stone.' },
  { name: 'Resin Art', slug: 'resin-art', description: 'Cast resin coasters, trays, jewelry, and decor with embedded botanicals and pigments.' },
  { name: 'Wooden Crafts', slug: 'wooden-crafts', description: 'Carved and turned wooden home goods, toys, and decor.' },
  { name: 'Candles & Fragrance', slug: 'candles-fragrance', description: 'Hand-poured soy and beeswax candles, incense, and fragrance.' },
  { name: 'Paper Crafts', slug: 'paper-crafts', description: 'Handmade paper goods, quilling art, and miniature painting.' },
  { name: 'Leather Goods', slug: 'leather-goods', description: 'Hand-stitched leather bags, wallets, and accessories.' },
] as const;

// ---------------------------------------------------------------------------
// Creators (+ their User account + Store)
// ---------------------------------------------------------------------------

interface CreatorSeed {
  email: string;
  displayName: string;
  legalName: string;
  city: string;
  category: (typeof schema.creatorCategoryEnum.enumValues)[number];
  storeName: string;
  storeSlug: string;
  tagline: string;
  storeDescription: string;
  craftFocus: string;
  categorySlug: (typeof CATEGORIES)[number]['slug'];
}

const CREATORS: CreatorSeed[] = [
  {
    email: 'meera.krishnan@example.com',
    displayName: 'Meera Krishnan',
    legalName: 'Meera Krishnan',
    city: 'Chennai',
    category: 'INDEPENDENT_ARTISAN',
    storeName: 'Mitti & Moss',
    storeSlug: 'mitti-and-moss',
    tagline: 'Wheel-thrown stoneware for everyday tables',
    storeDescription:
      'Mitti & Moss is a one-person pottery studio in Chennai working in reduction-fired stoneware. Every piece is thrown on the wheel, trimmed by hand, and glazed in small batches — no two mugs are ever quite identical.',
    craftFocus: 'Stoneware pottery',
    categorySlug: 'pottery-ceramics',
  },
  {
    email: 'arjun.malhotra@example.com',
    displayName: 'Arjun Malhotra',
    legalName: 'Arjun Malhotra',
    city: 'Jaipur',
    category: 'SMALL_CREATIVE_STUDIO',
    storeName: 'Malhotra Block Print Co.',
    storeSlug: 'malhotra-block-print',
    tagline: 'Hand block-printed textiles from Sanganer',
    storeDescription:
      'A third-generation block-printing family workshop in Sanganer, Jaipur, carrying forward hand-carved teak blocks and natural indigo/madder dyes onto cotton and linen.',
    craftFocus: 'Block-printed textiles',
    categorySlug: 'textiles-home-decor',
  },
  {
    email: 'priya.nair@example.com',
    displayName: 'Priya Nair',
    legalName: 'Priya Nair',
    city: 'Kochi',
    category: 'INDEPENDENT_ARTISAN',
    storeName: 'Backwater Resin Studio',
    storeSlug: 'backwater-resin-studio',
    tagline: 'Resin art inspired by the Kerala backwaters',
    storeDescription:
      'Priya casts resin coasters, trays, and jewelry from her home studio in Kochi, layering pigments to echo the backwaters she grew up on. Every piece is cured and hand-sanded over several days.',
    craftFocus: 'Resin art',
    categorySlug: 'resin-art',
  },
  {
    email: 'rohan.deshpande@example.com',
    displayName: 'Rohan Deshpande',
    legalName: 'Rohan Deshpande',
    city: 'Pune',
    category: 'INDEPENDENT_ARTISAN',
    storeName: 'Deshpande Woodcraft',
    storeSlug: 'deshpande-woodcraft',
    tagline: 'Hand-carved sheesham wood, made to last generations',
    storeDescription:
      'Rohan trained under his father, a furniture carpenter in Pune, before turning to smaller hand-carved wooden goods — trays, coasters, and toys — in reclaimed sheesham and mango wood.',
    craftFocus: 'Wooden crafts',
    categorySlug: 'wooden-crafts',
  },
  {
    email: 'ananya.iyer@example.com',
    displayName: 'Ananya Iyer',
    legalName: 'Ananya Iyer',
    city: 'Bengaluru',
    category: 'EMERGING_ASPIRING',
    storeName: 'Ananya Iyer Jewelry',
    storeSlug: 'ananya-iyer-jewelry',
    tagline: 'Minimal silver jewelry, hand-fabricated in Bengaluru',
    storeDescription:
      'Ananya taught herself silversmithing during a career break and now hand-fabricates minimal sterling silver jewelry from a small studio in Bengaluru — sawing, soldering, and polishing every piece herself.',
    craftFocus: 'Silver jewelry',
    categorySlug: 'jewelry',
  },
  {
    email: 'kabir.singh@example.com',
    displayName: 'Kabir Singh',
    legalName: 'Kabir Singh',
    city: 'Amritsar',
    category: 'SMALL_CREATIVE_STUDIO',
    storeName: 'Singh Leather Works',
    storeSlug: 'singh-leather-works',
    tagline: 'Full-grain leather goods, hand-stitched in Amritsar',
    storeDescription:
      'A small two-person workshop in Amritsar hand-cutting and saddle-stitching full-grain leather into wallets, bags, and belts built to age well.',
    craftFocus: 'Leather goods',
    categorySlug: 'leather-goods',
  },
  {
    email: 'fatima.sheikh@example.com',
    displayName: 'Fatima Sheikh',
    legalName: 'Fatima Sheikh',
    city: 'Lucknow',
    category: 'INDEPENDENT_ARTISAN',
    storeName: 'Sheikh Chikankari',
    storeSlug: 'sheikh-chikankari',
    tagline: 'Traditional Lucknawi chikankari embroidery',
    storeDescription:
      'Fatima hand-embroiders chikankari on cotton and mulmul using techniques passed down through her family in Lucknow — each piece takes days of shadow-work and French knots by hand.',
    craftFocus: 'Chikankari embroidery',
    categorySlug: 'textiles-home-decor',
  },
  {
    email: 'vikram.rathore@example.com',
    displayName: 'Vikram Rathore',
    legalName: 'Vikram Rathore',
    city: 'Udaipur',
    category: 'INDEPENDENT_ARTISAN',
    storeName: 'Rathore Miniatures',
    storeSlug: 'rathore-miniatures',
    tagline: 'Rajasthani miniature painting on handmade paper',
    storeDescription:
      'Vikram paints in the Mewar miniature tradition on handmade cotton-rag paper, using natural pigments ground by hand and squirrel-hair brushes for the finest detail work.',
    craftFocus: 'Miniature painting',
    categorySlug: 'paper-crafts',
  },
];

// ---------------------------------------------------------------------------
// Buyer users (no store)
// ---------------------------------------------------------------------------

const BUYERS = [
  { email: 'aditya.rao@example.com', displayName: 'Aditya Rao' },
  { email: 'sneha.pillai@example.com', displayName: 'Sneha Pillai' },
  { email: 'karan.mehta@example.com', displayName: 'Karan Mehta' },
  { email: 'divya.reddy@example.com', displayName: 'Divya Reddy' },
  { email: 'ishaan.kapoor@example.com', displayName: 'Ishaan Kapoor' },
];

// ---------------------------------------------------------------------------
// Products — 2-4 per store, real Unsplash photography (not gray placeholder
// boxes) matched to each craft, real variant attributes, real starting stock.
// ---------------------------------------------------------------------------

interface ProductSeed {
  title: string;
  description: string;
  productType: 'READY_MADE' | 'MADE_TO_ORDER';
  leadTimeDays?: number;
  imageUrl: string;
  imageAlt: string;
  variants: { attributes: Record<string, string>; priceRupees: number; sku: string; stock: number }[];
}

const PRODUCTS_BY_STORE_SLUG: Record<string, ProductSeed[]> = {
  'mitti-and-moss': [
    {
      title: 'Reduction-Fired Stoneware Mug',
      description:
        'A wheel-thrown mug in warm reduction-fired stoneware, finished with a matte tenmoku glaze that breaks to rust at the rim. Holds about 300ml — comfortable for both coffee and chai.',
      productType: 'READY_MADE',
      imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=1200&q=80',
      imageAlt: 'Handmade stoneware mug with matte glaze',
      variants: [
        { attributes: { glaze: 'Tenmoku' }, priceRupees: 850, sku: 'MM-MUG-TEN', stock: 18 },
        { attributes: { glaze: 'Celadon' }, priceRupees: 850, sku: 'MM-MUG-CEL', stock: 12 },
      ],
    },
    {
      title: 'Terracotta Serving Bowl Set',
      description: 'A set of two hand-built terracotta serving bowls, unglazed on the outside and food-safe glazed within. Each bowl is subtly different in shape, thrown freehand rather than to a mold.',
      productType: 'READY_MADE',
      imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1200&q=80',
      imageAlt: 'Set of two terracotta serving bowls',
      variants: [{ attributes: { size: 'Set of 2' }, priceRupees: 1450, sku: 'MM-BOWL-SET2', stock: 9 }],
    },
    {
      title: 'Custom Glazed Dinner Plate Set',
      description: 'A made-to-order set of four dinner plates, thrown and glazed to your choice of finish. Allow up to 3 weeks — each set is fired together in one kiln load to keep the glaze consistent.',
      productType: 'MADE_TO_ORDER',
      leadTimeDays: 21,
      imageUrl: 'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=1200&q=80',
      imageAlt: 'Glazed stoneware dinner plates stacked',
      variants: [{ attributes: { setSize: 'Set of 4' }, priceRupees: 3200, sku: 'MM-PLATE-SET4', stock: 4 }],
    },
  ],
  'malhotra-block-print': [
    {
      title: 'Indigo Block-Printed Bedsheet Set',
      description: 'A king-size cotton bedsheet with two pillow covers, hand block-printed in natural indigo using a hundred-year-old teak block pattern from our family workshop.',
      productType: 'READY_MADE',
      imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
      imageAlt: 'Indigo block-printed cotton bedsheet',
      variants: [
        { attributes: { size: 'King' }, priceRupees: 2400, sku: 'MBP-BED-KING', stock: 15 },
        { attributes: { size: 'Queen' }, priceRupees: 2100, sku: 'MBP-BED-QUEEN', stock: 20 },
      ],
    },
    {
      title: 'Madder Root Table Runner',
      description: 'A cotton table runner dyed with madder root and block-printed with a floral booti pattern. 180cm long, hand-hemmed on both ends.',
      productType: 'READY_MADE',
      imageUrl: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=1200&q=80',
      imageAlt: 'Block-printed cotton table runner',
      variants: [{ attributes: { length: '180cm' }, priceRupees: 950, sku: 'MBP-RUNNER-180', stock: 25 }],
    },
  ],
  'backwater-resin-studio': [
    {
      title: 'Backwater Coaster Set of 4',
      description: 'Four resin coasters layered in blues and greens to echo the Kerala backwaters, each with a thin gold-leaf shoreline. Cork-backed, heat resistant to 60°C.',
      productType: 'READY_MADE',
      imageUrl: 'https://images.unsplash.com/photo-1605883705077-8d3d3cebe78c?w=1200&q=80',
      imageAlt: 'Ocean-themed resin coasters',
      variants: [{ attributes: { setSize: 'Set of 4' }, priceRupees: 1100, sku: 'BRS-COAST-4', stock: 22 }],
    },
    {
      title: 'Pressed Flower Resin Tray',
      description: 'A rectangular serving tray with real pressed hibiscus and bougainvillea suspended in clear resin, brass handles on either end.',
      productType: 'READY_MADE',
      imageUrl: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=1200&q=80',
      imageAlt: 'Resin tray with pressed flowers',
      variants: [{ attributes: { size: '30x20cm' }, priceRupees: 1850, sku: 'BRS-TRAY-30', stock: 7 }],
    },
    {
      title: 'Custom Resin Nameplate',
      description: 'A made-to-order resin nameplate with your family name embedded in gold leaf over a marbled pigment base. Weatherproof for outdoor use. Please allow up to 10 days.',
      productType: 'MADE_TO_ORDER',
      leadTimeDays: 10,
      imageUrl: 'https://images.unsplash.com/photo-1618221639120-2eb6a234e7e0?w=1200&q=80',
      imageAlt: 'Marbled resin nameplate',
      variants: [{ attributes: { size: 'Standard' }, priceRupees: 1600, sku: 'BRS-NAME-STD', stock: 30 }],
    },
  ],
  'deshpande-woodcraft': [
    {
      title: 'Sheesham Wood Chopping Board',
      description: 'A hand-carved end-grain chopping board in reclaimed sheesham wood, oiled with food-safe mineral oil. Self-healing surface, kind to knife edges.',
      productType: 'READY_MADE',
      imageUrl: 'https://images.unsplash.com/photo-1591129841117-3adfd313e34f?w=1200&q=80',
      imageAlt: 'Sheesham wood chopping board',
      variants: [
        { attributes: { size: 'Large' }, priceRupees: 1350, sku: 'DW-BOARD-L', stock: 14 },
        { attributes: { size: 'Medium' }, priceRupees: 950, sku: 'DW-BOARD-M', stock: 20 },
      ],
    },
    {
      title: 'Hand-Turned Mango Wood Bowls',
      description: 'A pair of hand-turned bowls in mango wood, each with visible grain and a subtle natural edge left from the original log.',
      productType: 'READY_MADE',
      imageUrl: 'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?w=1200&q=80',
      imageAlt: 'Hand-turned mango wood bowls',
      variants: [{ attributes: { setSize: 'Pair' }, priceRupees: 1600, sku: 'DW-BOWL-PAIR', stock: 10 }],
    },
  ],
  'ananya-iyer-jewelry': [
    {
      title: 'Hammered Silver Cuff',
      description: 'A hand-hammered sterling silver cuff with an organic, irregular texture. Adjustable to fit most wrist sizes.',
      productType: 'READY_MADE',
      imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&q=80',
      imageAlt: 'Hammered silver cuff bracelet',
      variants: [{ attributes: { finish: 'Brushed' }, priceRupees: 2200, sku: 'AIJ-CUFF-BR', stock: 16 }],
    },
    {
      title: 'Minimal Silver Stud Earrings',
      description: 'Small hand-sawn sterling silver studs in three simple geometric shapes — circle, bar, and triangle. Sold as a set.',
      productType: 'READY_MADE',
      imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200&q=80',
      imageAlt: 'Minimal silver stud earrings',
      variants: [{ attributes: { setSize: 'Set of 3 pairs' }, priceRupees: 1400, sku: 'AIJ-STUD-SET3', stock: 25 }],
    },
  ],
  'singh-leather-works': [
    {
      title: 'Full-Grain Bifold Wallet',
      description: 'A hand-cut and saddle-stitched bifold wallet in full-grain buffalo leather, with four card slots and a bill compartment. Develops a rich patina with use.',
      productType: 'READY_MADE',
      imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&q=80',
      imageAlt: 'Full-grain leather bifold wallet',
      variants: [
        { attributes: { color: 'Tan' }, priceRupees: 1800, sku: 'SLW-WALLET-TAN', stock: 20 },
        { attributes: { color: 'Dark Brown' }, priceRupees: 1800, sku: 'SLW-WALLET-BR', stock: 18 },
      ],
    },
    {
      title: 'Hand-Stitched Leather Tote',
      description: 'A roomy everyday tote in full-grain leather with a canvas lining, hand-stitched edges, and brass hardware.',
      productType: 'READY_MADE',
      imageUrl: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=1200&q=80',
      imageAlt: 'Hand-stitched leather tote bag',
      variants: [{ attributes: { color: 'Tan' }, priceRupees: 4200, sku: 'SLW-TOTE-TAN', stock: 8 }],
    },
  ],
  'sheikh-chikankari': [
    {
      title: 'Chikankari Cotton Kurta',
      description: 'An unstitched cotton kurta piece hand-embroidered with traditional chikankari shadow-work and French knots along the neckline and sleeves.',
      productType: 'MADE_TO_ORDER',
      leadTimeDays: 14,
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=1200&q=80',
      imageAlt: 'White chikankari embroidered cotton fabric',
      variants: [
        { attributes: { size: 'M' }, priceRupees: 2600, sku: 'SC-KURTA-M', stock: 6 },
        { attributes: { size: 'L' }, priceRupees: 2600, sku: 'SC-KURTA-L', stock: 6 },
      ],
    },
    {
      title: 'Chikankari Dupatta',
      description: 'A mulmul cotton dupatta with all-over chikankari booti work, hand-embroidered over roughly 40 hours.',
      productType: 'READY_MADE',
      imageUrl: 'https://images.unsplash.com/photo-1610030181087-540f829eb849?w=1200&q=80',
      imageAlt: 'White embroidered cotton dupatta',
      variants: [{ attributes: { size: 'Standard' }, priceRupees: 1900, sku: 'SC-DUPATTA-STD', stock: 11 }],
    },
  ],
  'rathore-miniatures': [
    {
      title: 'Mewar Miniature Painting — Elephant Procession',
      description: 'An original miniature painting in the Mewar tradition, hand-painted with natural pigments on handmade cotton-rag paper, depicting a royal elephant procession.',
      productType: 'READY_MADE',
      imageUrl: 'https://images.unsplash.com/photo-1582561833360-2a09dd0f1d1c?w=1200&q=80',
      imageAlt: 'Traditional Indian miniature painting',
      variants: [{ attributes: { size: '20x15cm' }, priceRupees: 3800, sku: 'RM-PAINT-ELE', stock: 3 }],
    },
    {
      title: 'Handmade Paper Notebook',
      description: 'A hand-bound notebook using leftover handmade cotton-rag paper offcuts from the studio, with a miniature-painted motif on the cover.',
      productType: 'READY_MADE',
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&q=80',
      imageAlt: 'Handmade paper notebook with painted cover',
      variants: [{ attributes: { pages: '120' }, priceRupees: 650, sku: 'RM-NOTE-120', stock: 30 }],
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function findOrCreateUser(
  db: Db,
  input: { email: string; displayName: string; roleName: 'Buyer' },
): Promise<string> {
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, input.email)).limit(1);
  if (existing[0]) return existing[0].id;

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const [user] = await db
    .insert(schema.users)
    .values({
      email: input.email,
      name: input.displayName,
      emailVerified: true,
      status: 'ACTIVE',
    })
    .returning();
  if (!user) throw new Error(`Failed to create user ${input.email}`);

  await db.insert(schema.userProfiles).values({ userId: user.id, displayName: input.displayName });
  await db.insert(schema.authenticationAccounts).values({
    userId: user.id,
    provider: 'credential',
    providerAccountId: input.email,
    passwordHash,
  });

  const [role] = await db
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.name, input.roleName))
    .limit(1);
  if (role) {
    await db.insert(schema.userRoles).values({ userId: user.id, roleId: role.id }).onConflictDoNothing();
  }

  return user.id;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required to run the seed script.');

  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client, { schema });

  // --- Categories ---
  console.log('Seeding categories...');
  const categoryIdBySlug = new Map<string, string>();
  for (const category of CATEGORIES) {
    await db.insert(schema.categories).values(category).onConflictDoNothing({ target: schema.categories.slug });
    const [row] = await db.select().from(schema.categories).where(eq(schema.categories.slug, category.slug)).limit(1);
    if (row) categoryIdBySlug.set(category.slug, row.id);
  }

  // --- Buyers ---
  console.log('Seeding buyer accounts...');
  for (const buyer of BUYERS) {
    await findOrCreateUser(db, { email: buyer.email, displayName: buyer.displayName, roleName: 'Buyer' });
  }

  // --- Creators, Stores, Products ---
  console.log('Seeding creators, stores, and products...');
  for (const creatorSeed of CREATORS) {
    const userId = await findOrCreateUser(db, {
      email: creatorSeed.email,
      displayName: creatorSeed.displayName,
      roleName: 'Buyer', // every account is also a buyer first, per createCreatorApplication's real flow
    });

    let creatorId: string;
    const existingCreator = await db.select().from(schema.creators).where(eq(schema.creators.userId, userId)).limit(1);
    if (existingCreator[0]) {
      creatorId = existingCreator[0].id;
    } else {
      const [creator] = await db
        .insert(schema.creators)
        .values({
          userId,
          legalName: creatorSeed.legalName,
          category: creatorSeed.category,
          onboardingStatus: 'ACTIVE',
          approvedAt: new Date(),
        })
        .returning();
      if (!creator) throw new Error(`Failed to create creator for ${creatorSeed.email}`);
      creatorId = creator.id;
    }

    let storeId: string;
    const existingStore = await db.select().from(schema.stores).where(eq(schema.stores.slug, creatorSeed.storeSlug)).limit(1);
    if (existingStore[0]) {
      storeId = existingStore[0].id;
    } else {
      const [store] = await db
        .insert(schema.stores)
        .values({
          creatorId,
          name: creatorSeed.storeName,
          slug: creatorSeed.storeSlug,
          tagline: creatorSeed.tagline,
          description: creatorSeed.storeDescription,
          status: 'ACTIVE',
          craftFocus: creatorSeed.craftFocus,
          launchDate: new Date(),
        })
        .returning();
      if (!store) throw new Error(`Failed to create store ${creatorSeed.storeSlug}`);
      storeId = store.id;

      // Creator Team Owner is a STORE-scoped role (roleScopeEnum), granted
      // against this specific store — matching modules/creators/service.ts's
      // real createCreatorApplication flow, not a platform-wide grant.
      const [ownerRole] = await db
        .select()
        .from(schema.roles)
        .where(eq(schema.roles.name, 'Creator Team Owner'))
        .limit(1);
      if (ownerRole) {
        await db
          .insert(schema.userRoles)
          .values({ userId, roleId: ownerRole.id, storeId })
          .onConflictDoNothing();
      }
    }

    const categoryId = categoryIdBySlug.get(creatorSeed.categorySlug);
    const products = PRODUCTS_BY_STORE_SLUG[creatorSeed.storeSlug] ?? [];

    for (const productSeed of products) {
      const slug = `${slugify(productSeed.title)}-${storeId.slice(0, 8)}`;
      const existingProduct = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.slug, slug))
        .limit(1);
      if (existingProduct[0]) continue; // already seeded

      const [product] = await db
        .insert(schema.products)
        .values({
          storeId,
          title: productSeed.title,
          slug,
          description: productSeed.description,
          productType: productSeed.productType,
          status: 'ACTIVE',
          leadTimeDays: productSeed.leadTimeDays,
          primaryCategoryId: categoryId,
        })
        .returning();
      if (!product) throw new Error(`Failed to create product ${productSeed.title}`);

      if (categoryId) {
        await db
          .insert(schema.productCategories)
          .values({ productId: product.id, categoryId, isPrimary: true })
          .onConflictDoNothing();
      }

      for (const variantSeed of productSeed.variants) {
        const [variant] = await db
          .insert(schema.productVariants)
          .values({
            productId: product.id,
            attributes: variantSeed.attributes,
            priceAmount: variantSeed.priceRupees * 100,
            priceCurrency: 'INR',
            skuReference: variantSeed.sku,
            status: 'ACTIVE',
          })
          .returning();
        if (!variant) throw new Error(`Failed to create variant ${variantSeed.sku}`);

        await db.insert(schema.inventory).values({
          variantId: variant.id,
          quantityAvailable: variantSeed.stock,
          lowStockThreshold: Math.max(2, Math.round(variantSeed.stock * 0.15)),
        });
      }

      // One representative photo per product, sourced from Unsplash (real
      // photography, not a gray placeholder box) — matches the real
      // two-step upload flow's *result* (a READY media row with a public
      // URL), just without actually round-tripping through R2 for seed data.
      const [mediaRow] = await db
        .insert(schema.media)
        .values({
          uploadedById: userId,
          type: 'IMAGE',
          status: 'READY',
          storageKey: `seed/${product.id}.jpg`,
          publicUrl: productSeed.imageUrl,
          mimeType: 'image/jpeg',
          sizeBytes: 250_000,
          altText: productSeed.imageAlt,
        })
        .returning();
      if (mediaRow) {
        await db.insert(schema.productMedia).values({
          productId: product.id,
          mediaId: mediaRow.id,
          mediaType: 'IMAGE',
          displayOrder: 0,
          isPrimary: true,
        });
      }
    }
  }

  console.log('Demo data seed complete.');
  console.log(`Every seeded account's password is: ${DEMO_PASSWORD}`);
  await client.end();
}

main().catch((error) => {
  console.error('Demo data seed failed:', error);
  process.exit(1);
});

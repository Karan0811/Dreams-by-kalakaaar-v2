/**
 * Schema barrel — re-exports every domain's tables/relations/enums so
 * `shared/db/client.ts` can build a single Drizzle instance typed against
 * the complete schema, and so consuming modules import from one place
 * (`@/shared/db/schema`) rather than reaching into individual domain files.
 */
export * from './identity';
export * from './authorization';
export * from './marketplace';
export * from './categories';
export * from './media';
export * from './inventory';
export * from './product';

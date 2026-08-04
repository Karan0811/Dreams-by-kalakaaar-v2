/**
 * Cross-cutting shared types. See 08-database-design.md (money-as-minor-units,
 * UUID id strategy) and 09-api-architecture.md (pagination envelope, error
 * envelope, correlation IDs).
 */

/** A UUID, per 08-database-design.md's ID strategy. Branded so a raw string
 * cannot be passed where an Id is expected without an explicit cast. */
export type Id = string & { readonly __brand: "Id" };

/** The one sanctioned place to construct an `Id` from a raw string (test
 * fixtures, or wherever a value already known to be a UUID needs the brand
 * applied) — avoids `as never`/`as Id` casts scattered across call sites. */
export function createId(value: string): Id {
  return value as Id;
}

/**
 * Money is always modeled as minor units (e.g., paise, not rupees) per
 * 08-database-design.md's money philosophy, paired with an ISO 4217 currency
 * code. Never render `amountMinor` directly — always go through
 * `@dbk/utils/formatting` money formatters.
 */
export interface Money {
  amountMinor: number;
  currency: "INR";
}

/** 09-api-architecture.md §2.7 cursor pagination envelope. Sprint 01 adds
 * optional page/totalPages for the Products list endpoint's price/popularity
 * sorts, which use page-number pagination instead of the keyset cursor above
 * (see @dbk/api-client's buildFilterParams doc comment). Every existing
 * cursor-based caller is unaffected — these two fields are simply absent. */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    /** Matches the backend's actual field name exactly (shared/validation/common-schemas.ts). */
    totalCount?: number;
    page?: number | null;
    totalPages?: number | null;
  };
}

/** 09-api-architecture.md §2.6 numbered pagination envelope (Admin/Internal tables). */
export interface PagedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

/**
 * 09-api-architecture.md §2.15 error envelope. `code` is the
 * machine-readable, SCREAMING_SNAKE_CASE discriminator UI branches on;
 * `message` is never shown to end users directly (Section 10.9 of
 * 11-frontend-architecture.md) — always mapped through errorMessages.ts.
 */
export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    correlationId: string;
  };
}

export type AvailabilityStatus = "in_stock" | "low_stock" | "made_to_order" | "sold_out";

export type SortOrder = "asc" | "desc";

import { z } from 'zod';

/**
 * Shared Zod primitives — 10-backend-architecture.md Section 9.4,
 * 09-api-architecture.md Sections 2.7 (pagination), 2.11 (money), 2.14 (UUIDs).
 *
 * Every module's `schemas.ts` composes these rather than redefining UUID,
 * money, or pagination validation locally, keeping the rules that matter for
 * consistency (money is minor units + ISO 4217, IDs are canonical UUIDs)
 * centrally owned.
 */

export const uuidSchema = z.string().uuid({ message: 'must be a valid UUID' });

export const isoCurrencyCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, 'must be a 3-letter ISO 4217 currency code');

/** Money is always integer minor units + an explicit currency code — never a float. */
export const moneySchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: isoCurrencyCodeSchema,
});

/** Cursor-pagination request parameters — 09-api-architecture.md Section 2.7. */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  includeTotalCount: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => v === 'true'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginationEnvelope<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
    totalCount?: number;
    /**
     * Sprint 01 — populated only for listing endpoints/sorts that use
     * page-number pagination instead of the keyset cursor above (see
     * `modules/products/schemas.ts`'s `productSortSchema` doc comment).
     * `null` for every cursor-paginated response.
     */
    page?: number | null;
    totalPages?: number | null;
  };
}

/** ISO 8601 UTC timestamp string, per 09-api-architecture.md Section 2.12. */
export const isoTimestampSchema = z.string().datetime({ offset: false });

/**
 * Password policy — 12-security-architecture.md Section 5.2: minimum 12
 * characters, breached-password screening (`shared/auth/breach-check.ts`),
 * no arbitrary complexity-character-class rule.
 *
 * NOTE: 09-api-architecture.md Section 3.2 states "minimum 10 characters,
 * must include at least one letter and one number" for this same field,
 * which conflicts with the rule below. That section's own text defers
 * ownership of "the specific policy" to Security (Section 22.1), and
 * 12-security-architecture.md Section 5.2 gives a reasoned, explicit
 * rationale for rejecting complexity-class rules — so this schema follows
 * the Security document as the more specific and self-nominated authority.
 */
export const passwordSchema = z
  .string()
  .min(12, 'must be at least 12 characters')
  .max(128, 'must be at most 128 characters');

export const emailSchema = z.string().email().max(254).toLowerCase();

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'must be at least 2 characters')
  .max(50, 'must be at most 50 characters');

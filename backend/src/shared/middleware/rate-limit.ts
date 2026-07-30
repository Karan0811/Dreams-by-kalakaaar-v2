import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/shared/redis/client';
import { env } from '@/shared/config/env';
import { RateLimitError } from '@/shared/errors/base-errors';

/**
 * Rate limiting — 10-backend-architecture.md Section 13.7,
 * 12-security-architecture.md Section 8.3's tiered limits.
 *
 * Fail-closed behavior (12-security-architecture.md Section 5.9): if the
 * Redis check itself cannot complete, the request is rejected, not allowed
 * through unchecked — a brief, honest degradation is preferred over opening
 * a brute-force window during a cache outage.
 */
export type RateLimitTier = 'auth' | 'standard' | 'public' | 'payment';

const limiters: Record<RateLimitTier, Ratelimit> = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(env.RATE_LIMIT_AUTH_PER_IP, '1 m'),
    prefix: 'ratelimit:auth',
  }),
  standard: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(env.RATE_LIMIT_STANDARD_PER_ACCOUNT, '1 m'),
    prefix: 'ratelimit:standard',
  }),
  public: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(env.RATE_LIMIT_PUBLIC_PER_IP, '1 m'),
    prefix: 'ratelimit:public',
  }),
  payment: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'ratelimit:payment',
  }),
};

export interface RateLimitResult {
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Checks the given tier's sliding-window limit for `identifier` (an IP,
 * account ID, or `ip:accountId` composite key per
 * 12-security-architecture.md Section 5.9's dual-keying requirement for the
 * `auth` tier). Throws {@link RateLimitError} on rejection or on a Redis
 * failure (fail-closed).
 */
export async function enforceRateLimit(
  tier: RateLimitTier,
  identifier: string,
): Promise<RateLimitResult> {
  try {
    const { success, limit, remaining, reset } = await limiters[tier].limit(identifier);

    if (!success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      throw new RateLimitError('Rate limit exceeded. Please slow down.', retryAfterSeconds);
    }

    return { limit, remaining, reset };
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    // Redis unreachable or another unexpected failure — fail closed (Section 5.9).
    throw new RateLimitError(
      'Rate limiting is temporarily unavailable; please try again shortly.',
      30,
    );
  }
}

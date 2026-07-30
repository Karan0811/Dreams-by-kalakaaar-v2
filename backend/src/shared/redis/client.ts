import { Redis } from '@upstash/redis';
import { env } from '@/shared/config/env';

/**
 * Upstash Redis client — 10-backend-architecture.md Section 13.
 *
 * Backs the cache hierarchy (13.2), rate limiting (13.7), and session
 * caching (13.6). A single shared client instance per serverless invocation
 * (Upstash's REST-based client is HTTP-native and connection-pooling-free by
 * design, which is precisely why it — rather than a TCP Redis client — is
 * the documented choice for a serverless deployment target, Section 2.10).
 */
export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

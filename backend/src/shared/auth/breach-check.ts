import { createHash } from 'node:crypto';
import { createModuleLogger } from '@/shared/observability/logger';

const logger = createModuleLogger('auth.breach-check');

/**
 * Breached-password screening — 12-security-architecture.md Section 5.2.
 *
 * Queries the Have I Been Pwned Passwords k-anonymity range API by SHA-1
 * prefix hash only — the first 5 hex characters are sent, never the
 * password or its full hash, so the third party never sees anything that
 * could reconstruct the actual password.
 *
 * Fails open (returns `false` — "not known to be breached") if the
 * third-party API is unreachable, logging a warning rather than blocking
 * registration/password-change on an external outage; this is a
 * risk-reduction control, not the primary defense (Argon2id + rate limiting
 * are), so availability of signup takes priority over this specific check.
 */
export async function isPasswordBreached(password: string): Promise<boolean> {
  const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) {
      logger.warn('HIBP range lookup returned non-OK status', { status: response.status });
      return false;
    }

    const body = await response.text();
    return body.split('\r\n').some((line) => line.split(':')[0] === suffix);
  } catch (error) {
    logger.warn('HIBP range lookup failed; failing open', { error: String(error) });
    return false;
  }
}

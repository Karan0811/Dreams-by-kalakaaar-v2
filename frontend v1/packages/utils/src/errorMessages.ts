/**
 * Maps machine-readable API error codes (09-api-architecture.md §2.15) to
 * user-facing copy. `error.message` from the API is never shown to a user
 * directly (11-frontend-architecture.md §10.9) — always look up `code` here.
 * Codes without an explicit entry fall back to `DEFAULT_ERROR_MESSAGE`.
 */

// FIX (production audit): with `noUncheckedIndexedAccess` on, indexing (or
// even dot-accessing) a `Record<string, string>` returns `string | undefined`
// — including `errorMessages.DEFAULT` itself, since a `Record` type carries
// no guarantee any particular key exists. Keeping the fallback as its own
// plain `string` constant, rather than reading it back out of the map,
// gives `getErrorMessage` a return type that's actually `string`.
export const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

export const errorMessages: Record<string, string> = {
  VALIDATION_ERROR: "Please check the highlighted fields and try again.",
  INVALID_CREDENTIALS: "That email or password doesn't look right. Please try again.",
  EMAIL_ALREADY_REGISTERED:
    "We couldn't complete that sign-up. Please try signing in instead, or use a different email.",
  INSUFFICIENT_STOCK:
    "This item's availability changed while you were browsing. We've updated it below.",
  RATE_LIMITED: "Too many attempts. Please wait a moment before trying again.",
  UNAUTHORIZED: "Please sign in to continue.",
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  SERVER_ERROR: "Something went wrong on our end. Please try again in a moment.",
  NETWORK_ERROR: "We couldn't reach Dreams by Kalakaaar. Please check your connection.",
  DEFAULT: DEFAULT_ERROR_MESSAGE,
};

export function getErrorMessage(code: string | undefined | null): string {
  if (!code) return DEFAULT_ERROR_MESSAGE;
  return errorMessages[code] ?? DEFAULT_ERROR_MESSAGE;
}

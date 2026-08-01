/**
 * Plain-function validators for imperative checks that aren't part of a
 * react-hook-form + zod flow — e.g. clamping a quantity stepper's value, or
 * checking a slug an Autocomplete just resolved. For form field validation,
 * use the zod schemas in validation/shared-schemas.ts and
 * validation/auth-schemas.ts instead; don't duplicate those rules here.
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Clamps `value` into the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

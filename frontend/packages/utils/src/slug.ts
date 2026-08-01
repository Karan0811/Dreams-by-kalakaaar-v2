/**
 * Generates a URL-safe slug from arbitrary text. Products' own slugs are
 * assigned server-side at creation time (08-database-design.md) — this is
 * for anything client-side that needs a slug preview before submit (e.g. a
 * Creator Product form live-previewing the URL as the title is typed), and
 * for any future module (categories, creator handles) needing the same
 * transformation.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

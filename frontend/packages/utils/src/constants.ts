/**
 * Cross-cutting constants. Values here should stay in sync with their CSS
 * counterparts by hand (BREAKPOINTS_PX mirrors the media query breakpoints
 * baked into @dbk/config/tailwind/theme.css) — there's no single source of
 * truth shared between CSS and JS without a build step this repo doesn't
 * have, so a change to one requires manually updating the other.
 */

/** Mirrors Tailwind's default breakpoints, which @dbk/config/tailwind
 * doesn't override. Needed wherever a component must branch in JS (e.g.
 * `window.matchMedia`) rather than in a Tailwind class. */
export const BREAKPOINTS_PX = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/** Default page size for numbered pagination (PagedResponse). */
export const DEFAULT_PAGE_SIZE = 20;

/** Default debounce window for search inputs. */
export const DEFAULT_DEBOUNCE_MS = 300;

/** Product image upload limits (Creator app's Image Upload UI). */
export const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_PRODUCT_IMAGES = 8;

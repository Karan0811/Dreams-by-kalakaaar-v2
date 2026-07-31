/**
 * Small, framework-agnostic image math helpers. Actual rendering/fallback
 * behavior lives in @dbk/ui's `Image`/`ImagePlaceholder` components — this
 * module is just the pure calculations those components (and any future
 * one) can share.
 */

/** Converts a width/height pair into the padding-top percentage used by the
 * legacy aspect-ratio box technique. Prefer CSS `aspect-ratio` directly in
 * new code — this exists for any context that can't use it (e.g. an email
 * template, which this platform's Resend emails may eventually need). */
export function aspectRatioToPaddingTop(width: number, height: number): string {
  return `${(height / width) * 100}%`;
}

/**
 * A tiny, solid-color base64 PNG data URL to use as next/image's `blurDataURL`
 * when no real low-res placeholder is available server-side yet. Matches
 * the design system's `background-subtle` token color so the blur-up looks
 * intentional rather than a generic gray box.
 */
export const DEFAULT_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

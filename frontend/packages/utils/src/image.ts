/**
 * Small, framework-agnostic image math helpers. Actual rendering/fallback
 * behavior lives in @dbk/ui's `Image`/`ImagePlaceholder` components — this
 * module is just the pure calculations those components (and any future
 * one) can share.
 */

import { ValidationError } from "./errors";

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

/**
 * Everything below this point is browser-only (uses `Image`/`canvas`),
 * unlike the pure-math helpers above — only call these from client-side
 * upload flows, never from a Server Component or Route Handler.
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

/** Reads a File's pixel dimensions by decoding it in an offscreen `Image`.
 * Rejects if the file isn't a decodable image. */
export function readImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image's dimensions."));
    };
    img.src = url;
  });
}

/** Validates a File's pixel dimensions against optional min/max bounds.
 * Throws `ValidationError` (matching `validateImageUpload`'s pattern) with
 * end-user-safe copy on failure. */
export async function validateImageDimensions(
  file: File,
  options: { minWidth?: number; minHeight?: number; maxWidth?: number; maxHeight?: number },
): Promise<ImageDimensions> {
  const dimensions = await readImageDimensions(file);
  const { minWidth, minHeight, maxWidth, maxHeight } = options;

  if (minWidth && dimensions.width < minWidth) {
    throw new ValidationError(`This image is too narrow. Please upload an image at least ${minWidth}px wide.`);
  }
  if (minHeight && dimensions.height < minHeight) {
    throw new ValidationError(`This image is too short. Please upload an image at least ${minHeight}px tall.`);
  }
  if (maxWidth && dimensions.width > maxWidth) {
    throw new ValidationError(`This image is too wide. Please upload an image at most ${maxWidth}px wide.`);
  }
  if (maxHeight && dimensions.height > maxHeight) {
    throw new ValidationError(`This image is too tall. Please upload an image at most ${maxHeight}px tall.`);
  }

  return dimensions;
}

/** Client-side JPEG re-encode via canvas, scaling down to `maxWidth` if
 * needed and re-compressing at `quality`. This is a size-reduction
 * convenience for uploads, not a lossless operation — don't use it
 * anywhere the original bytes must be preserved (e.g. re-compressing
 * would be wrong for a print-quality asset). */
export function compressImage(file: File, options: { maxWidth?: number; quality?: number } = {}): Promise<File> {
  const { maxWidth = 1920, quality = 0.82 } = options;

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const scale = Math.min(1, maxWidth / img.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context is unavailable in this browser."));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not compress this image."));
            return;
          }
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image for compression."));
    };
    img.src = url;
  });
}

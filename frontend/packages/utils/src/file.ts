import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_FILE_SIZE_BYTES } from "./constants";
import { ValidationError } from "./errors";

/** Formats a byte count as a human-readable size string, e.g. "2.4 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"] as const;
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const unit = units[exponent] ?? "GB";
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(1)} ${unit}`;
}

export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot === -1 ? "" : fileName.slice(lastDot + 1).toLowerCase();
}

/**
 * Client-side pre-flight validation for image uploads (Creator's Image
 * Upload UI), run before the file ever reaches R2. Throws `ValidationError`
 * with end-user-safe copy on the first failing check — callers show
 * `error.message` directly, same as any other client-side validation
 * failure (see errors.ts's ValidationError doc comment).
 */
export function validateImageUpload(
  file: Pick<File, "size" | "type">,
  options?: { maxSizeBytes?: number; allowedTypes?: readonly string[] },
): void {
  const maxSizeBytes = options?.maxSizeBytes ?? MAX_UPLOAD_FILE_SIZE_BYTES;
  const allowedTypes = options?.allowedTypes ?? ALLOWED_IMAGE_MIME_TYPES;

  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError(`That file type isn't supported. Please upload a ${allowedTypes.join(", ")} image.`);
  }

  if (file.size > maxSizeBytes) {
    throw new ValidationError(`That image is too large. Please upload a file under ${formatFileSize(maxSizeBytes)}.`);
  }
}

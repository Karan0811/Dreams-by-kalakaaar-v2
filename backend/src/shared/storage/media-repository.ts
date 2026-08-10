import { eq } from 'drizzle-orm';
import { db } from '@/shared/db/client';
import { media } from '@/shared/db/schema';

/**
 * Shared `media` row repository — Sprint 02 extraction.
 *
 * The two-step "request a presigned URL, then confirm+attach" flow
 * (`10-backend-architecture.md` Section 11) was built once already by the
 * Products module for Product Images (`modules/products/repository.ts`,
 * Sprint 01). Creator Documents needs the exact same pending-upload
 * lifecycle against the same `media` table, so this module extracts the
 * table-level operations to `shared/` rather than re-implementing them —
 * `modules/products/repository.ts`'s own `createPendingMediaRow` /
 * `findMediaById` / `markMediaReady` now delegate here unchanged (same
 * signatures, same behavior), so nothing that already calls them breaks.
 */

export async function createPendingMediaRow(params: {
  uploadedById: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const [row] = await db
    .insert(media)
    .values({
      uploadedById: params.uploadedById,
      type: params.type,
      status: 'PENDING_UPLOAD',
      storageKey: params.storageKey,
      publicUrl: params.publicUrl,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
    })
    .returning();

  if (!row) throw new Error('Failed to create Media row.');
  return row;
}

export async function findMediaById(mediaId: string) {
  const [row] = await db.select().from(media).where(eq(media.id, mediaId)).limit(1);
  return row ?? null;
}

export async function markMediaReady(mediaId: string, altText?: string) {
  const [row] = await db
    .update(media)
    .set({ status: 'READY', ...(altText !== undefined ? { altText } : {}) })
    .where(eq(media.id, mediaId))
    .returning();
  return row ?? null;
}

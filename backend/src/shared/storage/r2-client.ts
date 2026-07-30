import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/shared/config/env';

/**
 * Cloudflare R2 client — 10-backend-architecture.md Section 11 (Media &
 * File Storage). R2 exposes an S3-compatible API, so the standard AWS SDK
 * is used against R2's endpoint rather than a Cloudflare-specific SDK.
 *
 * SCOPE NOTE (backend/SCOPE.md): this phase provides the storage primitive
 * (presigned direct-upload URLs + delete) that the future Media module's
 * processing pipeline builds on. No Route Handler in this phase calls it
 * yet — Product/Creator media attachment is deferred alongside the rest of
 * the Media module (see `shared/db/schema/media.ts`'s scope note).
 */
function getClient(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? '',
    },
  });
}

export async function createPresignedUploadUrl(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: params.key,
    ContentType: params.contentType,
  });

  return getSignedUrl(client, command, { expiresIn: params.expiresInSeconds ?? 300 });
}

export async function deleteObject(key: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
}

export function publicUrlForKey(key: string): string {
  const base = env.R2_PUBLIC_URL ?? `https://${env.R2_BUCKET_NAME}.r2.dev`;
  return `${base}/${key}`;
}

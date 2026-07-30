import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { env } from '@/shared/config/env';

/**
 * Field-level encryption — 08-database-design.md Section 29.1 (sensitive
 * fields, e.g. `creators.taxIdentifierEncrypted`, are encrypted at the
 * application layer before write, not relied upon to be protected by
 * disk-level encryption alone).
 *
 * AES-256-GCM: the key is derived (SHA-256) from `BETTER_AUTH_SECRET`
 * rather than requiring yet another secret to provision, since this
 * project's threat model already treats that secret as the root key
 * material an attacker would need first. Ciphertext is stored as
 * `iv:authTag:ciphertext`, all base64url, so it round-trips through a
 * single `text` column.
 */
const ALGORITHM = 'aes-256-gcm';

function deriveKey(): Buffer {
  return createHash('sha256').update(env.BETTER_AUTH_SECRET).digest();
}

export function encryptField(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('base64url'), authTag.toString('base64url'), ciphertext.toString('base64url')].join(
    ':',
  );
}

export function decryptField(encoded: string): string {
  const [ivB64, authTagB64, ciphertextB64] = encoded.split(':');
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error('Malformed encrypted field value.');
  }

  const key = deriveKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64url'));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, 'base64url')),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}

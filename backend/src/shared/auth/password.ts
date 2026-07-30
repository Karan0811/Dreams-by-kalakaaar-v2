import { hash, verify } from '@node-rs/argon2';

/**
 * Argon2id password hashing — 12-security-architecture.md Section 5.2.
 *
 * Parameters follow OWASP's current Argon2id baseline recommendation for a
 * web-facing login path (19 MiB memory, 2 iterations, 1 degree of
 * parallelism) — enough to be expensive against an offline cracking attempt
 * without making the login request itself noticeably slow.
 *
 * NOTE: `@node-rs/argon2` declares its `Algorithm` export as an ambient
 * `const enum`, which TypeScript cannot re-export under this project's
 * `isolatedModules` (required by Next.js's per-file transpilation). `2` is
 * that enum's own value for `Argon2id` — pinned directly rather than
 * importing the enum to avoid a transpile-time failure.
 */
const ARGON2ID_PARAMS = {
  algorithm: 2, // Algorithm.Argon2id
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plaintext: string): Promise<string> {
  return hash(plaintext, ARGON2ID_PARAMS);
}

export async function verifyPassword(hashedPassword: string, plaintext: string): Promise<boolean> {
  return verify(hashedPassword, plaintext, ARGON2ID_PARAMS);
}

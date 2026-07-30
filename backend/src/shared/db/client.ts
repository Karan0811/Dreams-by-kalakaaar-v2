import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/shared/config/env';
import * as schema from './schema';

/**
 * Supabase PostgreSQL connection/pooling setup — 10-backend-architecture.md
 * Section 10.8 (Connection Management).
 *
 * Serverless functions cannot hold long-lived connection pools the way a
 * traditional long-running server can (Section 2.9's Stateless Services
 * principle) — `max` is deliberately small per-invocation and the
 * platform's transaction-mode pooler (Supabase's pgBouncer / Supavisor) is
 * assumed to be in front of Postgres in every non-local environment, so this
 * client's own pool is a thin, short-lived layer on top of that, not a
 * substitute for it.
 */
const queryClient = postgres(env.DATABASE_URL, {
  max: env.DATABASE_POOL_MAX,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: env.DATABASE_SSL ? 'require' : false,
  // Supabase's transaction-mode pooler does not support prepared statements.
  prepare: false,
});

export const db = drizzle(queryClient, { schema });

export type Database = typeof db;

/**
 * Runs a callback inside a single Postgres transaction, per
 * 10-backend-architecture.md Section 10.3 — the Repository Layer's exposed
 * transaction primitive. Service Layer code orchestrates multiple
 * Repository calls within one `withTransaction` block whenever the
 * operation must be atomic (Section 9.3).
 */
export async function withTransaction<T>(
  callback: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>,
): Promise<T> {
  return db.transaction(callback);
}

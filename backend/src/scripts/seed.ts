/**
 * Seed script — populates the baseline RBAC catalog (Roles, Permissions,
 * RolePermission grants) this phase's code depends on:
 *   - `modules/auth/service.ts` grants every new registrant the "Buyer" role.
 *   - `modules/creators/service.ts` grants "Creator Team Owner" (store-scoped)
 *     on a successful Creator application.
 *   - `shared/middleware/authorize.ts` checks permission keys against
 *     exactly the catalog seeded here.
 *
 * Run with `npm run db:seed` (see backend/package.json). Idempotent: safe
 * to run repeatedly against the same database.
 *
 * 08-database-design.md Section 6 (Authorization domain) is this script's
 * source of truth for the role/permission model; the specific role and
 * permission names below are the minimum catalog needed by the modules
 * implemented in this phase (see backend/SCOPE.md) — the full RBAC catalog
 * (Moderator, Support Executive, and their associated permissions) is
 * deferred to the phase that builds those modules' actual endpoints.
 */
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  dotenv.config();
}
import * as schema from '@/shared/db/schema';

const PERMISSIONS: Array<{ key: string; description: string; category: string }> = [
  {
    key: 'products:read',
    description: "Read a store's Products (including non-ACTIVE ones)",
    category: 'products',
  },
  {
    key: 'products:write',
    description: "Create/update/transition a store's Products",
    category: 'products',
  },
  { key: 'stores:manage', description: "Manage a Store's own settings and team", category: 'stores' },
  { key: 'creators:review', description: 'Approve/reject Creator applications', category: 'creators' },
  { key: 'platform:health:read', description: 'Read the deep health-check endpoint', category: 'platform' },
  { key: 'users:manage', description: 'Administrative override on any User account', category: 'users' },
  { key: 'categories:write', description: 'Create/update/delete Categories and Subcategories', category: 'categories' },
  { key: 'orders:manage', description: "Administrative override on any User's Order lifecycle", category: 'orders' },
  { key: 'reviews:moderate', description: "Remove any User's Review (moderation)", category: 'reviews' },
];

const ROLES: Array<{
  name: string;
  scope: 'PLATFORM' | 'STORE';
  description: string;
  permissionKeys: string[];
}> = [
  {
    name: 'Buyer',
    scope: 'PLATFORM',
    description: 'Default role granted to every newly-registered account.',
    permissionKeys: [],
  },
  {
    name: 'Creator Team Owner',
    scope: 'STORE',
    description: 'Full control over one Store, granted on Creator application.',
    permissionKeys: ['products:read', 'products:write', 'stores:manage'],
  },
  {
    name: 'Creator Team Member',
    scope: 'STORE',
    description: 'Delegated access to one Store, granted by its Owner.',
    permissionKeys: ['products:read', 'products:write'],
  },
  {
    name: 'Admin',
    scope: 'PLATFORM',
    description: 'Platform operator with cross-store administrative access.',
    permissionKeys: [
      'products:read',
      'products:write',
      'creators:review',
      'platform:health:read',
      'users:manage',
      'categories:write',
      'orders:manage',
      'reviews:moderate',
    ],
  },
  {
    name: 'Super Admin',
    scope: 'PLATFORM',
    description: 'Unrestricted platform access.',
    permissionKeys: PERMISSIONS.map((p) => p.key),
  },
];

type Db = ReturnType<typeof drizzle<typeof schema>>;

async function upsertPermission(db: Db, permission: (typeof PERMISSIONS)[number]): Promise<string> {
  await db.insert(schema.permissions).values(permission).onConflictDoNothing({
    target: schema.permissions.key,
  });

  const [row] = await db
    .select()
    .from(schema.permissions)
    .where(eq(schema.permissions.key, permission.key))
    .limit(1);

  if (!row) throw new Error(`Failed to upsert permission "${permission.key}".`);
  return row.id;
}

async function upsertRole(db: Db, role: (typeof ROLES)[number]): Promise<string> {
  await db
    .insert(schema.roles)
    .values({ name: role.name, scope: role.scope, description: role.description })
    .onConflictDoNothing({ target: [schema.roles.name, schema.roles.scope] });

  const [row] = await db
    .select()
    .from(schema.roles)
    .where(and(eq(schema.roles.name, role.name), eq(schema.roles.scope, role.scope)))
    .limit(1);

  if (!row) throw new Error(`Failed to upsert role "${role.name}".`);
  return row.id;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required to run the seed script.');

  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client, { schema });

  console.log('Seeding permissions...');
  const permissionIdByKey = new Map<string, string>();
  for (const permission of PERMISSIONS) {
    permissionIdByKey.set(permission.key, await upsertPermission(db, permission));
  }

  console.log('Seeding roles + role-permission grants...');
  for (const role of ROLES) {
    const roleId = await upsertRole(db, role);

    for (const key of role.permissionKeys) {
      const permissionId = permissionIdByKey.get(key);
      if (!permissionId) continue;

      await db.insert(schema.rolePermissions).values({ roleId, permissionId }).onConflictDoNothing();
    }
  }

  console.log('Seed complete.');
  await client.end();
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});

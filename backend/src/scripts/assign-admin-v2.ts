import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { assignRole } from '@/shared/authz/repository';
import { users } from '@/shared/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/shared/config/env';

async function main() {
  const client = postgres(env.DATABASE_URL, { prepare: false });
  const db = drizzle(client);

  const user = await db.select().from(users).where(eq(users.email, 'meera.krishnan@example.com')).limit(1);
  if (user[0]) {
    await assignRole({ userId: user[0].id, roleName: 'Admin' });
    console.log('Admin role assigned to meera.krishnan@example.com');
  } else {
    console.log('User not found');
  }

  await client.end();
}

main().catch(console.error);

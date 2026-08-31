import { assignRole } from '@/shared/authz/repository';
import { db } from '@/shared/db/client';
import { users } from '@/shared/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/shared/config/env';

async function main() {
  const user = await db.select().from(users).where(eq(users.email, 'meera.krishnan@example.com')).limit(1);
  if (user[0]) {
    await assignRole({ userId: user[0].id, roleName: 'Admin' });
    console.log('Admin role assigned to meera.krishnan@example.com');
  } else {
    console.log('User not found');
  }
}

main().catch(console.error);

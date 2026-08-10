import { and, eq } from 'drizzle-orm';
import { db, withTransaction } from '@/shared/db/client';
import { userAddresses } from '@/shared/db/schema';
import type { CreateUserAddressInput, UpdateUserAddressInput } from './schemas';

export async function listAddresses(userId: string) {
  return db.select().from(userAddresses).where(eq(userAddresses.userId, userId));
}

export async function findAddressById(userId: string, addressId: string) {
  const [row] = await db
    .select()
    .from(userAddresses)
    .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createAddress(userId: string, input: CreateUserAddressInput) {
  return withTransaction(async (tx) => {
    if (input.isDefault) {
      await tx.update(userAddresses).set({ isDefault: false }).where(eq(userAddresses.userId, userId));
    }
    const [row] = await tx
      .insert(userAddresses)
      .values({ userId, ...input })
      .returning();
    if (!row) throw new Error('Failed to create user address row.');
    return row;
  });
}

export async function updateAddress(userId: string, addressId: string, input: UpdateUserAddressInput) {
  return withTransaction(async (tx) => {
    if (input.isDefault) {
      await tx.update(userAddresses).set({ isDefault: false }).where(eq(userAddresses.userId, userId));
    }
    const [row] = await tx
      .update(userAddresses)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)))
      .returning();
    return row ?? null;
  });
}

export async function deleteAddress(userId: string, addressId: string) {
  const [row] = await db
    .delete(userAddresses)
    .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)))
    .returning();
  return row ?? null;
}

export async function findDefaultAddress(userId: string) {
  const [row] = await db
    .select()
    .from(userAddresses)
    .where(and(eq(userAddresses.userId, userId), eq(userAddresses.isDefault, true)))
    .limit(1);
  return row ?? null;
}

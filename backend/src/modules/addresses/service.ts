import * as addressesRepository from './repository';
import { UserAddressNotFoundError } from './errors';
import type { CreateUserAddressInput, UpdateUserAddressInput } from './schemas';

export async function listMyAddresses(userId: string) {
  return addressesRepository.listAddresses(userId);
}

export async function createMyAddress(userId: string, input: CreateUserAddressInput) {
  return addressesRepository.createAddress(userId, input);
}

export async function updateMyAddress(userId: string, addressId: string, input: UpdateUserAddressInput) {
  const updated = await addressesRepository.updateAddress(userId, addressId, input);
  if (!updated) throw new UserAddressNotFoundError();
  return updated;
}

export async function deleteMyAddress(userId: string, addressId: string) {
  const deleted = await addressesRepository.deleteAddress(userId, addressId);
  if (!deleted) throw new UserAddressNotFoundError();
  return deleted;
}

/** Used by the Orders module to snapshot a shipping address at order-creation time. */
export async function getAddressOrThrow(userId: string, addressId: string) {
  const address = await addressesRepository.findAddressById(userId, addressId);
  if (!address) throw new UserAddressNotFoundError();
  return address;
}

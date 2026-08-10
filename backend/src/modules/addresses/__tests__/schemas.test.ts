import { describe, expect, it } from 'vitest';
import { createUserAddressSchema, updateUserAddressSchema } from '../schemas';

describe('createUserAddressSchema', () => {
  const valid = {
    recipientName: 'Jane Doe',
    recipientPhone: '9876543210',
    line1: '221B Baker Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
  };

  it('accepts a valid address and applies defaults', () => {
    const result = createUserAddressSchema.parse(valid);
    expect(result.label).toBe('Home');
    expect(result.type).toBe('SHIPPING');
    expect(result.country).toBe('IN');
    expect(result.isDefault).toBe(false);
  });

  it('rejects a missing recipientName', () => {
    const rest: Record<string, unknown> = { ...valid };
    delete rest.recipientName;
    expect(createUserAddressSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects an invalid country code length', () => {
    expect(createUserAddressSchema.safeParse({ ...valid, country: 'IND' }).success).toBe(false);
  });

  it('accepts an explicit BILLING type and isDefault', () => {
    const result = createUserAddressSchema.parse({ ...valid, type: 'BILLING', isDefault: true });
    expect(result.type).toBe('BILLING');
    expect(result.isDefault).toBe(true);
  });
});

describe('updateUserAddressSchema', () => {
  it('accepts a partial update with a single field', () => {
    const result = updateUserAddressSchema.parse({ city: 'Pune' });
    expect(result.city).toBe('Pune');
    expect(result.line1).toBeUndefined();
  });

  it('accepts an empty object (no-op update)', () => {
    expect(updateUserAddressSchema.safeParse({}).success).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import {
  emailSchema,
  moneySchema,
  paginationQuerySchema,
  passwordSchema,
  uuidSchema,
} from '../common-schemas';

describe('passwordSchema', () => {
  it('rejects passwords shorter than 12 characters', () => {
    expect(passwordSchema.safeParse('short1234').success).toBe(false);
  });

  it('accepts a 12+ character password with no complexity requirement', () => {
    expect(passwordSchema.safeParse('correcthorsebatterystaple').success).toBe(true);
  });
});

describe('emailSchema', () => {
  it('lowercases the email', () => {
    expect(emailSchema.parse('Person@Example.COM')).toBe('person@example.com');
  });

  it('rejects a malformed email', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
  });
});

describe('uuidSchema', () => {
  it('accepts a valid UUID', () => {
    expect(uuidSchema.safeParse('123e4567-e89b-12d3-a456-426614174000').success).toBe(true);
  });

  it('rejects a non-UUID string', () => {
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
  });
});

describe('moneySchema', () => {
  it('accepts integer minor units with a 3-letter currency', () => {
    expect(moneySchema.safeParse({ amount: 149900, currency: 'INR' }).success).toBe(true);
  });

  it('rejects a non-integer amount', () => {
    expect(moneySchema.safeParse({ amount: 149900.5, currency: 'INR' }).success).toBe(false);
  });
});

describe('paginationQuerySchema', () => {
  it('applies default limit of 20', () => {
    expect(paginationQuerySchema.parse({})).toMatchObject({ limit: 20 });
  });

  it('rejects a limit above 100', () => {
    expect(paginationQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  createCreatorAddressSchema,
  createCreatorBankDetailsSchema,
  createCreatorDocumentSchema,
  createCreatorSocialLinkSchema,
  creatorStatusTransitionSchema,
  requestCreatorDocumentUploadSchema,
  reviewCreatorDocumentSchema,
  updateCreatorAddressSchema,
  updateCreatorBankDetailsSchema,
  updateCreatorSocialLinkSchema,
} from '../schemas';

describe('createCreatorAddressSchema', () => {
  it('accepts a fully-specified address and defaults type/country/isDefault', () => {
    const result = createCreatorAddressSchema.safeParse({
      line1: '221B Baker Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('REGISTERED');
      expect(result.data.country).toBe('IN');
      expect(result.data.isDefault).toBe(false);
    }
  });

  it('rejects a missing required field', () => {
    expect(createCreatorAddressSchema.safeParse({ city: 'Mumbai' }).success).toBe(false);
  });
});

describe('updateCreatorAddressSchema', () => {
  it('allows a partial patch', () => {
    expect(updateCreatorAddressSchema.safeParse({ city: 'Pune' }).success).toBe(true);
    expect(updateCreatorAddressSchema.safeParse({}).success).toBe(true);
  });
});

describe('createCreatorBankDetailsSchema', () => {
  it('accepts a valid IFSC code and normalizes to uppercase', () => {
    const result = createCreatorBankDetailsSchema.safeParse({
      accountHolderName: 'Priya Sharma',
      accountNumber: '123456789012',
      ifscCode: 'hdfc0001234',
      bankName: 'HDFC Bank',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.ifscCode).toBe('HDFC0001234');
  });

  it('rejects a malformed IFSC code', () => {
    const result = createCreatorBankDetailsSchema.safeParse({
      accountHolderName: 'Priya Sharma',
      accountNumber: '123456789012',
      ifscCode: 'NOT-AN-IFSC',
      bankName: 'HDFC Bank',
    });
    expect(result.success).toBe(false);
  });

  it('defaults isPrimary to true', () => {
    const result = createCreatorBankDetailsSchema.safeParse({
      accountHolderName: 'Priya Sharma',
      accountNumber: '123456789012',
      ifscCode: 'HDFC0001234',
      bankName: 'HDFC Bank',
    });
    expect(result.success && result.data.isPrimary).toBe(true);
  });
});

describe('updateCreatorBankDetailsSchema', () => {
  it('allows updating just the bank name', () => {
    expect(updateCreatorBankDetailsSchema.safeParse({ bankName: 'ICICI Bank' }).success).toBe(true);
  });
});

describe('createCreatorSocialLinkSchema', () => {
  it('accepts a valid platform + URL', () => {
    const result = createCreatorSocialLinkSchema.safeParse({
      platform: 'INSTAGRAM',
      url: 'https://instagram.com/kalakaaar',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid URL', () => {
    expect(
      createCreatorSocialLinkSchema.safeParse({ platform: 'INSTAGRAM', url: 'not-a-url' }).success,
    ).toBe(false);
  });

  it('rejects an unknown platform', () => {
    expect(
      createCreatorSocialLinkSchema.safeParse({
        platform: 'MYSPACE',
        url: 'https://myspace.com/kalakaaar',
      }).success,
    ).toBe(false);
  });
});

describe('updateCreatorSocialLinkSchema', () => {
  it('allows updating just displayOrder', () => {
    expect(updateCreatorSocialLinkSchema.safeParse({ displayOrder: 2 }).success).toBe(true);
  });
});

describe('createCreatorDocumentSchema', () => {
  it('accepts a valid mediaId + type', () => {
    const result = createCreatorDocumentSchema.safeParse({
      mediaId: '123e4567-e89b-12d3-a456-426614174000',
      type: 'GOVERNMENT_ID',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID mediaId', () => {
    expect(
      createCreatorDocumentSchema.safeParse({ mediaId: 'not-a-uuid', type: 'GOVERNMENT_ID' }).success,
    ).toBe(false);
  });
});

describe('requestCreatorDocumentUploadSchema', () => {
  it('accepts an allowed content type under the size limit', () => {
    const result = requestCreatorDocumentUploadSchema.safeParse({
      fileName: 'pan-card.pdf',
      contentType: 'application/pdf',
      sizeBytes: 1024 * 1024,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a file over the 10MB limit', () => {
    const result = requestCreatorDocumentUploadSchema.safeParse({
      fileName: 'pan-card.pdf',
      contentType: 'application/pdf',
      sizeBytes: 11 * 1024 * 1024,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a disallowed content type', () => {
    const result = requestCreatorDocumentUploadSchema.safeParse({
      fileName: 'video.mp4',
      contentType: 'video/mp4',
      sizeBytes: 1024,
    });
    expect(result.success).toBe(false);
  });
});

describe('reviewCreatorDocumentSchema', () => {
  it('accepts APPROVED/REJECTED with optional notes', () => {
    expect(reviewCreatorDocumentSchema.safeParse({ status: 'APPROVED' }).success).toBe(true);
    expect(
      reviewCreatorDocumentSchema.safeParse({ status: 'REJECTED', reviewNotes: 'Blurry image' }).success,
    ).toBe(true);
  });

  it('rejects an invalid status', () => {
    expect(reviewCreatorDocumentSchema.safeParse({ status: 'PENDING_REVIEW' }).success).toBe(false);
  });
});

describe('creatorStatusTransitionSchema', () => {
  it('accepts a known target status', () => {
    expect(creatorStatusTransitionSchema.safeParse({ onboardingStatus: 'ACTIVE' }).success).toBe(true);
  });

  it('rejects an unknown target status', () => {
    expect(creatorStatusTransitionSchema.safeParse({ onboardingStatus: 'DELETED' }).success).toBe(false);
  });
});

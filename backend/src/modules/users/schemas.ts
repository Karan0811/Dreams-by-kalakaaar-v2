import { z } from 'zod';
import { displayNameSchema } from '@/shared/validation/common-schemas';

/** Users module schemas — 08-database-design.md Section 5.2 (UserProfile). */

export const updateProfileSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    bio: z.string().trim().max(500).optional(),
    pronouns: z.string().trim().max(32).optional(),
    isPublicProfile: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field must be provided.',
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

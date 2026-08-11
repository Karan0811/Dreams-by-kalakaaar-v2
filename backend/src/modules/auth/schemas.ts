// import { z } from 'zod';
// import { displayNameSchema, emailSchema, passwordSchema } from '@/shared/validation/common-schemas';

// /** Auth module schemas — 09-api-architecture.md Section 3. */

// export const registerSchema = z.object({
//   email: emailSchema,
//   password: passwordSchema,
//   displayName: displayNameSchema,
//   marketingConsent: z.boolean().default(false),
// });
// export type RegisterInput = z.infer<typeof registerSchema>;

// export const loginSchema = z.object({
//   email: emailSchema,
//   password: z.string().min(1, 'Password is required.'),
// });
// export type LoginInput = z.infer<typeof loginSchema>;

// export const changePasswordSchema = z.object({
//   currentPassword: z.string().min(1, 'Current password is required.'),
//   newPassword: passwordSchema,
// });
// export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// export const forgotPasswordSchema = z.object({
//   email: emailSchema,
// });
// export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// export const resetPasswordSchema = z.object({
//   token: z.string().min(1, 'Reset token is required.'),
//   newPassword: passwordSchema,
// });
// export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// export const verifyEmailSchema = z.object({
//   token: z.string().min(1, 'Verification token is required.'),
// });
// export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;



import { z } from 'zod';
import { displayNameSchema, emailSchema, passwordSchema } from '@/shared/validation/common-schemas';

/** Auth module schemas — 09-api-architecture.md Section 3. */

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
  marketingConsent: z.boolean().default(false),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required.'),
  newPassword: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required.'),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({
  email: emailSchema,
});
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
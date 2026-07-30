import { z } from "zod";
import { displayNameSchema, emailSchema, passwordSchema } from "./shared-schemas";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
  // FIX (production audit): `z.literal(true)` forced SignupInput.acceptedTerms
  // to the literal type `true`, which doesn't match what a Checkbox's
  // onCheckedChange actually produces (`boolean`) — every call site needed
  // an `as never` cast to satisfy TypeScript. A refined boolean gives the
  // same validation behavior and error message with a natural `boolean` type.
  acceptedTerms: z.boolean().refine((value) => value === true, {
    message: "You must accept the Terms and Privacy Policy",
  }),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

import { z } from "zod";
import {
  emailValidator,
  passwordValidator,
  nameValidator,
  uuidValidator,
} from "@/shared/utils/validations/common";

/**
 * Auth Validation Schemas
 *
 * These schemas are used for form validation and API request validation.
 * They ensure type safety and data integrity across the auth flow.
 */

// Re-export common validators for backward compatibility
const email = emailValidator;
const password = passwordValidator;
const name = nameValidator;

// Login Schema
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"), // Less strict for login
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Register Schema
export const registerSchema = z
  .object({
    name,
    email,
    company: z.string().optional(),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Reset Password Schema
export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Update Profile Schema
export const updateProfileSchema = z
  .object({
    name,
    email,
    company: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: password.optional(),
    confirmNewPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      // If newPassword is provided, confirmNewPassword must match
      if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Passwords don't match",
      path: ["confirmNewPassword"],
    }
  )
  .refine(
    (data) => {
      // If changing password, current password is required
      if (data.newPassword && !data.currentPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Current password is required to set a new password",
      path: ["currentPassword"],
    }
  );

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

// =====================================================
// OAUTH VALIDATION
// =====================================================

/**
 * OAuth callback validation
 * Validates the code from OAuth redirect
 */
export const oauthCallbackSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  state: z.string().optional(),
});

export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;

// =====================================================
// INVITATION HANDLING
// =====================================================

/**
 * Accept organization invitation
 */
export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

/**
 * Create invitation (admin/owner only)
 */
export const createInvitationSchema = z.object({
  email,
  role: z
    .enum(["owner", "admin", "member"])
    .refine((val) => ["owner", "admin", "member"].includes(val), {
      message: "Invalid role",
    }),
  organizationId: uuidValidator,
  expiresInDays: z
    .number()
    .int()
    .min(1, "Must expire in at least 1 day")
    .max(30, "Cannot expire after 30 days")
    .default(7),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

// =====================================================
// TEMPORARY USER AUTH
// =====================================================

/**
 * Create temporary user for external recipient
 * Used when sending documents outside organization
 */
export const createTemporaryUserSchema = z.object({
  email,
  deliveryId: uuidValidator,
  expiresInHours: z
    .number()
    .int()
    .min(1, "Must expire in at least 1 hour")
    .max(720, "Cannot expire after 30 days") // 30 days max
    .default(48), // 48 hours default
});

export type CreateTemporaryUserInput = z.infer<
  typeof createTemporaryUserSchema
>;

/**
 * Temporary user login
 * Password is auto-generated and sent via email
 */
export const temporaryUserLoginSchema = z.object({
  email,
  temporaryPassword: z.string().min(1, "Temporary password is required"),
  deliveryId: uuidValidator.optional(),
});

export type TemporaryUserLoginInput = z.infer<typeof temporaryUserLoginSchema>;

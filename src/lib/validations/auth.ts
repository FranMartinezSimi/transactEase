import { z } from "zod"

/**
 * Auth Validation Schemas
 *
 * These schemas are used for form validation and API request validation.
 * They ensure type safety and data integrity across the auth flow.
 */

// Common field validations
const email = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address")

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")

const name = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters")

// Login Schema
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required") // Less strict for login
})

export type LoginFormData = z.infer<typeof loginSchema>

// Register Schema
export const registerSchema = z.object({
  name,
  email,
  company: z.string().optional(),
  password,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export type RegisterFormData = z.infer<typeof registerSchema>

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// Reset Password Schema
export const resetPasswordSchema = z.object({
  password,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// Update Profile Schema
export const updateProfileSchema = z.object({
  name,
  email,
  company: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: password.optional(),
  confirmNewPassword: z.string().optional()
}).refine((data) => {
  // If newPassword is provided, confirmNewPassword must match
  if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
    return false
  }
  return true
}, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"]
}).refine((data) => {
  // If changing password, current password is required
  if (data.newPassword && !data.currentPassword) {
    return false
  }
  return true
}, {
  message: "Current password is required to set a new password",
  path: ["currentPassword"]
})

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>

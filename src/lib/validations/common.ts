import { z } from "zod"

/**
 * Common/Reusable Validation Schemas
 *
 * Shared validators that can be used across different schemas
 */

// Common field validators
export const emailValidator = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address")
  .toLowerCase()
  .trim()

export const passwordValidator = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")

export const nameValidator = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters")
  .trim()

export const uuidValidator = z.string().uuid("Invalid ID format")

export const urlValidator = z.string().url("Invalid URL")

export const phoneValidator = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
  .optional()

// Pagination
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
})

export type PaginationParams = z.infer<typeof paginationSchema>

// Date range
export const dateRangeSchema = z.object({
  from: z.date(),
  to: z.date()
}).refine((data) => data.from <= data.to, {
  message: "Start date must be before end date",
  path: ["to"]
})

export type DateRange = z.infer<typeof dateRangeSchema>

// Search/Filter
export const searchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(100),
  filters: z.record(z.string()).optional()
})

export type SearchParams = z.infer<typeof searchSchema>

// Generic ID schema
export const idSchema = z.object({
  id: uuidValidator
})

export type IdParams = z.infer<typeof idSchema>

// Success/Error response schemas (for API)
export const successResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional()
})

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional()
})

export type SuccessResponse = z.infer<typeof successResponseSchema>
export type ErrorResponse = z.infer<typeof errorResponseSchema>

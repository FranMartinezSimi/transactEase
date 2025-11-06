import { z } from "zod";
import { emailValidator, uuidValidator } from "./common";

/**
 * Delivery/File Transfer Validation Schemas
 */

// Delivery status enum
export const deliveryStatusEnum = z.enum(["active", "expired", "revoked"]);

// Delivery creation schema
export const createDeliverySchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters")
    .trim()
    .transform((val) => val.replace(/[<>]/g, "")), // Basic XSS prevention

  message: z
    .string()
    .max(2000, "Message must be less than 2000 characters")
    .optional()
    .transform((val) => val?.replace(/[<>]/g, "")), // Basic XSS prevention

  recipientEmail: emailValidator,

  expiresAt: z
    .string()
    .datetime("Invalid date format")
    .or(z.date())
    .transform((val) => (typeof val === "string" ? new Date(val) : val))
    .refine((date) => date > new Date(), "Expiration date must be in the future"),

  maxViews: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must allow at least 1 view")
    .max(1000, "Cannot exceed 1000 views")
    .default(10),

  maxDownloads: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must allow at least 1 download")
    .max(100, "Cannot exceed 100 downloads")
    .default(5),

  requireAuthentication: z.boolean().default(true),

  passwordHash: z.string().optional(),
});

export type CreateDeliveryData = z.infer<typeof createDeliverySchema>;

// Request access schema
export const requestAccessSchema = z.object({
  email: emailValidator,
});

export type RequestAccessData = z.infer<typeof requestAccessSchema>;

// Verify access schema
export const verifyAccessSchema = z.object({
  code: z
    .string()
    .length(6, "Access code must be 6 digits")
    .regex(/^\d{6}$/, "Access code must contain only numbers"),

  email: emailValidator,
});

export type VerifyAccessData = z.infer<typeof verifyAccessSchema>;

// Download file schema
export const downloadFileSchema = z.object({
  deliveryId: uuidValidator,
  fileId: uuidValidator,
  email: emailValidator,
});

export type DownloadFileData = z.infer<typeof downloadFileSchema>;

// Update delivery status schema
export const updateDeliveryStatusSchema = z.object({
  status: deliveryStatusEnum,
});

export type UpdateDeliveryStatusData = z.infer<
  typeof updateDeliveryStatusSchema
>;

// Query parameters for listing deliveries
export const listDeliveriesSchema = z.object({
  status: deliveryStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["created_at", "expires_at", "title"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z
    .string()
    .max(100, "Search query too long")
    .optional()
    .transform((val) => val?.trim()),
});

export type ListDeliveriesQuery = z.infer<typeof listDeliveriesSchema>;

// Delivery ID parameter schema
export const deliveryIdSchema = z.object({
  id: uuidValidator,
});

export type DeliveryIdParams = z.infer<typeof deliveryIdSchema>;

// File upload metadata schema
export const fileUploadMetadataSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .max(255, "Filename too long")
    .regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, "Invalid filename characters"),

  mimeType: z.string().min(1, "MIME type is required"),

  size: z
    .number()
    .int("File size must be an integer")
    .min(1, "File must not be empty")
    .max(300 * 1024 * 1024, "File size must be less than 300MB"),

  hash: z
    .string()
    .regex(/^[a-f0-9]{64}$/, "Invalid SHA-256 hash")
    .optional(),
});

export type FileUploadMetadata = z.infer<typeof fileUploadMetadataSchema>;

// Waitlist schema
export const waitlistSchema = z.object({
  email: emailValidator,
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim()
    .optional(),
  company: z
    .string()
    .max(100, "Company name must be less than 100 characters")
    .trim()
    .optional(),
});

export type WaitlistData = z.infer<typeof waitlistSchema>;

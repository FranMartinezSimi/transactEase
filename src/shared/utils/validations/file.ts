import { z } from "zod";

/**
 * File/Document Validation Schemas
 *
 * For file uploads, document sharing, and file management
 */

// File size limits (in bytes)
export const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB (configurable in your settings)
export const MIN_FILE_SIZE = 1; // 1 byte

// Allowed MIME types (expand as needed)
export const ALLOWED_FILE_TYPES = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  // Text
  "text/plain",
  "text/csv",
];

// Send File Schema
export const sendFileSchema = z
  .object({
    file: z
      .instanceof(File)
      .refine((file) => file.size > MIN_FILE_SIZE, "File is required")
      .refine(
        (file) => file.size <= MAX_FILE_SIZE,
        `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
      )
      .refine(
        (file) => ALLOWED_FILE_TYPES.includes(file.type),
        "File type not supported"
      ),

    recipientEmail: z.string().email("Invalid email address").optional(),

    expiresIn: z.enum(["1h", "24h", "7d", "30d", "never"]).default("24h"),

    maxViews: z
      .number()
      .int("Must be a whole number")
      .min(1, "Must allow at least 1 view")
      .max(100, "Cannot exceed 100 views")
      .optional(),

    requirePassword: z.boolean().default(false),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),

    message: z
      .string()
      .max(500, "Message must be less than 500 characters")
      .optional(),

    notifyOnAccess: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // If requirePassword is true, password must be provided
      if (data.requirePassword && !data.password) {
        return false;
      }
      return true;
    },
    {
      message: "Password is required when password protection is enabled",
      path: ["password"],
    }
  );

export type SendFileFormData = z.infer<typeof sendFileSchema>;

// Access File Schema (when recipient opens the link)
export const accessFileSchema = z.object({
  linkId: z.string().uuid("Invalid link ID"),
  password: z.string().optional(),
});

export type AccessFileData = z.infer<typeof accessFileSchema>;

// File Settings Schema (for updating file link settings)
export const fileSettingsSchema = z.object({
  expiresIn: z.enum(["1h", "24h", "7d", "30d", "never"]).optional(),
  maxViews: z.number().int().min(1).max(100).optional(),
  requirePassword: z.boolean().optional(),
  password: z.string().min(6).optional(),
  notifyOnAccess: z.boolean().optional(),
});

export type FileSettingsData = z.infer<typeof fileSettingsSchema>;

// Bulk Delete Schema
export const bulkDeleteSchema = z.object({
  fileIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one file to delete"),
});

export type BulkDeleteData = z.infer<typeof bulkDeleteSchema>;

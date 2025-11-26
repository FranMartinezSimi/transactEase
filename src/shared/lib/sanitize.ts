/**
 * Input sanitization utilities
 * Prevents XSS, SQL injection, and other security vulnerabilities
 */

/**
 * Sanitize HTML content - removes all HTML tags and dangerous characters
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  return (
    input
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Remove script tags and content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      // Remove javascript: protocol
      .replace(/javascript:/gi, "")
      // Decode HTML entities to prevent double encoding attacks
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/")
      // Then re-encode dangerous characters
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;")
      .trim()
  );
}

/**
 * Sanitize text input - basic sanitization for text fields
 */
export function sanitizeText(input: string): string {
  if (!input) return "";

  return (
    input
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, "")
      // Trim whitespace
      .trim()
      // Limit consecutive spaces
      .replace(/\s+/g, " ")
  );
}

/**
 * Sanitize email - ensures valid email format
 */
export function sanitizeEmail(input: string): string {
  if (!input) return "";

  return input.toLowerCase().trim().replace(/[^a-z0-9@._+-]/gi, "");
}

/**
 * Sanitize filename - removes dangerous characters from filenames
 */
export function sanitizeFilename(input: string): string {
  if (!input) return "";

  return (
    input
      // Remove path traversal attempts
      .replace(/\.\./g, "")
      .replace(/[\/\\]/g, "")
      // Remove dangerous characters
      .replace(/[<>:"|?*\x00-\x1F]/g, "")
      // Limit length
      .slice(0, 255)
      .trim()
  );
}

/**
 * Sanitize URL - ensures valid URL and removes javascript: protocol
 */
export function sanitizeUrl(input: string): string {
  if (!input) return "";

  const sanitized = input.trim();

  // Block dangerous protocols
  const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"];
  const lowerInput = sanitized.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerInput.startsWith(protocol)) {
      return "";
    }
  }

  // Only allow http(s) and mailto
  if (
    !sanitized.startsWith("http://") &&
    !sanitized.startsWith("https://") &&
    !sanitized.startsWith("mailto:")
  ) {
    return `https://${sanitized}`;
  }

  return sanitized;
}

/**
 * Sanitize JSON input - prevents JSON injection
 */
export function sanitizeJson(input: string): string {
  if (!input) return "";

  try {
    // Parse and re-stringify to ensure valid JSON
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch {
    return "";
  }
}

/**
 * Sanitize SQL-like input - prevents SQL injection attempts
 * Note: This is a basic sanitizer. Always use parameterized queries!
 */
export function sanitizeSqlLike(input: string): string {
  if (!input) return "";

  return (
    input
      // Remove SQL keywords
      .replace(
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|OR|AND)\b)/gi,
        ""
      )
      // Remove SQL comment syntax
      .replace(/--/g, "")
      .replace(/\/\*/g, "")
      .replace(/\*\//g, "")
      // Remove dangerous characters
      .replace(/[;'"\\]/g, "")
      .trim()
  );
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(input: string): string {
  if (!input) return "";

  // Keep only digits, +, -, (, ), and spaces
  return input.replace(/[^\d\s+\-()]/g, "").trim();
}

/**
 * Sanitize object - recursively sanitizes all string values
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  sanitizer: (val: string) => string = sanitizeText
): T {
  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizer(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizer(item)
          : typeof item === "object"
            ? sanitizeObject(item, sanitizer)
            : item
      );
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeObject(value, sanitizer);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Validate and sanitize UUID
 */
export function sanitizeUuid(input: string): string | null {
  if (!input) return null;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const sanitized = input.trim().toLowerCase();

  return uuidRegex.test(sanitized) ? sanitized : null;
}

/**
 * Sanitize integer input
 */
export function sanitizeInt(
  input: string | number,
  min?: number,
  max?: number
): number | null {
  const num = typeof input === "string" ? parseInt(input, 10) : input;

  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;

  return num;
}

/**
 * Rate limit key sanitizer - for creating safe cache keys
 */
export function sanitizeRateLimitKey(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
}

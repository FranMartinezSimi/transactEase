# 🔒 Security Hardening Implementation

## Overview

This document outlines the security measures implemented in the TransactEase/SealDrop MVP to protect against common vulnerabilities and attacks.

---

## ✅ Implemented Security Measures

### 1. Rate Limiting

**Location:** `/src/shared/lib/rate-limit.ts`

**Purpose:** Prevents API abuse, brute force attacks, and DDoS attempts.

**Implementation:**
- In-memory rate limiting (suitable for single-instance MVP)
- Different rate limit presets for different endpoint types
- Automatic cleanup of old rate limit records
- Rate limit headers in responses (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)

**Rate Limit Presets:**

| Preset | Use Case | Limit |
|--------|----------|-------|
| `strict` | Login, register, access verification | 5 requests/minute |
| `standard` | Regular API calls | 60 requests/minute |
| `relaxed` | File operations | 30 requests/minute |
| `upload` | File uploads | 10 uploads/5 minutes |

**Applied to:**
- ✅ `/api/deliveries/[id]/verify-access` (strict)
- ✅ `/api/deliveries/[id]/request-access` (strict)
- ✅ `/api/deliveries/upload` (upload)

**Usage Example:**
```typescript
import { withRateLimit, RateLimitPresets } from "@shared/lib/rate-limit";

async function myHandler(req: NextRequest) {
  // ... handler logic
}

export const POST = withRateLimit(myHandler, RateLimitPresets.strict);
```

**Note:** For production with multiple instances, migrate to Redis-based rate limiting (Upstash recommended for Vercel).

---

### 2. Input Validation with Zod

**Location:** `/src/shared/utils/validations/`

**Purpose:** Ensures all inputs conform to expected schemas, preventing injection attacks and data corruption.

**Schemas Created:**

#### Common Validations (`common.ts`)
- Email validation
- Password validation (min 8 chars, uppercase, lowercase, number)
- UUID validation
- Name validation
- Phone validation
- Pagination schemas
- Search schemas

#### Delivery Validations (`delivery.ts`)
- `createDeliverySchema` - Delivery creation with XSS prevention
- `requestAccessSchema` - Email validation for access requests
- `verifyAccessSchema` - 6-digit code validation
- `downloadFileSchema` - File download parameters
- `listDeliveriesSchema` - Query parameters for listing
- `fileUploadMetadataSchema` - File metadata validation
- `waitlistSchema` - Landing page waitlist

#### File Validations (`file.ts`)
- File size limits (1 byte - 300MB)
- MIME type whitelist
- File upload validation
- Settings validation

**Usage Example:**
```typescript
import { verifyAccessSchema } from "@shared/utils/validations/delivery";

const validation = verifyAccessSchema.safeParse({
  code: body.code,
  email: body.email,
});

if (!validation.success) {
  return NextResponse.json({
    message: "Invalid input",
    errors: validation.error.errors,
  }, { status: 400 });
}
```

---

### 3. Input Sanitization

**Location:** `/src/shared/lib/sanitize.ts`

**Purpose:** Removes dangerous characters and prevents XSS, SQL injection, and other attacks.

**Available Sanitizers:**

| Function | Purpose | Use Case |
|----------|---------|----------|
| `sanitizeHtml()` | Removes HTML tags and dangerous characters | User messages, descriptions |
| `sanitizeText()` | Basic text sanitization | General text inputs |
| `sanitizeEmail()` | Ensures valid email format | Email fields |
| `sanitizeFilename()` | Removes path traversal and dangerous chars | File uploads |
| `sanitizeUrl()` | Blocks dangerous protocols | URL inputs |
| `sanitizeJson()` | Prevents JSON injection | JSON inputs |
| `sanitizeSqlLike()` | Removes SQL keywords | Search queries (backup to parameterized queries) |
| `sanitizeObject()` | Recursively sanitizes all strings | Complex objects |
| `sanitizeUuid()` | Validates UUID format | ID parameters |

**Usage Example:**
```typescript
import { sanitizeEmail, sanitizeText } from "@shared/lib/sanitize";

const email = sanitizeEmail(body.email);
const message = sanitizeText(body.message);
```

**Applied to:**
- ✅ Email inputs (verify-access, request-access, upload)
- ✅ Text inputs (titles, messages in upload)
- ✅ Filenames (upload route)

---

### 4. Security Headers

**Location:** `/src/shared/lib/security-headers.ts` + `/src/middleware.ts`

**Purpose:** Protects against common web vulnerabilities (XSS, clickjacking, MIME sniffing, etc.).

**Headers Implemented:**

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Restrictive CSP | Prevents XSS attacks |
| `Strict-Transport-Security` | max-age=31536000; includeSubDomains; preload | Forces HTTPS |
| `X-Frame-Options` | DENY | Prevents clickjacking |
| `X-Content-Type-Options` | nosniff | Prevents MIME sniffing |
| `Referrer-Policy` | strict-origin-when-cross-origin | Controls referrer information |
| `Permissions-Policy` | camera=(), microphone=(), etc. | Disables unnecessary features |
| `X-XSS-Protection` | 1; mode=block | Enables XSS filter |

**Content Security Policy (CSP):**
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https: blob:;
font-src 'self' data: https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://*.amazonaws.com;
frame-src 'self' https://accounts.google.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

**Applied:** Global middleware applies security headers to all responses.

---

### 5. Error Handling Improvements

**Purpose:** Prevents information leakage through error messages.

**Changes:**
- ✅ Generic error messages for 500 errors ("Internal server error" instead of detailed error messages)
- ✅ Structured logging with Pino (logs contain details for debugging, not exposed to client)
- ✅ Validation errors return field-specific messages (safe for client)

**Example:**
```typescript
// Before
return NextResponse.json(
  { message: error.message },  // ❌ May leak sensitive info
  { status: 500 }
);

// After
logger.error({ message: "Error details", error });  // ✅ Log for debugging
return NextResponse.json(
  { message: "Internal server error" },  // ✅ Generic message
  { status: 500 }
);
```

---

## 🔐 Additional Security Features (Already Implemented)

### File Security
- ✅ Server-side encryption (AWS S3 with AES256/KMS)
- ✅ SHA-256 file integrity hashing
- ✅ Automatic file deletion on expiration/quota reached
- ✅ MIME type validation
- ✅ File size limits (300MB max)

### Authentication Security
- ✅ JWT tokens via Supabase Auth
- ✅ OAuth 2.0 (Google)
- ✅ HTTP-only, secure cookies
- ✅ Session management with automatic refresh

### Database Security
- ✅ Row Level Security (RLS) on all tables
- ✅ Organization-based isolation
- ✅ Parameterized queries (Supabase client)
- ✅ Role-based access control

### Audit & Compliance
- ✅ Complete access logging
- ✅ IP tracking
- ✅ User agent logging
- ✅ Digital custody chain

---

## ⚠️ Known Limitations (MVP)

### 1. In-Memory Rate Limiting
**Issue:** Rate limits are per-instance, not global.

**Impact:** In multi-instance deployments (serverless functions), users could bypass rate limits by hitting different instances.

**Mitigation for Production:** Migrate to Redis-based rate limiting (Upstash recommended).

```typescript
// Future implementation with Upstash
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

### 2. CSP `unsafe-inline` for Scripts
**Issue:** CSP allows `'unsafe-inline'` for scripts due to Next.js requirements.

**Impact:** Slightly reduced XSS protection.

**Mitigation:** Next.js 13+ handles this reasonably well. For stricter CSP, use nonce-based approach.

### 3. No Virus Scanning
**Issue:** Uploaded files are not scanned for malware.

**Impact:** Risk of malware distribution.

**Mitigation for Production:** Integrate ClamAV or AWS S3 virus scanning.

---

## 📋 Security Checklist for Production

- [ ] **Migrate to Redis-based rate limiting** (Upstash)
- [ ] **Add virus scanning** (ClamAV or AWS S3 Antivirus)
- [ ] **Implement WAF** (Cloudflare, AWS WAF)
- [ ] **Add error tracking** (Sentry, Bugsnag)
- [ ] **Set up monitoring** (DataDog, New Relic)
- [ ] **Enable API logging** (structured logs to external service)
- [ ] **Audit all credentials** (rotate AWS keys, use IAM roles)
- [ ] **Add CAPTCHA** (Google reCAPTCHA v3 for auth endpoints)
- [ ] **Implement CSP nonce** (stricter CSP policy)
- [ ] **Add security testing** (OWASP ZAP, Burp Suite)
- [ ] **Penetration testing** (external security audit)
- [ ] **Bug bounty program** (HackerOne, Bugcrowd)

---

## 🔒 Security Best Practices for Developers

### 1. Always Validate & Sanitize
```typescript
// ✅ Good
const validation = schema.safeParse({
  email: sanitizeEmail(body.email),
  message: sanitizeText(body.message),
});

// ❌ Bad
const email = body.email;  // No validation or sanitization
```

### 2. Use Rate Limiting on Sensitive Endpoints
```typescript
// ✅ Good
export const POST = withRateLimit(handler, RateLimitPresets.strict);

// ❌ Bad
export async function POST(req: NextRequest) {
  // No rate limiting
}
```

### 3. Generic Error Messages
```typescript
// ✅ Good
logger.error({ error, context });
return NextResponse.json({ message: "Internal server error" }, { status: 500 });

// ❌ Bad
return NextResponse.json({ message: error.message }, { status: 500 });
```

### 4. Never Trust Client Input
```typescript
// ✅ Good
const maxDownloads = Math.min(Number(form.get("maxDownloads") || 5), 100);

// ❌ Bad
const maxDownloads = Number(form.get("maxDownloads"));  // No bounds checking
```

### 5. Use Parameterized Queries
```typescript
// ✅ Good (Supabase does this automatically)
await supabase.from("deliveries").select("*").eq("id", deliveryId);

// ❌ Bad (vulnerable to SQL injection)
await db.query(`SELECT * FROM deliveries WHERE id = '${deliveryId}'`);
```

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Vercel Security Best Practices](https://vercel.com/docs/security)

---

## 🐛 Reporting Security Issues

If you discover a security vulnerability, please email: security@yourdomain.com

**Do NOT create a public GitHub issue for security vulnerabilities.**

---

**Last Updated:** 2025-11-06
**Version:** 1.0.0
**Status:** MVP Security Hardening Complete ✅

import { NextResponse } from "next/server";

/**
 * Security Headers Configuration
 * Implements OWASP recommended security headers
 */

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  strictTransportSecurity?: string;
  xFrameOptions?: string;
  xContentTypeOptions?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

/**
 * Default Content Security Policy
 * Adjust based on your application's needs
 */
const defaultCSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://*.amazonaws.com",
  "frame-src 'self' https://accounts.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

/**
 * Default security headers configuration
 */
export const defaultSecurityHeaders: SecurityHeadersConfig = {
  // Content Security Policy
  contentSecurityPolicy: defaultCSP,

  // Strict Transport Security (HSTS)
  strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",

  // Prevent clickjacking
  xFrameOptions: "DENY",

  // Prevent MIME type sniffing
  xContentTypeOptions: "nosniff",

  // Referrer policy
  referrerPolicy: "strict-origin-when-cross-origin",

  // Permissions policy (previously Feature-Policy)
  permissionsPolicy:
    "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
};

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = defaultSecurityHeaders
): NextResponse {
  const headers = response.headers;

  // Content Security Policy
  if (config.contentSecurityPolicy) {
    headers.set("Content-Security-Policy", config.contentSecurityPolicy);
  }

  // Strict Transport Security
  if (config.strictTransportSecurity) {
    headers.set("Strict-Transport-Security", config.strictTransportSecurity);
  }

  // X-Frame-Options
  if (config.xFrameOptions) {
    headers.set("X-Frame-Options", config.xFrameOptions);
  }

  // X-Content-Type-Options
  if (config.xContentTypeOptions) {
    headers.set("X-Content-Type-Options", config.xContentTypeOptions);
  }

  // Referrer-Policy
  if (config.referrerPolicy) {
    headers.set("Referrer-Policy", config.referrerPolicy);
  }

  // Permissions-Policy
  if (config.permissionsPolicy) {
    headers.set("Permissions-Policy", config.permissionsPolicy);
  }

  // Additional security headers
  headers.set("X-DNS-Prefetch-Control", "off");
  headers.set("X-Download-Options", "noopen");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

/**
 * Create a response with security headers
 */
export function createSecureResponse(
  body: any,
  init?: ResponseInit,
  config?: SecurityHeadersConfig
): NextResponse {
  const response = NextResponse.json(body, init);
  return applySecurityHeaders(response, config);
}

/**
 * Middleware wrapper that adds security headers to all responses
 */
export function withSecurityHeaders<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  config?: SecurityHeadersConfig
): T {
  return (async (...args: any[]) => {
    const response = await handler(...args);
    return applySecurityHeaders(response, config);
  }) as T;
}

/**
 * CSP Nonce generator for inline scripts
 * Use this if you need to allow specific inline scripts
 */
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString("base64");
}

/**
 * Build CSP with nonce for inline scripts
 */
export function buildCSPWithNonce(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://vercel.live https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://*.amazonaws.com",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

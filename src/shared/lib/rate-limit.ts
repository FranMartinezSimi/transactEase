import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production for multi-instance support)
const requestMap = new Map<string, RequestRecord>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestMap.entries()) {
    if (now > record.resetTime) {
      requestMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client identifier from request
 */
function getClientId(req: NextRequest): string {
  // Try to get IP from various headers (Vercel, Cloudflare, etc.)
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");

  const ip = forwardedFor?.split(",")[0] || realIp || cfConnectingIp || "unknown";

  // For authenticated requests, also include user token to prevent sharing IPs
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    return `${ip}-${authHeader.slice(0, 20)}`;
  }

  return ip;
}

/**
 * Rate limit middleware
 * @param req - Next.js request
 * @param config - Rate limit configuration
 * @returns true if allowed, false if rate limited
 */
export function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = { interval: 60000, maxRequests: 60 } // Default: 60 req/min
): { allowed: boolean; remaining: number; resetTime: number } {
  const clientId = getClientId(req);
  const now = Date.now();

  let record = requestMap.get(clientId);

  // Create new record if doesn't exist or window expired
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + config.interval,
    };
    requestMap.set(clientId, record);
  }

  // Increment request count
  record.count++;

  const allowed = record.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - record.count);

  if (!allowed) {
    logger.warn({
      message: "Rate limit exceeded",
      clientId,
      count: record.count,
      maxRequests: config.maxRequests,
    });
  }

  return {
    allowed,
    remaining,
    resetTime: record.resetTime,
  };
}

/**
 * Rate limit middleware wrapper for API routes
 */
export function withRateLimit(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const { allowed, remaining, resetTime } = rateLimit(req, config);

    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(config?.maxRequests || 60),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(Math.floor(resetTime / 1000)),
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = await handler(req, context);

    response.headers.set(
      "X-RateLimit-Limit",
      String(config?.maxRequests || 60)
    );
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set(
      "X-RateLimit-Reset",
      String(Math.floor(resetTime / 1000))
    );

    return response;
  };
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
  // Strict - for sensitive operations (login, register)
  strict: { interval: 60000, maxRequests: 5 }, // 5 req/min

  // Standard - for regular API calls
  standard: { interval: 60000, maxRequests: 60 }, // 60 req/min

  // Relaxed - for file operations
  relaxed: { interval: 60000, maxRequests: 30 }, // 30 req/min

  // Upload - for file uploads (more restrictive)
  upload: { interval: 300000, maxRequests: 10 }, // 10 uploads per 5 min
};

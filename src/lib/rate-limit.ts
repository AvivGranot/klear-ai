/**
 * Rate Limiting Utility
 * In-memory rate limiter for API protection
 *
 * For production with multiple instances, use Redis instead
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (per-process)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Cleanup every minute

export interface RateLimitConfig {
  // Max requests allowed in the window
  limit: number
  // Time window in seconds
  windowSeconds: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

/**
 * Check and update rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = identifier
  const windowMs = config.windowSeconds * 1000

  let entry = rateLimitStore.get(key)

  // If no entry or window has expired, create new one
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    }
    rateLimitStore.set(key, entry)

    return {
      success: true,
      remaining: config.limit - 1,
      resetAt: entry.resetAt,
    }
  }

  // Window still active, check limit
  if (entry.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  // Increment and allow
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.floor(result.resetAt / 1000).toString(),
  }

  if (!result.success && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString()
  }

  return headers
}

// ==================== PRESET CONFIGURATIONS ====================

export const RateLimits = {
  // Chat API - most expensive (OpenAI calls)
  chat: {
    limit: 20,
    windowSeconds: 60, // 20 requests per minute
  },

  // Auth endpoints - prevent brute force
  auth: {
    limit: 5,
    windowSeconds: 60, // 5 attempts per minute
  },

  // General API endpoints
  api: {
    limit: 60,
    windowSeconds: 60, // 60 requests per minute
  },

  // Webhooks (WhatsApp etc) - higher limit
  webhook: {
    limit: 100,
    windowSeconds: 60, // 100 per minute
  },
} as const

// ==================== HELPERS ====================

/**
 * Get identifier from request (IP-based)
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  // Fallback - in development this will be localhost
  return 'unknown'
}

/**
 * Combined key with route for more granular limiting
 */
export function getRateLimitKey(identifier: string, route: string): string {
  return `${route}:${identifier}`
}

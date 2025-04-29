import { type NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

// Initialize Redis client only if environment variables are available
let redis: Redis | null = null
let redisAvailable = false

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    redisAvailable = true
  } else {
    console.warn("Upstash Redis environment variables not found. Rate limiting will be disabled.")
  }
} catch (error) {
  console.error("Failed to initialize Redis client:", error)
}

// Rate limit configuration
const RATE_LIMIT_REQUESTS = 100000 // Number of requests allowed
const RATE_LIMIT_WINDOW = 60 * 60 // Time window in seconds (1 hour)

export async function rateLimiter(req: NextRequest, identifier?: string) {
  // If Redis is not available, skip rate limiting
  if (!redisAvailable || !redis) {
    return { success: true, remaining: RATE_LIMIT_REQUESTS }
  }

  // Use IP address if no identifier is provided
  const ip = identifier || req.ip || "anonymous"
  const key = `rate-limit:${ip}`

  try {
    // Get current count for this IP
    const currentCount = (await redis.get(key)) as number | null

    if (currentCount === null) {
      // First request, set count to 1 with expiry
      await redis.set(key, 1, { ex: RATE_LIMIT_WINDOW })
      return { success: true, remaining: RATE_LIMIT_REQUESTS - 1 }
    }

    if (currentCount >= RATE_LIMIT_REQUESTS) {
      // Rate limit exceeded
      return { success: false, remaining: 0 }
    }

    // Increment count
    const newCount = await redis.incr(key)
    return { success: true, remaining: RATE_LIMIT_REQUESTS - newCount }
  } catch (error) {
    console.error("Rate limiter error:", error)
    // If rate limiter fails, allow the request to proceed
    return { success: true, remaining: 0 }
  }
}

// Middleware for rate limiting
export async function rateLimit(req: NextRequest, identifier?: string) {
  const result = await rateLimiter(req, identifier)

  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests, please try again later" },
      { status: 429, headers: { "Retry-After": RATE_LIMIT_WINDOW.toString() } },
    )
  }

  return null
}


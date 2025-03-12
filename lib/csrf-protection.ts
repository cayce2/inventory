import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Generate a CSRF token
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Verify a CSRF token
export function verifyCsrfToken(req: NextRequest, expectedToken: string): boolean {
  const token = req.headers.get("X-CSRF-Token")
  return token === expectedToken
}

// Middleware to enforce CSRF protection
export function csrfProtection(req: NextRequest, expectedToken?: string) {
  // Skip for GET requests as they should be idempotent
  if (req.method === "GET") {
    return null
  }

  // For non-GET requests, verify the CSRF token
  if (!expectedToken || !verifyCsrfToken(req, expectedToken)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  return null
}


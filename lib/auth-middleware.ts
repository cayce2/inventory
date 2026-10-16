/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

export async function authMiddleware(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1]

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string }
    return decoded.userId
  } catch (error) {
    return null
  }
}

// Enhanced token generation with more claims
export function generateToken(userId: string, email: string, role: string) {
  return jwt.sign(
    {
      userId,
      email,
      role,
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "1h",
    },
  )
}

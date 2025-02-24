/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

export async function authMiddleware(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1]

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    return decoded.userId
  } catch (error) {
    return null
  }
}


import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ valid: false, message: "No token provided" }, { status: 401 })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      const client = await clientPromise
      const db = client.db("inventory_management")

      const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })

      if (!user) {
        return NextResponse.json({ valid: false, message: "User not found" }, { status: 401 })
      }

      return NextResponse.json({ valid: true, email: user.email }, { status: 200 })
    } catch (jwtError) {
      // Handle specific JWT errors
      if ((jwtError as Error).name === "TokenExpiredError") {
        return NextResponse.json({ valid: false, message: "Token expired" }, { status: 401 })
      } else {
        return NextResponse.json({ valid: false, message: "Invalid token" }, { status: 401 })
      }
    }
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ valid: false, message: "Server error" }, { status: 500 })
  }
}


import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken, getTokenFromCookies } from "@/lib/auth"

export async function GET() {
  try {
    const token = await getTokenFromCookies()

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const users = await sql`
      SELECT u.id, u.email, u.name, u.country, u.created_at,
             w.id as workspace_id, w.name as workspace_name, w.plan_id,
             p.name as plan_name
      FROM users u
      LEFT JOIN workspace_members wm ON wm.user_id = u.id
      LEFT JOIN workspaces w ON w.id = wm.workspace_id
      LEFT JOIN plans p ON p.id = w.plan_id
      WHERE u.id = ${payload.userId}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      country: user.country,
      workspace: user.workspace_id
        ? {
            id: user.workspace_id,
            name: user.workspace_name,
            planId: user.plan_id,
            planName: user.plan_name,
          }
        : null,
    })
  } catch (error) {
    console.error("Get me error:", error)
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 })
  }
}

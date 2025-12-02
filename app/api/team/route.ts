import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken, getTokenFromCookies } from "@/lib/auth"

export async function GET() {
  try {
    const token = await getTokenFromCookies()
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.workspaceId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const members = await sql`
      SELECT u.id, u.email, u.name, wm.role, wm.created_at
      FROM workspace_members wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = ${payload.workspaceId}
      ORDER BY wm.created_at ASC
    `

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Get team error:", error)
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 })
  }
}

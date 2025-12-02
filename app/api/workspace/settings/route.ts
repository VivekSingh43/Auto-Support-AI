import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId, name, timezone, defaultLanguage } = await request.json()

    // Verify user has access to workspace
    const member = await sql`
      SELECT role FROM workspace_members 
      WHERE workspace_id = ${workspaceId} AND user_id = ${session.user.id}
    `

    if (member.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await sql`
      UPDATE workspaces
      SET name = ${name},
          timezone = ${timezone},
          default_language = ${defaultLanguage},
          updated_at = NOW()
      WHERE id = ${workspaceId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Settings update error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId, botName, greetingMessage, tone, primaryColor } = await request.json()

    // Verify user has access
    const member = await sql`
      SELECT role FROM workspace_members 
      WHERE workspace_id = ${workspaceId} AND user_id = ${session.user.id}
    `
    if (member.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await sql`
      UPDATE bot_settings
      SET bot_name = ${botName},
          greeting_message = ${greetingMessage},
          tone = ${tone},
          primary_color = ${primaryColor},
          updated_at = NOW()
      WHERE workspace_id = ${workspaceId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Bot settings error:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId, workspaceId } = await request.json()

    // Verify user has access
    const member = await sql`
      SELECT role FROM workspace_members 
      WHERE workspace_id = ${workspaceId} AND user_id = ${session.user.id}
    `
    if (member.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if ticket already exists
    const existing = await sql`
      SELECT id FROM tickets WHERE conversation_id = ${conversationId}
    `
    if (existing.length > 0) {
      return NextResponse.json({ error: "Ticket already exists" }, { status: 400 })
    }

    // Create ticket
    const ticket = await sql`
      INSERT INTO tickets (workspace_id, conversation_id, status, priority)
      VALUES (${workspaceId}, ${conversationId}, 'open', 'normal')
      RETURNING *
    `

    // Update conversation status
    await sql`
      UPDATE conversations SET status = 'needs_human' WHERE id = ${conversationId}
    `

    return NextResponse.json({ success: true, ticket: ticket[0] })
  } catch (error) {
    console.error("Ticket create error:", error)
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
}

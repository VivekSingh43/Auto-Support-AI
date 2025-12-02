import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { workspaceKey, conversationId, visitorId } = await request.json()

    if (!workspaceKey) {
      return NextResponse.json({ error: "Workspace key required" }, { status: 400 })
    }

    // Get workspace
    const workspaces = await sql`
      SELECT id FROM workspaces WHERE public_key = ${workspaceKey}
    `
    if (workspaces.length === 0) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const workspaceId = workspaces[0].id

    // Get or create conversation
    let convId = conversationId
    if (!convId) {
      // Create new conversation
      const newConv = await sql`
        INSERT INTO conversations (workspace_id, visitor_id, status)
        VALUES (${workspaceId}, ${visitorId || "anonymous"}, 'needs_human')
        RETURNING id
      `
      convId = newConv[0].id
    } else {
      // Update existing conversation
      await sql`
        UPDATE conversations SET status = 'needs_human' WHERE id = ${convId}
      `
    }

    // Check if ticket already exists
    const existing = await sql`
      SELECT id FROM tickets WHERE conversation_id = ${convId}
    `
    if (existing.length > 0) {
      return NextResponse.json({ success: true, message: "Ticket already exists" })
    }

    // Create ticket
    await sql`
      INSERT INTO tickets (workspace_id, conversation_id, status, priority)
      VALUES (${workspaceId}, ${convId}, 'open', 'normal')
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Widget ticket error:", error)
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
}

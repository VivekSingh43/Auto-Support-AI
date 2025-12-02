import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId, ticketId, message } = await request.json()

    // Get ticket and verify access
    const tickets = await sql`
      SELECT t.workspace_id FROM tickets t WHERE t.id = ${ticketId}
    `
    if (tickets.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const member = await sql`
      SELECT role FROM workspace_members 
      WHERE workspace_id = ${tickets[0].workspace_id} AND user_id = ${session.user.id}
    `
    if (member.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Add agent message
    await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${conversationId}, 'agent', ${message})
    `

    // Update ticket status to pending
    await sql`
      UPDATE tickets SET status = 'pending', updated_at = NOW() WHERE id = ${ticketId}
    `

    // Update conversation
    await sql`
      UPDATE conversations SET updated_at = NOW() WHERE id = ${conversationId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reply error:", error)
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 })
  }
}

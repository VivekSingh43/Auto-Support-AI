import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status, priority } = await request.json()

    // Get ticket and verify access
    const tickets = await sql`
      SELECT t.workspace_id FROM tickets t
      WHERE t.id = ${id}
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

    // Update ticket
    if (status) {
      await sql`UPDATE tickets SET status = ${status}, updated_at = NOW() WHERE id = ${id}`

      // Also update conversation status
      const ticket = tickets[0]
      if (status === "resolved") {
        await sql`
          UPDATE conversations SET status = 'resolved', updated_at = NOW()
          WHERE id = (SELECT conversation_id FROM tickets WHERE id = ${id})
        `
      }
    }

    if (priority) {
      await sql`UPDATE tickets SET priority = ${priority}, updated_at = NOW() WHERE id = ${id}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ticket update error:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

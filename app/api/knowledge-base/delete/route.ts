import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId, sourceName, sourceType } = await request.json()

    // Verify user has access (owner only for delete)
    const member = await sql`
      SELECT role FROM workspace_members 
      WHERE workspace_id = ${workspaceId} AND user_id = ${session.user.id}
    `
    if (member.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await sql`
      DELETE FROM kb_chunks 
      WHERE workspace_id = ${workspaceId} 
        AND source_name = ${sourceName} 
        AND source_type = ${sourceType}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}

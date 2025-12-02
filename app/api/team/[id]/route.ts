import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken, getTokenFromCookies } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: memberId } = await params
    const token = await getTokenFromCookies()

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.workspaceId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Check if user is owner or admin
    const memberCheck = await sql`
      SELECT role FROM workspace_members 
      WHERE workspace_id = ${payload.workspaceId} AND user_id = ${payload.userId}
    `

    if (memberCheck.length === 0 || !["owner", "admin"].includes(memberCheck[0].role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Can't remove owner
    const targetMember = await sql`
      SELECT role FROM workspace_members 
      WHERE workspace_id = ${payload.workspaceId} AND user_id = ${memberId}
    `

    if (targetMember.length > 0 && targetMember[0].role === "owner") {
      return NextResponse.json({ error: "Cannot remove workspace owner" }, { status: 400 })
    }

    // Remove member
    await sql`
      DELETE FROM workspace_members 
      WHERE workspace_id = ${payload.workspaceId} AND user_id = ${memberId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove member error:", error)
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}

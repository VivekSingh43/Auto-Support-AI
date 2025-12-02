import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken, getTokenFromCookies } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role required" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `

    if (existingUser.length === 0) {
      // For now, return an error. In production, you'd send an invite email
      return NextResponse.json(
        {
          error: "User not found. They need to sign up first.",
        },
        { status: 400 },
      )
    }

    const userId = existingUser[0].id

    // Check if already a member
    const alreadyMember = await sql`
      SELECT id FROM workspace_members 
      WHERE workspace_id = ${payload.workspaceId} AND user_id = ${userId}
    `

    if (alreadyMember.length > 0) {
      return NextResponse.json({ error: "User is already a member" }, { status: 400 })
    }

    // Add to workspace
    await sql`
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES (${payload.workspaceId}, ${userId}, ${role})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Invite error:", error)
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 })
  }
}

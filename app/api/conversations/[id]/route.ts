import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken, getTokenFromCookies } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = await getTokenFromCookies()

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.workspaceId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get conversation
    const conversations = await sql`
      SELECT * FROM conversations 
      WHERE id = ${id} AND workspace_id = ${payload.workspaceId}
    `

    if (conversations.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Get messages
    const messages = await sql`
      SELECT * FROM messages 
      WHERE conversation_id = ${id}
      ORDER BY created_at ASC
    `

    return NextResponse.json({
      conversation: conversations[0],
      messages,
    })
  } catch (error) {
    console.error("Get conversation error:", error)
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = await getTokenFromCookies()

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.workspaceId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { status, needsHuman } = body

    const updates: string[] = []
    const values: unknown[] = []

    if (status !== undefined) {
      updates.push("status")
      values.push(status)
    }

    if (needsHuman !== undefined) {
      updates.push("needs_human")
      values.push(needsHuman)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    // Build dynamic update
    let updateQuery = `UPDATE conversations SET updated_at = NOW()`
    if (status !== undefined) {
      updateQuery += `, status = '${status}'`
    }
    if (needsHuman !== undefined) {
      updateQuery += `, needs_human = ${needsHuman}`
    }

    const result = await sql`
      UPDATE conversations 
      SET 
        status = COALESCE(${status}, status),
        needs_human = COALESCE(${needsHuman}, needs_human),
        updated_at = NOW()
      WHERE id = ${id} AND workspace_id = ${payload.workspaceId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Update conversation error:", error)
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 })
  }
}

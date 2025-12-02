import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken, getTokenFromCookies } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = await getTokenFromCookies()
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.workspaceId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const needsHuman = searchParams.get("needsHuman")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let conversations

    if (status && needsHuman === "true") {
      conversations = await sql`
        SELECT 
          c.*,
          (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
        FROM conversations c
        WHERE c.workspace_id = ${payload.workspaceId}
          AND c.status = ${status}
          AND c.needs_human = true
        ORDER BY c.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (status) {
      conversations = await sql`
        SELECT 
          c.*,
          (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
        FROM conversations c
        WHERE c.workspace_id = ${payload.workspaceId}
          AND c.status = ${status}
        ORDER BY c.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (needsHuman === "true") {
      conversations = await sql`
        SELECT 
          c.*,
          (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
        FROM conversations c
        WHERE c.workspace_id = ${payload.workspaceId}
          AND c.needs_human = true
        ORDER BY c.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      conversations = await sql`
        SELECT 
          c.*,
          (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
        FROM conversations c
        WHERE c.workspace_id = ${payload.workspaceId}
        ORDER BY c.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM conversations WHERE workspace_id = ${payload.workspaceId}
    `

    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        total: Number.parseInt(countResult[0].total),
        totalPages: Math.ceil(Number.parseInt(countResult[0].total) / limit),
      },
    })
  } catch (error) {
    console.error("Get conversations error:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

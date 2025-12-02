import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")
    const workspaceKey = searchParams.get("workspaceKey")
    const visitorId = searchParams.get("visitorId")

    if (!workspaceKey) {
      return NextResponse.json({ error: "Workspace key required" }, { status: 400 })
    }

    // Verify workspace exists
    const workspaces = await sql`
      SELECT id FROM workspaces WHERE public_key = ${workspaceKey}
    `
    if (workspaces.length === 0) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const workspaceId = workspaces[0].id

    // Get conversation
    let conversation
    if (conversationId) {
      const convs = await sql`
        SELECT * FROM conversations 
        WHERE id = ${conversationId} AND workspace_id = ${workspaceId}
      `
      conversation = convs[0]
    } else if (visitorId) {
      // Get most recent active conversation for this visitor
      const convs = await sql`
        SELECT * FROM conversations 
        WHERE workspace_id = ${workspaceId} 
          AND visitor_id = ${visitorId}
          AND status != 'resolved'
        ORDER BY updated_at DESC
        LIMIT 1
      `
      conversation = convs[0]
    }

    if (!conversation) {
      return NextResponse.json({ messages: [], conversationId: null })
    }

    // Get messages
    const messages = await sql`
      SELECT id, role, content, sources, confidence, created_at
      FROM messages
      WHERE conversation_id = ${conversation.id}
      ORDER BY created_at ASC
    `

    return NextResponse.json({
      conversationId: conversation.id,
      status: conversation.status,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: m.sources,
        confidence: m.confidence,
        timestamp: m.created_at,
      })),
    })
  } catch (error) {
    console.error("History error:", error)
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}

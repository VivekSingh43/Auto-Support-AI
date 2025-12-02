import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken, getTokenFromCookies } from "@/lib/auth"

export async function GET() {
  try {
    const token = await getTokenFromCookies()
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.workspaceId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get current month's start
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get conversation count for current month
    const conversationCount = await sql`
      SELECT COUNT(*) as count FROM conversations 
      WHERE workspace_id = ${payload.workspaceId}
        AND created_at >= ${monthStart.toISOString()}
    `

    // Get team member count
    const memberCount = await sql`
      SELECT COUNT(*) as count FROM workspace_members 
      WHERE workspace_id = ${payload.workspaceId}
    `

    // Get document count
    const documentCount = await sql`
      SELECT COUNT(DISTINCT source_name) as count FROM kb_chunks 
      WHERE workspace_id = ${payload.workspaceId}
    `

    // Get workspace plan limits
    const workspace = await sql`
      SELECT w.*, p.name as plan_name, p.max_conversations_per_month, 
             p.max_agents, p.max_documents
      FROM workspaces w
      JOIN plans p ON p.id = w.plan_id
      WHERE w.id = ${payload.workspaceId}
    `

    if (workspace.length === 0) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const ws = workspace[0]

    return NextResponse.json({
      usage: {
        conversations: Number.parseInt(conversationCount[0].count),
        agents: Number.parseInt(memberCount[0].count),
        documents: Number.parseInt(documentCount[0].count),
      },
      limits: {
        maxConversations: ws.max_conversations_per_month,
        maxAgents: ws.max_agents,
        maxDocuments: ws.max_documents,
      },
      planName: ws.plan_name,
    })
  } catch (error) {
    console.error("Usage error:", error)
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 })
  }
}

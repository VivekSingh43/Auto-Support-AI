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

    const workspaceId = payload.workspaceId
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get("period") || "7d"

    // Calculate date range
    let daysBack = 7
    if (period === "30d") daysBack = 30
    if (period === "90d") daysBack = 90

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    // Get conversation stats over time
    const conversationStats = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE needs_human = true) as escalated
      FROM conversations
      WHERE workspace_id = ${workspaceId}
        AND created_at >= ${startDate.toISOString()}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // Get response time stats
    const responseStats = await sql`
      SELECT 
        DATE(m.created_at) as date,
        AVG(
          EXTRACT(EPOCH FROM (
            (SELECT MIN(m2.created_at) FROM messages m2 
             WHERE m2.conversation_id = m.conversation_id 
             AND m2.role = 'assistant' 
             AND m2.created_at > m.created_at)
            - m.created_at
          ))
        ) as avg_response_time
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE c.workspace_id = ${workspaceId}
        AND m.role = 'user'
        AND m.created_at >= ${startDate.toISOString()}
      GROUP BY DATE(m.created_at)
      ORDER BY date ASC
    `

    // Get top sources used
    const topSources = await sql`
      SELECT 
        source_name,
        source_type,
        COUNT(*) as usage_count
      FROM kb_chunks
      WHERE workspace_id = ${workspaceId}
      GROUP BY source_name, source_type
      ORDER BY usage_count DESC
      LIMIT 10
    `

    // Get ticket resolution stats
    const ticketStats = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved
      FROM tickets
      WHERE workspace_id = ${workspaceId}
        AND created_at >= ${startDate.toISOString()}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    return NextResponse.json({
      conversationStats,
      responseStats,
      topSources,
      ticketStats,
      period,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}

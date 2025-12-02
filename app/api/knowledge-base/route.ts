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

    // Get aggregated sources
    const sources = await sql`
      SELECT 
        source_type,
        source_name,
        COUNT(*) as chunk_count,
        MIN(created_at) as created_at,
        MAX(updated_at) as updated_at
      FROM kb_chunks
      WHERE workspace_id = ${payload.workspaceId}
      GROUP BY source_type, source_name
      ORDER BY MAX(created_at) DESC
    `

    // Get total chunks and storage estimate
    const stats = await sql`
      SELECT 
        COUNT(*) as total_chunks,
        COUNT(DISTINCT source_name) as total_sources,
        SUM(LENGTH(content)) as total_characters
      FROM kb_chunks
      WHERE workspace_id = ${payload.workspaceId}
    `

    return NextResponse.json({
      sources,
      stats: stats[0],
    })
  } catch (error) {
    console.error("Get KB error:", error)
    return NextResponse.json({ error: "Failed to fetch knowledge base" }, { status: 500 })
  }
}

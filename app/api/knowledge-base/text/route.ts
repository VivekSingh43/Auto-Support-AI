import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { generateEmbedding, chunkText } from "@/lib/embeddings"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId, title, content } = await request.json()

    // Verify user has access
    const member = await sql`
      SELECT role FROM workspace_members 
      WHERE workspace_id = ${workspaceId} AND user_id = ${session.user.id}
    `
    if (member.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check document limit
    const limitCheck = await checkDocumentLimit(workspaceId)
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: "Document limit reached" }, { status: 403 })
    }

    // Chunk the text
    const chunks = chunkText(content)

    // Generate embeddings and store each chunk
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk)
      await sql`
        INSERT INTO kb_chunks (workspace_id, source_type, source_name, content, embedding)
        VALUES (${workspaceId}, 'text', ${title}, ${chunk}, ${embedding}::vector)
      `
    }

    return NextResponse.json({ success: true, chunks: chunks.length })
  } catch (error) {
    console.error("Text add error:", error)
    return NextResponse.json({ error: "Failed to add text" }, { status: 500 })
  }
}

async function checkDocumentLimit(workspaceId: string) {
  const result = await sql`
    SELECT 
      (SELECT COUNT(DISTINCT source_name) FROM kb_chunks WHERE workspace_id = ${workspaceId}) as current_count,
      p.max_documents
    FROM workspaces w
    JOIN plans p ON w.plan_id = p.id
    WHERE w.id = ${workspaceId}
  `
  const { current_count, max_documents } = result[0] || {}
  return { allowed: Number.parseInt(current_count) < max_documents, current: current_count, max: max_documents }
}

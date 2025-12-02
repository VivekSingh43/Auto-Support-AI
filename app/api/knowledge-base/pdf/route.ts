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

    const formData = await request.formData()
    const file = formData.get("file") as File
    const workspaceId = formData.get("workspaceId") as string

    if (!file || !workspaceId) {
      return NextResponse.json({ error: "File and workspace ID required" }, { status: 400 })
    }

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

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text from PDF using pdf-parse
    const pdfParse = (await import("pdf-parse")).default
    const pdfData = await pdfParse(buffer)
    const text = pdfData.text

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 })
    }

    // Chunk the text
    const chunks = chunkText(text)
    const sourceName = file.name

    // Generate embeddings and store each chunk
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk)
      await sql`
        INSERT INTO kb_chunks (workspace_id, source_type, source_name, content, embedding, metadata)
        VALUES (${workspaceId}, 'pdf', ${sourceName}, ${chunk}, ${embedding}::vector, ${JSON.stringify({ fileName: file.name, fileSize: file.size })})
      `
    }

    return NextResponse.json({ success: true, chunks: chunks.length })
  } catch (error) {
    console.error("PDF upload error:", error)
    return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 })
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

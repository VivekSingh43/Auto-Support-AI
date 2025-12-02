// Generate embeddings using OpenAI
export async function generateEmbedding(text: string): Promise<string> {
  try {
    // Use OpenAI embeddings via fetch since AI SDK doesn't have direct embedding support
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to generate embedding")
    }

    const data = await response.json()
    const embedding = data.data[0].embedding

    // Return as PostgreSQL vector string format
    return `[${embedding.join(",")}]`
  } catch (error) {
    console.error("Embedding error:", error)
    // Return a zero vector as fallback (1536 dimensions for text-embedding-3-small)
    return `[${Array(1536).fill(0).join(",")}]`
  }
}

// Chunk text into smaller pieces for better retrieval
export function chunkText(text: string, maxChunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = []

  // Clean the text
  const cleanedText = text.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim()

  if (cleanedText.length <= maxChunkSize) {
    return [cleanedText]
  }

  // Split by paragraphs first
  const paragraphs = cleanedText.split(/\n\n+/)

  let currentChunk = ""

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed max size
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        // Keep overlap from previous chunk
        const words = currentChunk.split(" ")
        const overlapWords = words.slice(-Math.floor(overlap / 5))
        currentChunk = overlapWords.join(" ") + " " + paragraph
      } else {
        // Paragraph itself is too long, split by sentences
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph]
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxChunkSize) {
            if (currentChunk.length > 0) {
              chunks.push(currentChunk.trim())
            }
            currentChunk = sentence
          } else {
            currentChunk += " " + sentence
          }
        }
      }
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

// Search for similar chunks using vector similarity
export async function searchSimilarChunks(
  workspaceId: string,
  query: string,
  topK = 5,
): Promise<Array<{ content: string; source_name: string; source_type: string; similarity: number }>> {
  const { sql } = await import("./db")

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query)

  // Search using cosine similarity
  const results = await sql`
    SELECT 
      content,
      source_name,
      source_type,
      1 - (embedding <=> ${queryEmbedding}::vector) as similarity
    FROM kb_chunks
    WHERE workspace_id = ${workspaceId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${topK}
  `

  return results as Array<{ content: string; source_name: string; source_type: string; similarity: number }>
}

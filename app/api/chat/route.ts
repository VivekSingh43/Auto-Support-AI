import { NextResponse } from "next/server"
import { generateText } from "ai"
import { sql } from "@/lib/db"
import { searchSimilarChunks } from "@/lib/embeddings"

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { workspaceKey, message, conversationId, visitorId } = await request.json()

    if (!workspaceKey || !message) {
      return NextResponse.json({ error: "Workspace key and message are required" }, { status: 400 })
    }

    // Get workspace by public key
    const workspaces = await sql`
      SELECT w.*, bs.bot_name, bs.greeting_message, bs.tone
      FROM workspaces w
      LEFT JOIN bot_settings bs ON w.id = bs.workspace_id
      WHERE w.public_key = ${workspaceKey}
    `

    if (workspaces.length === 0) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const workspace = workspaces[0]

    // Check conversation limit
    const limitCheck = await checkConversationLimit(workspace.id)
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: "Conversation limit reached for this workspace" }, { status: 429 })
    }

    // Get or create conversation
    let convId = conversationId
    if (!convId) {
      const newConv = await sql`
        INSERT INTO conversations (workspace_id, visitor_id, status)
        VALUES (${workspace.id}, ${visitorId || "anonymous"}, 'active')
        RETURNING id
      `
      convId = newConv[0].id
    }

    // Store user message
    await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${convId}, 'user', ${message})
    `

    // Search for relevant context using RAG
    const relevantChunks = await searchSimilarChunks(workspace.id, message, 5)

    // Build context from relevant chunks
    const contextParts = relevantChunks
      .filter((chunk) => chunk.similarity > 0.3) // Only include relevant chunks
      .map((chunk) => `[Source: ${chunk.source_name}]\n${chunk.content}`)

    const context =
      contextParts.length > 0
        ? contextParts.join("\n\n---\n\n")
        : "No relevant information found in the knowledge base."

    // Determine confidence based on similarity scores
    const avgSimilarity =
      relevantChunks.length > 0 ? relevantChunks.reduce((sum, c) => sum + c.similarity, 0) / relevantChunks.length : 0

    const confidence = Math.min(avgSimilarity * 1.5, 1) // Scale similarity to confidence

    // Get conversation history
    const history = await sql`
      SELECT role, content FROM messages
      WHERE conversation_id = ${convId}
      ORDER BY created_at DESC
      LIMIT 10
    `

    const historyText = history
      .reverse()
      .slice(0, -1) // Exclude current message
      .map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`)
      .join("\n")

    // Build the system prompt based on tone
    const toneInstructions = {
      formal: "Respond in a professional, formal tone. Use complete sentences and proper grammar.",
      friendly: "Respond in a warm, friendly tone. Be helpful and approachable.",
      casual: "Respond in a casual, conversational tone. Be relaxed but still helpful.",
    }

    const systemPrompt = `You are ${workspace.bot_name || "Support Bot"}, a helpful customer support assistant for ${workspace.name}.

${toneInstructions[workspace.tone as keyof typeof toneInstructions] || toneInstructions.friendly}

IMPORTANT RULES:
1. Answer questions ONLY based on the provided context from the knowledge base.
2. If the context doesn't contain relevant information to answer the question, say so politely and offer to connect them with a human agent.
3. Never make up information that isn't in the context.
4. Keep responses concise and helpful.
5. If asked about something completely unrelated to customer support, politely redirect the conversation.

KNOWLEDGE BASE CONTEXT:
${context}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ""}

Current customer message: ${message}`

    // Generate AI response
    const { text: aiResponse } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: systemPrompt,
      maxOutputTokens: 500,
      temperature: 0.7,
    })

    // Check if AI indicates low confidence or inability to answer
    const lowConfidenceIndicators = [
      "don't have information",
      "not sure",
      "cannot find",
      "no information",
      "unable to answer",
      "connect you with",
      "human agent",
      "speak to someone",
    ]

    const needsHuman =
      confidence < 0.4 || lowConfidenceIndicators.some((indicator) => aiResponse.toLowerCase().includes(indicator))

    // Update conversation status if needed
    if (needsHuman) {
      await sql`
        UPDATE conversations 
        SET status = 'needs_human', updated_at = NOW()
        WHERE id = ${convId}
      `
    }

    // Store AI response
    await sql`
      INSERT INTO messages (conversation_id, role, content, sources, confidence)
      VALUES (
        ${convId}, 
        'assistant', 
        ${aiResponse}, 
        ${JSON.stringify(relevantChunks.slice(0, 3).map((c) => ({ content: c.content.slice(0, 200), source_name: c.source_name })))},
        ${confidence}
      )
    `

    return NextResponse.json({
      conversationId: convId,
      message: aiResponse,
      confidence,
      needsHuman,
      sources: relevantChunks.slice(0, 3).map((c) => ({
        name: c.source_name,
        type: c.source_type,
      })),
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}

async function checkConversationLimit(workspaceId: string) {
  const result = await sql`
    SELECT 
      (SELECT COUNT(*) FROM conversations 
       WHERE workspace_id = ${workspaceId} 
       AND created_at > date_trunc('month', NOW())) as current_count,
      p.max_conversations
    FROM workspaces w
    JOIN plans p ON w.plan_id = p.id
    WHERE w.id = ${workspaceId}
  `
  const { current_count, max_conversations } = result[0] || {}
  return {
    allowed: Number.parseInt(current_count) < max_conversations,
    current: current_count,
    max: max_conversations,
  }
}

import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceKey = searchParams.get("workspaceKey")

    if (!workspaceKey) {
      return NextResponse.json({ error: "Workspace key required" }, { status: 400 })
    }

    const result = await sql`
      SELECT w.name, bs.bot_name, bs.greeting_message, bs.primary_color
      FROM workspaces w
      LEFT JOIN bot_settings bs ON w.id = bs.workspace_id
      WHERE w.public_key = ${workspaceKey}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const config = result[0]

    return NextResponse.json({
      workspaceName: config.name,
      botName: config.bot_name || "Support Bot",
      greeting: config.greeting_message || "Hello! How can I help you today?",
      primaryColor: config.primary_color || "#0066FF",
    })
  } catch (error) {
    console.error("Widget config error:", error)
    return NextResponse.json({ error: "Failed to get config" }, { status: 500 })
  }
}

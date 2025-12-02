import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, User, Bot, UserCheck } from "lucide-react"
import { CreateTicketButton } from "@/components/create-ticket-button"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  const workspaceId = session?.currentWorkspace?.id!

  // Get conversation
  const convs = await sql`
    SELECT * FROM conversations 
    WHERE id = ${id} AND workspace_id = ${workspaceId}
  `

  if (convs.length === 0) {
    notFound()
  }

  const conversation = convs[0]

  // Get messages
  const messages = await sql`
    SELECT * FROM messages
    WHERE conversation_id = ${id}
    ORDER BY created_at ASC
  `

  // Check if ticket exists
  const tickets = await sql`
    SELECT id FROM tickets WHERE conversation_id = ${id}
  `
  const hasTicket = tickets.length > 0

  const STATUS_COLORS: Record<string, string> = {
    active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    needs_human: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/conversations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Conversation
              <Badge className={STATUS_COLORS[conversation.status as string]} variant="secondary">
                {(conversation.status as string).replace("_", " ")}
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              {conversation.visitor_email || `Visitor ${(conversation.visitor_id as string)?.slice(0, 8)}`} · Started{" "}
              {new Date(conversation.created_at as string).toLocaleString()}
            </p>
          </div>
        </div>
        {!hasTicket && conversation.status !== "resolved" && (
          <CreateTicketButton conversationId={id} workspaceId={workspaceId} />
        )}
        {hasTicket && (
          <Link href={`/dashboard/inbox`}>
            <Button variant="outline">View Ticket</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "" : "flex-row-reverse"}`}>
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-muted"
                      : msg.role === "agent"
                        ? "bg-green-100 dark:bg-green-900"
                        : "bg-primary/10"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4 text-muted-foreground" />
                  ) : msg.role === "agent" ? (
                    <UserCheck className="h-4 w-4 text-green-600" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-muted"
                      : msg.role === "agent"
                        ? "bg-green-100 dark:bg-green-900"
                        : "bg-primary/10"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(msg.created_at as string).toLocaleTimeString()}
                    </p>
                    {msg.confidence && (
                      <span className="text-xs text-muted-foreground">
                        · Confidence: {Math.round((msg.confidence as number) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

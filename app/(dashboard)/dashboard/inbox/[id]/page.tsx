import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, User, Bot, UserCheck } from "lucide-react"
import { TicketActions } from "@/components/ticket-actions"
import { AgentReplyForm } from "@/components/agent-reply-form"

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  const workspaceId = session?.currentWorkspace?.id!

  // Get ticket
  const tickets = await sql`
    SELECT t.*, c.visitor_id, c.visitor_email
    FROM tickets t
    JOIN conversations c ON t.conversation_id = c.id
    WHERE t.id = ${id} AND t.workspace_id = ${workspaceId}
  `

  if (tickets.length === 0) {
    notFound()
  }

  const ticket = tickets[0]

  // Get messages
  const messages = await sql`
    SELECT * FROM messages
    WHERE conversation_id = ${ticket.conversation_id}
    ORDER BY created_at ASC
  `

  const STATUS_COLORS: Record<string, string> = {
    open: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  }

  const PRIORITY_COLORS: Record<string, string> = {
    urgent: "bg-red-500 text-white",
    high: "bg-orange-500 text-white",
    normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inbox">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">
              Ticket #{(ticket.id as string).slice(0, 8)}
              <Badge className={STATUS_COLORS[ticket.status as string]} variant="secondary">
                {ticket.status}
              </Badge>
              <Badge className={PRIORITY_COLORS[ticket.priority as string]} variant="secondary">
                {ticket.priority}
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              {ticket.visitor_email || `Visitor ${(ticket.visitor_id as string)?.slice(0, 8)}`} · Created{" "}
              {new Date(ticket.created_at as string).toLocaleString()}
            </p>
          </div>
        </div>
        <TicketActions
          ticketId={id}
          currentStatus={ticket.status as string}
          currentPriority={ticket.priority as string}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
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
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.created_at as string).toLocaleTimeString()}
                        {msg.role === "agent" && " · Agent reply"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {ticket.status !== "resolved" && (
            <AgentReplyForm conversationId={ticket.conversation_id as string} ticketId={id} />
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ticket Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Visitor</p>
                <p className="font-medium">
                  {ticket.visitor_email || `ID: ${(ticket.visitor_id as string)?.slice(0, 12)}`}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{new Date(ticket.created_at as string).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">{new Date(ticket.updated_at as string).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Assigned To</p>
                <p className="font-medium">{ticket.assigned_agent_id ? "Agent" : "Unassigned"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

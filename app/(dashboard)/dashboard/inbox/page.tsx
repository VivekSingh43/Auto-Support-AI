import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Inbox, Clock, User, AlertCircle } from "lucide-react"

export default async function InboxPage() {
  const session = await getSession()
  const workspaceId = session?.currentWorkspace?.id!

  const tickets = await sql`
    SELECT 
      t.*,
      c.visitor_id,
      c.visitor_email,
      (SELECT content FROM messages WHERE conversation_id = t.conversation_id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT COUNT(*) FROM messages WHERE conversation_id = t.conversation_id) as message_count
    FROM tickets t
    JOIN conversations c ON t.conversation_id = c.id
    WHERE t.workspace_id = ${workspaceId}
    ORDER BY 
      CASE t.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'normal' THEN 3 
        WHEN 'low' THEN 4 
      END,
      t.created_at DESC
    LIMIT 50
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

  const openCount = tickets.filter((t) => t.status === "open").length
  const pendingCount = tickets.filter((t) => t.status === "pending").length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inbox</h2>
          <p className="text-muted-foreground">Tickets requiring human attention.</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>{openCount} open</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span>{pendingCount} pending</span>
          </div>
        </div>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">All clear!</h3>
            <p className="text-muted-foreground">No tickets requiring attention. Your AI bot is handling everything.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/dashboard/inbox/${ticket.id}`} className="block">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          ticket.priority === "urgent" ? "bg-red-100 dark:bg-red-900" : "bg-muted"
                        }`}
                      >
                        {ticket.priority === "urgent" ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium">
                            {ticket.visitor_email || `Visitor ${(ticket.visitor_id as string)?.slice(0, 8)}`}
                          </p>
                          <Badge className={STATUS_COLORS[ticket.status as string]} variant="secondary">
                            {ticket.status}
                          </Badge>
                          <Badge className={PRIORITY_COLORS[ticket.priority as string]} variant="secondary">
                            {ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{ticket.last_message || "No messages"}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(ticket.created_at as string).toLocaleString()}
                          </span>
                          <span>{ticket.message_count} messages</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

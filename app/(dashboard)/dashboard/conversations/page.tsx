import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { MessageSquare, Clock, User } from "lucide-react"

export default async function ConversationsPage() {
  const session = await getSession()
  const workspaceId = session?.currentWorkspace?.id!

  const conversations = await sql`
    SELECT 
      c.*,
      (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
      (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
    FROM conversations c
    WHERE c.workspace_id = ${workspaceId}
    ORDER BY c.updated_at DESC
    LIMIT 50
  `

  const STATUS_COLORS: Record<string, string> = {
    active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    needs_human: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Conversations</h2>
        <p className="text-muted-foreground">View all chat conversations with your customers.</p>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
            <p className="text-muted-foreground mb-4">
              Conversations will appear here once visitors start chatting with your bot.
            </p>
            <Link href="/dashboard/widget">
              <span className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Get Widget Code
              </span>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <Link key={conv.id} href={`/dashboard/conversations/${conv.id}`} className="block">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {conv.visitor_email || `Visitor ${conv.visitor_id?.slice(0, 8)}`}
                          </p>
                          <Badge className={STATUS_COLORS[conv.status as string]} variant="secondary">
                            {(conv.status as string).replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.last_message || "No messages"}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {conv.message_count} messages
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(conv.updated_at as string).toLocaleString()}
                          </span>
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

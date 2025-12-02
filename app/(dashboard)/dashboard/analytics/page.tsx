import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalyticsCharts } from "@/components/analytics-charts"

export default async function AnalyticsPage() {
  const session = await getSession()
  const workspaceId = session?.currentWorkspace?.id!

  const conversationsByDay = await getConversationsByDay(workspaceId)
  const statusBreakdown = await getStatusBreakdown(workspaceId)
  const topQueries = await getTopQueries(workspaceId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-muted-foreground">Detailed insights into your customer support performance.</p>
      </div>

      <AnalyticsCharts conversationsByDay={conversationsByDay} statusBreakdown={statusBreakdown} />

      <Card>
        <CardHeader>
          <CardTitle>Top Questions</CardTitle>
          <CardDescription>Most frequently asked questions</CardDescription>
        </CardHeader>
        <CardContent>
          {topQueries.length > 0 ? (
            <div className="space-y-3">
              {topQueries.map((q, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <p className="text-sm truncate flex-1 mr-4">{q.content}</p>
                  <span className="text-sm text-muted-foreground shrink-0">{q.count} times</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No conversation data available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

async function getConversationsByDay(workspaceId: string) {
  const result = await sql`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM conversations
    WHERE workspace_id = ${workspaceId}
      AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date
  `
  return result.map((r) => ({ date: r.date as string, count: Number.parseInt(r.count as string) }))
}

async function getStatusBreakdown(workspaceId: string) {
  const result = await sql`
    SELECT status, COUNT(*) as count
    FROM conversations
    WHERE workspace_id = ${workspaceId}
    GROUP BY status
  `
  return result.map((r) => ({ status: r.status as string, count: Number.parseInt(r.count as string) }))
}

async function getTopQueries(workspaceId: string) {
  const result = await sql`
    SELECT m.content, COUNT(*) as count
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE c.workspace_id = ${workspaceId}
      AND m.role = 'user'
    GROUP BY m.content
    ORDER BY count DESC
    LIMIT 10
  `
  return result.map((r) => ({ content: r.content as string, count: Number.parseInt(r.count as string) }))
}

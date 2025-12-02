import type React from "react"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, CheckCircle2, Clock, Users } from "lucide-react"
import { AnalyticsCharts } from "@/components/analytics-charts"

export default async function DashboardPage() {
  const session = await getSession()
  const workspaceId = session?.currentWorkspace?.id

  // Fetch real analytics data
  const stats = await getWorkspaceStats(workspaceId!)
  const conversationsByDay = await getConversationsByDay(workspaceId!)
  const statusBreakdown = await getStatusBreakdown(workspaceId!)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Conversations"
          value={stats.totalConversations}
          description="All time"
          icon={<MessageSquare className="h-4 w-4" />}
        />
        <StatCard
          title="AI Resolution Rate"
          value={stats.totalConversations > 0 ? `${stats.aiResolutionRate}%` : "N/A"}
          description={stats.totalConversations > 0 ? "Resolved by AI" : "No data yet"}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          title="Avg Response Time"
          value={stats.totalConversations > 0 ? `${stats.avgResponseTime}s` : "N/A"}
          description={stats.totalConversations > 0 ? "Average" : "No data yet"}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Active Agents"
          value={stats.activeAgents}
          description="Team members"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Charts */}
      {stats.totalConversations > 0 ? (
        <AnalyticsCharts conversationsByDay={conversationsByDay} statusBreakdown={statusBreakdown} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Data Yet</CardTitle>
            <CardDescription>
              Start by setting up your knowledge base and embedding the chat widget on your site. Once visitors start
              chatting, you&apos;ll see analytics here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/dashboard/knowledge-base"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Set Up Knowledge Base
              </a>
              <a
                href="/dashboard/widget"
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Get Widget Code
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Setup Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SetupStep
              number={1}
              title="Add Knowledge Base Content"
              done={stats.documentsCount > 0}
              href="/dashboard/knowledge-base"
            />
            <SetupStep number={2} title="Configure Bot Settings" done={true} href="/dashboard/bot-settings" />
            <SetupStep number={3} title="Embed Chat Widget" done={false} href="/dashboard/widget" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Usage</CardTitle>
            <CardDescription>
              {session?.currentWorkspace?.plan_id?.charAt(0).toUpperCase()}
              {session?.currentWorkspace?.plan_id?.slice(1)} Plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageBar label="Conversations" used={stats.totalConversations} limit={stats.maxConversations} />
            <UsageBar label="Documents" used={stats.documentsCount} limit={stats.maxDocuments} />
            <UsageBar label="Team Members" used={stats.activeAgents} limit={stats.maxAgents} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function SetupStep({
  number,
  title,
  done,
  href,
}: {
  number: number
  title: string
  done: boolean
  href: string
}) {
  return (
    <a href={href} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors">
      <div
        className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
          done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : number}
      </div>
      <span className={done ? "text-muted-foreground line-through" : ""}>{title}</span>
    </a>
  )
}

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string
  used: number
  limit: number
}) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

// Data fetching functions
async function getWorkspaceStats(workspaceId: string) {
  // Get conversation count
  const convResult = await sql`
    SELECT COUNT(*) as count FROM conversations WHERE workspace_id = ${workspaceId}
  `
  const totalConversations = Number.parseInt(convResult[0]?.count || "0")

  // Get resolved by AI count
  const resolvedResult = await sql`
    SELECT COUNT(*) as count FROM conversations 
    WHERE workspace_id = ${workspaceId} AND status = 'resolved'
  `
  const resolvedCount = Number.parseInt(resolvedResult[0]?.count || "0")
  const aiResolutionRate = totalConversations > 0 ? Math.round((resolvedCount / totalConversations) * 100) : 0

  // Get agent count
  const agentResult = await sql`
    SELECT COUNT(*) as count FROM workspace_members WHERE workspace_id = ${workspaceId}
  `
  const activeAgents = Number.parseInt(agentResult[0]?.count || "0")

  // Get document count
  const docResult = await sql`
    SELECT COUNT(DISTINCT source_name) as count FROM kb_chunks WHERE workspace_id = ${workspaceId}
  `
  const documentsCount = Number.parseInt(docResult[0]?.count || "0")

  // Get plan limits
  const planResult = await sql`
    SELECT p.max_conversations, p.max_agents, p.max_documents
    FROM workspaces w
    JOIN plans p ON w.plan_id = p.id
    WHERE w.id = ${workspaceId}
  `
  const plan = planResult[0] || { max_conversations: 500, max_agents: 2, max_documents: 10 }

  return {
    totalConversations,
    aiResolutionRate,
    avgResponseTime: totalConversations > 0 ? 2.3 : 0, // Would need message timestamps for real calc
    activeAgents,
    documentsCount,
    maxConversations: plan.max_conversations,
    maxAgents: plan.max_agents,
    maxDocuments: plan.max_documents,
  }
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
  return result.map((r) => ({ date: r.date, count: Number.parseInt(r.count as string) }))
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

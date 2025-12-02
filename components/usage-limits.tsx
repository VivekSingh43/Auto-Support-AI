"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, FileText, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface UsageLimitsProps {
  usage: {
    conversations: number
    agents: number
    documents: number
  }
  limits: {
    maxConversations: number
    maxAgents: number
    maxDocuments: number
  }
  planName: string
}

export function UsageLimits({ usage, limits, planName }: UsageLimitsProps) {
  const conversationPercent = (usage.conversations / limits.maxConversations) * 100
  const agentPercent = (usage.agents / limits.maxAgents) * 100
  const documentPercent = (usage.documents / limits.maxDocuments) * 100

  const isNearLimit = conversationPercent >= 80 || agentPercent >= 80 || documentPercent >= 80
  const isAtLimit = conversationPercent >= 100 || agentPercent >= 100 || documentPercent >= 100

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Usage & Limits</CardTitle>
            <CardDescription>
              Current plan: <span className="font-medium">{planName}</span>
            </CardDescription>
          </div>
          {(isNearLimit || isAtLimit) && (
            <Button asChild size="sm">
              <Link href="/pricing">Upgrade Plan</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAtLimit && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-medium">You've reached your plan limits</p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span>Conversations this month</span>
            </div>
            <span className="font-medium">
              {usage.conversations.toLocaleString()} / {limits.maxConversations.toLocaleString()}
            </span>
          </div>
          <Progress
            value={Math.min(conversationPercent, 100)}
            className={
              conversationPercent >= 100
                ? "[&>div]:bg-destructive"
                : conversationPercent >= 80
                  ? "[&>div]:bg-yellow-500"
                  : ""
            }
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Team members</span>
            </div>
            <span className="font-medium">
              {usage.agents} / {limits.maxAgents}
            </span>
          </div>
          <Progress
            value={Math.min(agentPercent, 100)}
            className={
              agentPercent >= 100 ? "[&>div]:bg-destructive" : agentPercent >= 80 ? "[&>div]:bg-yellow-500" : ""
            }
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Knowledge base documents</span>
            </div>
            <span className="font-medium">
              {usage.documents} / {limits.maxDocuments}
            </span>
          </div>
          <Progress
            value={Math.min(documentPercent, 100)}
            className={
              documentPercent >= 100 ? "[&>div]:bg-destructive" : documentPercent >= 80 ? "[&>div]:bg-yellow-500" : ""
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}

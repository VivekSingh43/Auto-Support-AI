"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Bar, BarChart, Cell, Pie, PieChart } from "recharts"

interface ConversationsByDay {
  date: string
  count: number
}

interface StatusBreakdown {
  status: string
  count: number
}

const STATUS_COLORS: Record<string, string> = {
  active: "#3b82f6",
  resolved: "#22c55e",
  needs_human: "#f59e0b",
}

export function AnalyticsCharts({
  conversationsByDay,
  statusBreakdown,
}: {
  conversationsByDay: ConversationsByDay[]
  statusBreakdown: StatusBreakdown[]
}) {
  // Fill in missing days with 0
  const filledData = fillMissingDays(conversationsByDay)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Conversations Over Time</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: { label: "Conversations", color: "hsl(var(--chart-1))" },
            }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filledData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
          <CardDescription>Current conversation states</CardDescription>
        </CardHeader>
        <CardContent>
          {statusBreakdown.length > 0 ? (
            <ChartContainer
              config={{
                count: { label: "Count" },
              }}
              className="h-[200px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBreakdown} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="status"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.replace("_", " ")}
                    width={80}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={4}>
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || "#8884d8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-sm">No conversation data available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resolution Distribution</CardTitle>
          <CardDescription>How conversations are resolved</CardDescription>
        </CardHeader>
        <CardContent>
          {statusBreakdown.length > 0 ? (
            <ChartContainer
              config={{
                count: { label: "Count" },
              }}
              className="h-[200px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ status, percent }) => `${status.replace("_", " ")} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || "#8884d8"} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-sm">No conversation data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function fillMissingDays(data: ConversationsByDay[]): ConversationsByDay[] {
  if (data.length === 0) {
    // Return last 7 days with 0 counts
    const result: ConversationsByDay[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      result.push({ date: date.toISOString().split("T")[0], count: 0 })
    }
    return result
  }

  const dataMap = new Map(data.map((d) => [d.date, d.count]))
  const result: ConversationsByDay[] = []
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 29)

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]
    result.push({ date: dateStr, count: dataMap.get(dateStr) || 0 })
  }

  return result
}

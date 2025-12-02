"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"

export function AgentReplyForm({
  conversationId,
  ticketId,
}: {
  conversationId: string
  ticketId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/tickets/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          ticketId,
          message: message.trim(),
        }),
      })

      if (!response.ok) throw new Error("Failed to send")

      toast.success("Reply sent!")
      setMessage("")
      router.refresh()
    } catch {
      toast.error("Failed to send reply")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reply as Agent</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your reply to the customer..."
            rows={4}
            disabled={loading}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !message.trim()}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Reply
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

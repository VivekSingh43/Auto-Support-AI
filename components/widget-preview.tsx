"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react"

export function WidgetPreview({
  workspaceKey,
  botName,
  greeting,
  primaryColor,
}: {
  workspaceKey: string
  botName: string
  greeting: string
  primaryColor: string
}) {
  const [open, setOpen] = useState(true)
  const [messages, setMessages] = useState([{ role: "assistant", content: greeting }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceKey,
          message: userMessage,
          visitorId: "preview-" + Date.now(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }])
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error || "Sorry, something went wrong." }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't connect to the server." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative h-[500px] bg-muted/50 rounded-lg overflow-hidden border">
      {/* Mock website background */}
      <div className="p-4 text-muted-foreground text-sm">
        <p>Your website content goes here...</p>
      </div>

      {/* Widget button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="absolute bottom-4 right-4 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="absolute bottom-4 right-4 w-80 bg-background rounded-lg shadow-2xl border overflow-hidden">
          {/* Header */}
          <div className="p-4 flex items-center justify-between text-white" style={{ backgroundColor: primaryColor }}>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-medium">{botName}</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-white/20 rounded p-1 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user" ? "bg-muted" : ""
                  }`}
                  style={msg.role === "assistant" ? { backgroundColor: primaryColor + "20" } : {}}
                >
                  {msg.role === "user" ? (
                    <User className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Bot className="h-3 w-3" style={{ color: primaryColor }} />
                  )}
                </div>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: primaryColor + "20" }}
                >
                  <Bot className="h-3 w-3" style={{ color: primaryColor }} />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                disabled={loading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={loading || !input.trim()}
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

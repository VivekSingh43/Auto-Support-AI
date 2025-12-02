"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"

export function AddFAQForm({
  workspaceId,
  disabled,
}: {
  workspaceId: string
  disabled: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || !answer.trim()) {
      toast.error("Question and answer are required")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/knowledge-base/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, question, answer }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add FAQ")
      }

      toast.success("FAQ added successfully!")
      setQuestion("")
      setAnswer("")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add FAQ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">Question</Label>
        <Input
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What are your business hours?"
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="answer">Answer</Label>
        <Textarea
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="e.g., We're open Monday to Friday, 9 AM to 5 PM EST."
          rows={4}
          disabled={disabled}
        />
      </div>
      <Button type="submit" disabled={loading || disabled}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
        Add FAQ
      </Button>
      {disabled && <p className="text-sm text-destructive">Document limit reached. Upgrade your plan to add more.</p>}
    </form>
  )
}

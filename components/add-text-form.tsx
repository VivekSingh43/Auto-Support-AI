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

export function AddTextForm({
  workspaceId,
  disabled,
}: {
  workspaceId: string
  disabled: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/knowledge-base/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, title, content }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add text")
      }

      toast.success("Text content added successfully!")
      setTitle("")
      setContent("")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add text")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Return Policy"
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your documentation, policies, or any text content here. Markdown is supported."
          rows={10}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          The text will be automatically split into chunks for better AI retrieval.
        </p>
      </div>
      <Button type="submit" disabled={loading || disabled}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
        Add Text
      </Button>
      {disabled && <p className="text-sm text-destructive">Document limit reached. Upgrade your plan to add more.</p>}
    </form>
  )
}

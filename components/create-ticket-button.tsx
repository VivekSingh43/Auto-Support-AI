"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Ticket } from "lucide-react"

export function CreateTicketButton({
  conversationId,
  workspaceId,
}: {
  conversationId: string
  workspaceId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, workspaceId }),
      })

      if (!response.ok) throw new Error("Failed to create ticket")

      toast.success("Ticket created!")
      router.push("/dashboard/inbox")
    } catch {
      toast.error("Failed to create ticket")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleCreate} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ticket className="mr-2 h-4 w-4" />}
      Create Ticket
    </Button>
  )
}

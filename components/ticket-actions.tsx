"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { MoreHorizontal, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react"

export function TicketActions({
  ticketId,
  currentStatus,
  currentPriority,
}: {
  ticketId: string
  currentStatus: string
  currentPriority: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateTicket(updates: { status?: string; priority?: string }) {
    setLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update")

      toast.success("Ticket updated!")
      router.refresh()
    } catch {
      toast.error("Failed to update ticket")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {currentStatus !== "resolved" && (
        <Button
          onClick={() => updateTicket({ status: "resolved" })}
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Mark Resolved
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => updateTicket({ status: "open" })} disabled={currentStatus === "open"}>
            <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
            Open
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateTicket({ status: "pending" })} disabled={currentStatus === "pending"}>
            <Clock className="mr-2 h-4 w-4 text-amber-500" />
            Pending
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => updateTicket({ status: "resolved" })}
            disabled={currentStatus === "resolved"}
          >
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Resolved
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Change Priority</DropdownMenuLabel>
          {["low", "normal", "high", "urgent"].map((p) => (
            <DropdownMenuItem
              key={p}
              onClick={() => updateTicket({ priority: p })}
              disabled={currentPriority === p}
              className="capitalize"
            >
              {p}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

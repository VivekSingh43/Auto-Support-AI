"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { FileText, MessageSquare, FileType, Trash2, Loader2 } from "lucide-react"

interface KBSource {
  source_type: string
  source_name: string
  chunk_count: string
  created_at: string
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileType className="h-4 w-4" />,
  faq: <MessageSquare className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  url: <FileText className="h-4 w-4" />,
}

const SOURCE_COLORS: Record<string, string> = {
  pdf: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  faq: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  text: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  url: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

export function KBSourcesList({
  sources,
  workspaceId,
}: {
  sources: KBSource[]
  workspaceId: string
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(sourceName: string, sourceType: string) {
    setDeleting(sourceName)
    try {
      const response = await fetch("/api/knowledge-base/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, sourceName, sourceType }),
      })

      if (!response.ok) throw new Error("Failed to delete")

      toast.success("Source deleted successfully")
      router.refresh()
    } catch {
      toast.error("Failed to delete source")
    } finally {
      setDeleting(null)
    }
  }

  if (sources.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No content yet</h3>
        <p className="text-muted-foreground mb-4">Add FAQs, paste text, or upload PDFs to train your AI bot.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sources.map((source) => (
        <div
          key={`${source.source_type}-${source.source_name}`}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-muted-foreground">{SOURCE_ICONS[source.source_type]}</div>
            <div className="min-w-0">
              <p className="font-medium truncate">{source.source_name}</p>
              <p className="text-xs text-muted-foreground">
                {source.chunk_count} chunks · Added {new Date(source.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={SOURCE_COLORS[source.source_type]} variant="secondary">
              {source.source_type.toUpperCase()}
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  {deleting === source.source_name ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this source?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{source.source_name}&quot; and all its chunks from your knowledge
                    base.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(source.source_name, source.source_type)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  )
}

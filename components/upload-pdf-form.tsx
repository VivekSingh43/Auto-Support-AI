"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Upload, FileText, X } from "lucide-react"

export function UploadPDFForm({
  workspaceId,
  disabled,
}: {
  workspaceId: string
  disabled: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(file: File | null) {
    if (!file) return

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported")
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must be less than 20MB")
      return
    }

    setSelectedFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  async function handleUpload() {
    if (!selectedFile) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("workspaceId", workspaceId)

      const response = await fetch("/api/knowledge-base/pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to upload PDF")
      }

      toast.success("PDF uploaded and processed successfully!")
      setSelectedFile(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload PDF")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          disabled={disabled}
        />

        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div className="text-left">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFile(null)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-1">Drop a PDF here or click to browse</p>
            <p className="text-sm text-muted-foreground">Maximum file size: 20MB</p>
          </>
        )}
      </div>

      {selectedFile && (
        <Button onClick={handleUpload} disabled={loading || disabled} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing PDF...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Process
            </>
          )}
        </Button>
      )}

      {disabled && (
        <p className="text-sm text-destructive text-center">Document limit reached. Upgrade your plan to add more.</p>
      )}
    </div>
  )
}

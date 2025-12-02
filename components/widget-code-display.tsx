"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Copy, Check } from "lucide-react"

export function WidgetCodeDisplay({
  workspaceKey,
  primaryColor,
}: {
  workspaceKey: string
  primaryColor: string
}) {
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

  const embedCode = `<!-- AutoSupport Chat Widget -->
<script>
  (function() {
    var w = window;
    var d = document;
    w.AutoSupportConfig = {
      workspaceKey: "${workspaceKey}",
      primaryColor: "${primaryColor}"
    };
    var s = d.createElement("script");
    s.src = "${baseUrl}/widget.js";
    s.async = true;
    d.head.appendChild(s);
  })();
</script>`

  function handleCopy() {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    toast.success("Code copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
          <code>{embedCode}</code>
        </pre>
        <Button size="sm" variant="secondary" className="absolute top-2 right-2" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        The widget will appear as a floating button in the bottom-right corner of your website.
      </p>
    </div>
  )
}

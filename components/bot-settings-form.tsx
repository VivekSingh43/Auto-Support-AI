"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Loader2, Bot } from "lucide-react"
import type { BotSettings } from "@/lib/types"

export function BotSettingsForm({
  botSettings,
  workspaceId,
}: {
  botSettings: BotSettings
  workspaceId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [botName, setBotName] = useState(botSettings.bot_name)
  const [greeting, setGreeting] = useState(botSettings.greeting_message)
  const [tone, setTone] = useState(botSettings.tone)
  const [primaryColor, setPrimaryColor] = useState(botSettings.primary_color)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/bot-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          botName,
          greetingMessage: greeting,
          tone,
          primaryColor,
        }),
      })

      if (!response.ok) throw new Error("Failed to update")

      toast.success("Bot settings updated!")
      router.refresh()
    } catch {
      toast.error("Failed to update settings")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Bot Identity
          </CardTitle>
          <CardDescription>Set how your bot introduces itself to customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="botName">Bot Name</Label>
            <Input
              id="botName"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder="e.g., Aria, Support Bot, Helper"
            />
            <p className="text-xs text-muted-foreground">This name will be shown in the chat widget</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="greeting">Greeting Message</Label>
            <Textarea
              id="greeting"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="Hello! How can I help you today?"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">The first message visitors see when opening the chat</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response Tone</CardTitle>
          <CardDescription>Choose how your bot communicates with customers</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="formal" id="formal" className="mt-1" />
              <div>
                <Label htmlFor="formal" className="font-medium cursor-pointer">
                  Formal
                </Label>
                <p className="text-sm text-muted-foreground">
                  Professional and business-like. Best for B2B or enterprise support.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="friendly" id="friendly" className="mt-1" />
              <div>
                <Label htmlFor="friendly" className="font-medium cursor-pointer">
                  Friendly
                </Label>
                <p className="text-sm text-muted-foreground">
                  Warm and approachable while remaining professional. Works for most cases.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="casual" id="casual" className="mt-1" />
              <div>
                <Label htmlFor="casual" className="font-medium cursor-pointer">
                  Casual
                </Label>
                <p className="text-sm text-muted-foreground">
                  Relaxed and conversational. Great for consumer products and younger audiences.
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Widget Appearance</CardTitle>
          <CardDescription>Customize how the chat widget looks on your website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="primaryColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-20 rounded cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-32"
                placeholder="#0066FF"
              />
            </div>
            <p className="text-xs text-muted-foreground">Used for the widget button and accent colors</p>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Settings
      </Button>
    </form>
  )
}

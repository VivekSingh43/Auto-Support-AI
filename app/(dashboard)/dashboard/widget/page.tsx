import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WidgetCodeDisplay } from "@/components/widget-code-display"
import { WidgetPreview } from "@/components/widget-preview"

export default async function WidgetPage() {
  const session = await getSession()
  const workspace = session?.currentWorkspace!

  // Get bot settings
  const botSettings = await sql`
    SELECT * FROM bot_settings WHERE workspace_id = ${workspace.id}
  `
  const settings = botSettings[0] || {
    bot_name: "Support Bot",
    greeting_message: "Hello! How can I help you today?",
    primary_color: "#0066FF",
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Chat Widget</h2>
        <p className="text-muted-foreground">Embed the chat widget on your website to enable AI-powered support.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Embed Code</CardTitle>
            <CardDescription>
              Copy this code and paste it into your website&apos;s HTML, just before the closing {`</body>`} tag.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WidgetCodeDisplay workspaceKey={workspace.public_key} primaryColor={settings.primary_color as string} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>See how the widget will look on your website</CardDescription>
          </CardHeader>
          <CardContent>
            <WidgetPreview
              workspaceKey={workspace.public_key}
              botName={settings.bot_name as string}
              greeting={settings.greeting_message as string}
              primaryColor={settings.primary_color as string}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integration Options</CardTitle>
          <CardDescription>Additional ways to integrate the chat widget</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">API Endpoint</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Send messages directly to our API if you want to build a custom chat interface:
            </p>
            <code className="block bg-muted p-3 rounded-md text-sm">
              POST /api/chat
              <br />
              {`{ "workspaceKey": "${workspace.public_key}", "message": "...", "visitorId": "..." }`}
            </code>
          </div>

          <div>
            <h4 className="font-medium mb-2">Workspace Public Key</h4>
            <p className="text-sm text-muted-foreground mb-2">Use this key to identify your workspace in API calls:</p>
            <code className="block bg-muted p-3 rounded-md text-sm font-mono break-all">{workspace.public_key}</code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

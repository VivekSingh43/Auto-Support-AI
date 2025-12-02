import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { BotSettingsForm } from "@/components/bot-settings-form"
import type { BotSettings } from "@/lib/types"

export default async function BotSettingsPage() {
  const session = await getSession()
  const workspaceId = session?.currentWorkspace?.id!

  // Get bot settings
  const result = await sql`
    SELECT * FROM bot_settings WHERE workspace_id = ${workspaceId}
  `

  let botSettings = result[0] as BotSettings | undefined

  // Create default settings if not exists
  if (!botSettings) {
    const created = await sql`
      INSERT INTO bot_settings (workspace_id, bot_name, greeting_message, tone)
      VALUES (${workspaceId}, 'Support Bot', 'Hello! How can I help you today?', 'friendly')
      RETURNING *
    `
    botSettings = created[0] as BotSettings
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Bot Settings</h2>
        <p className="text-muted-foreground">Configure how your AI support bot behaves and interacts with customers.</p>
      </div>

      <BotSettingsForm botSettings={botSettings} workspaceId={workspaceId} />
    </div>
  )
}

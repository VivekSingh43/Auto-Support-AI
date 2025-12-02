import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { WorkspaceSettingsForm } from "@/components/workspace-settings-form"
import type { BotSettings } from "@/lib/types"

export default async function SettingsPage() {
  const session = await getSession()
  const workspace = session?.currentWorkspace!

  // Get bot settings
  const botSettings = await sql`
    SELECT * FROM bot_settings WHERE workspace_id = ${workspace.id}
  `

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Workspace Settings</h2>
        <p className="text-muted-foreground">Manage your workspace configuration and preferences.</p>
      </div>

      <WorkspaceSettingsForm workspace={workspace} botSettings={botSettings[0] as BotSettings} />
    </div>
  )
}

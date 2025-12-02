import type React from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (!session.currentWorkspace) {
    redirect("/onboarding")
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <DashboardSidebar session={session} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader session={session} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

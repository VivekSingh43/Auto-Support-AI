"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Session } from "@/lib/types"
import { LayoutDashboard, MessageSquare, FileText, Bot, Inbox, Settings, Code, BarChart3 } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/knowledge-base", label: "Knowledge Base", icon: FileText },
  { href: "/dashboard/bot-settings", label: "Bot Settings", icon: Bot },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/dashboard/inbox", label: "Inbox", icon: Inbox },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/widget", label: "Widget Code", icon: Code },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function DashboardSidebar({ session }: { session: Session }) {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-sidebar shrink-0 hidden lg:block">
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <span className="font-bold">AutoSupport</span>
        </Link>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="absolute bottom-4 left-4 right-4 p-3 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground">Current workspace</p>
        <p className="font-medium text-sm truncate">{session.currentWorkspace?.name}</p>
        <p className="text-xs text-muted-foreground capitalize">{session.currentWorkspace?.plan_id} plan</p>
      </div>
    </aside>
  )
}

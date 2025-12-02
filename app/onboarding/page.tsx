import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"

export default async function OnboardingPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.currentWorkspace) {
    redirect("/dashboard")
  }

  // This page would show workspace creation if user has no workspace
  // For now, redirect to signup which creates both user and workspace
  redirect("/signup")
}

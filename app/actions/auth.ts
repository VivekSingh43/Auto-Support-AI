"use server"

import { sql } from "@/lib/db"
import {
  hashPassword,
  verifyPassword,
  createToken,
  setAuthCookie,
  setWorkspaceCookie,
  clearAuthCookies,
} from "@/lib/auth"
import { redirect } from "next/navigation"
import type { ApiResponse, User, Workspace } from "@/lib/types"

export async function signUp(formData: FormData): Promise<ApiResponse<User>> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string
  const country = (formData.get("country") as string) || "US"
  const workspaceName = formData.get("workspaceName") as string

  if (!email || !password || !name || !workspaceName) {
    return { success: false, error: "All fields are required" }
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" }
  }

  try {
    // Check if user exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existing.length > 0) {
      return { success: false, error: "Email already registered" }
    }

    const passwordHash = await hashPassword(password)

    // Create user
    const users = await sql`
      INSERT INTO users (email, password_hash, name, country)
      VALUES (${email}, ${passwordHash}, ${name}, ${country})
      RETURNING id, email, name, country, created_at, updated_at
    `
    const user = users[0] as User

    // Create workspace
    const workspaces = await sql`
      INSERT INTO workspaces (name, plan_id, subscription_status)
      VALUES (${workspaceName}, 'basic', 'inactive')
      RETURNING *
    `
    const workspace = workspaces[0] as Workspace

    // Add user as owner
    await sql`
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES (${workspace.id}, ${user.id}, 'owner')
    `

    // Create default bot settings
    await sql`
      INSERT INTO bot_settings (workspace_id, bot_name, greeting_message, tone)
      VALUES (${workspace.id}, ${workspaceName + " Support"}, 'Hello! How can I help you today?', 'friendly')
    `

    // Set auth cookies
    const token = await createToken(user.id)
    await setAuthCookie(token)
    await setWorkspaceCookie(workspace.id)

    return { success: true, data: user }
  } catch (error) {
    console.error("Sign up error:", error)
    return { success: false, error: "Failed to create account" }
  }
}

export async function signIn(formData: FormData): Promise<ApiResponse<User>> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, error: "Email and password are required" }
  }

  try {
    const users = await sql`
      SELECT id, email, password_hash, name, country, created_at, updated_at
      FROM users WHERE email = ${email}
    `

    if (users.length === 0) {
      return { success: false, error: "Invalid email or password" }
    }

    const user = users[0] as User & { password_hash: string }
    const valid = await verifyPassword(password, user.password_hash)

    if (!valid) {
      return { success: false, error: "Invalid email or password" }
    }

    // Get first workspace
    const workspaces = await sql`
      SELECT w.id FROM workspaces w
      JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE wm.user_id = ${user.id}
      LIMIT 1
    `

    const token = await createToken(user.id)
    await setAuthCookie(token)

    if (workspaces.length > 0) {
      await setWorkspaceCookie(workspaces[0].id as string)
    }

    const { password_hash: _, ...safeUser } = user
    return { success: true, data: safeUser as User }
  } catch (error) {
    console.error("Sign in error:", error)
    return { success: false, error: "Failed to sign in" }
  }
}

export async function signOut() {
  await clearAuthCookies()
  redirect("/")
}

export async function switchWorkspace(workspaceId: string) {
  await setWorkspaceCookie(workspaceId)
  redirect("/dashboard")
}

import { cookies } from "next/headers"
import { sql } from "./db"
import type { User, Workspace, WorkspaceMember, Session } from "./types"
import * as bcrypt from "bcryptjs"
import * as jose from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "autosupport-secret-key-change-in-production")

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(userId: string, workspaceId?: string): Promise<string> {
  const payload: any = { userId }
  if (workspaceId) {
    payload.workspaceId = workspaceId
  }
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

export interface TokenPayload {
  userId: string
  workspaceId?: string
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    const userId = payload.userId as string

    // If workspaceId is in token, return it
    if (payload.workspaceId) {
      return {
        userId,
        workspaceId: payload.workspaceId as string,
      }
    }

    // Otherwise fetch the user's first workspace
    const workspaces = await sql`
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = ${userId} 
      ORDER BY created_at ASC 
      LIMIT 1
    `

    return {
      userId,
      workspaceId: workspaces[0]?.workspace_id || undefined,
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  // Get user
  const users = await sql`
    SELECT id, email, name, country, created_at, updated_at
    FROM users WHERE id = ${payload.userId}
  `
  if (users.length === 0) return null

  const user = users[0] as User

  // Get workspaces with roles
  const workspaces = await sql`
    SELECT w.*, wm.role
    FROM workspaces w
    JOIN workspace_members wm ON w.id = wm.workspace_id
    WHERE wm.user_id = ${user.id}
    ORDER BY w.created_at DESC
  `

  const typedWorkspaces = workspaces as Array<Workspace & { role: WorkspaceMember["role"] }>

  // Get current workspace from cookie or use first
  const currentWorkspaceId = cookieStore.get("current_workspace")?.value
  const currentWorkspace = typedWorkspaces.find((w) => w.id === currentWorkspaceId) || typedWorkspaces[0] || null

  return {
    user,
    workspaces: typedWorkspaces,
    currentWorkspace,
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function setWorkspaceCookie(workspaceId: string) {
  const cookieStore = await cookies()
  cookieStore.set("current_workspace", workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  })
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete("auth_token")
  cookieStore.delete("current_workspace")
}

export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("auth_token")?.value || null
}

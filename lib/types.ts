// Core types for AutoSupport

export interface Plan {
  id: string
  name: string
  price_inr: number
  price_usd: number
  max_conversations: number
  max_agents: number
  max_documents: number
  features: string[]
  created_at: string
}

export interface User {
  id: string
  email: string
  name: string | null
  country: string
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  logo_url: string | null
  timezone: string
  default_language: string
  public_key: string
  plan_id: string
  subscription_status: "active" | "inactive" | "past_due" | "canceled"
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: "owner" | "agent"
  created_at: string
}

export interface BotSettings {
  id: string
  workspace_id: string
  bot_name: string
  greeting_message: string
  tone: "formal" | "friendly" | "casual"
  primary_color: string
  created_at: string
  updated_at: string
}

export interface KBChunk {
  id: string
  workspace_id: string
  source_type: "pdf" | "faq" | "text" | "url"
  source_name: string
  content: string
  embedding?: number[]
  metadata: Record<string, unknown>
  created_at: string
}

export interface Conversation {
  id: string
  workspace_id: string
  visitor_id: string
  visitor_email: string | null
  status: "active" | "resolved" | "needs_human"
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: "user" | "assistant" | "agent"
  content: string
  sources: Array<{ content: string; source_name: string }>
  confidence: number | null
  created_at: string
}

export interface Ticket {
  id: string
  workspace_id: string
  conversation_id: string
  assigned_agent_id: string | null
  status: "open" | "pending" | "resolved"
  priority: "low" | "normal" | "high" | "urgent"
  created_at: string
  updated_at: string
}

// Session / Auth types
export interface Session {
  user: User
  workspaces: Array<Workspace & { role: WorkspaceMember["role"] }>
  currentWorkspace: (Workspace & { role: WorkspaceMember["role"] }) | null
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Checkout types
export interface CheckoutRequest {
  planId: string
  country: string
  workspaceId?: string
}

export interface StripeCheckoutResponse {
  type: "stripe"
  url: string
}

export interface RazorpayCheckoutResponse {
  type: "razorpay"
  keyId: string
  orderId: string
  amount: number
  currency: string
}

export type CheckoutResponse = StripeCheckoutResponse | RazorpayCheckoutResponse

// Analytics types
export interface AnalyticsData {
  totalConversations: number
  aiResolutionRate: number
  avgResponseTime: number
  activeAgents: number
  conversationsByDay: Array<{ date: string; count: number }>
  statusBreakdown: Array<{ status: string; count: number }>
}

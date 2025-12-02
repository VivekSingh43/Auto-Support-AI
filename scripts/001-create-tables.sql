-- AutoSupport Database Schema
-- Run this script to create all necessary tables

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Plans table (pricing tiers)
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_inr INTEGER NOT NULL,
  price_usd INTEGER NOT NULL,
  max_conversations INTEGER NOT NULL,
  max_agents INTEGER NOT NULL,
  max_documents INTEGER NOT NULL,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO plans (id, name, price_inr, price_usd, max_conversations, max_agents, max_documents, features) VALUES
  ('basic', 'Basic', 299, 6, 500, 2, 10, '["AI Chatbot", "Basic Analytics", "Email Support"]'),
  ('standard', 'Standard', 799, 15, 2000, 5, 50, '["AI Chatbot", "Advanced Analytics", "Priority Support", "Custom Branding"]'),
  ('advanced', 'Advanced', 1499, 29, 10000, 20, 200, '["AI Chatbot", "Full Analytics", "24/7 Support", "Custom Branding", "API Access", "Human Handoff"]')
ON CONFLICT (id) DO NOTHING;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  country TEXT DEFAULT 'US',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  logo_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  default_language TEXT DEFAULT 'en',
  public_key TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  plan_id TEXT REFERENCES plans(id) DEFAULT 'basic',
  subscription_status TEXT DEFAULT 'inactive',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace members table
CREATE TABLE IF NOT EXISTS workspace_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('owner', 'agent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Bot settings table
CREATE TABLE IF NOT EXISTS bot_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  bot_name TEXT DEFAULT 'Support Bot',
  greeting_message TEXT DEFAULT 'Hello! How can I help you today?',
  tone TEXT DEFAULT 'friendly' CHECK (tone IN ('formal', 'friendly', 'casual')),
  primary_color TEXT DEFAULT '#0066FF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base chunks table (for RAG)
CREATE TABLE IF NOT EXISTS kb_chunks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('pdf', 'faq', 'text', 'url')),
  source_name TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS kb_chunks_embedding_idx ON kb_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  visitor_email TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'needs_human')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'agent')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  confidence REAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table (for human handoff)
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  assigned_agent_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kb_chunks_workspace ON kb_chunks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversations_workspace ON conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversations_visitor ON conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tickets_workspace ON tickets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);

-- Create integrations table (whatsapp & instagram)
CREATE TABLE IF NOT EXISTSworkspace_integrations (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('whatsapp' & 'instagram')),
  phone_number TEXT,
  phone_number_id TEXT,
  business_id TEXT,
  page_id TEXT,
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_id TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS workspace_integrations_workspace_type_idx ON workspace_integrations (workspace_id, type);
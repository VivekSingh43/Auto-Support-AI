-- Enable pgvector extension for vector similarity search
-- This must be run before the main schema migration
CREATE EXTENSION IF NOT EXISTS vector;

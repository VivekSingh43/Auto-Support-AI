import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)

// Type definitions for database operations
export type SqlResult<T> = T[]

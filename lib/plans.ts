import { sql } from "./db"
import type { Plan } from "./types"

export async function getPlans(): Promise<Plan[]> {
  const plans = await sql`
    SELECT * FROM plans ORDER BY price_usd ASC
  `
  return plans.map((p) => ({
    ...p,
    features: typeof p.features === "string" ? JSON.parse(p.features) : p.features,
  })) as Plan[]
}

export async function getPlanById(id: string): Promise<Plan | null> {
  const plans = await sql`
    SELECT * FROM plans WHERE id = ${id}
  `
  if (plans.length === 0) return null
  const p = plans[0]
  return {
    ...p,
    features: typeof p.features === "string" ? JSON.parse(p.features) : p.features,
  } as Plan
}

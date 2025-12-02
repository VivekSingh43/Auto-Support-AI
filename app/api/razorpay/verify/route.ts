import { NextResponse } from "next/server"
import crypto from "crypto"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json()

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 })
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Payment verified - update workspace subscription
    const session = await getSession()
    if (session?.currentWorkspace) {
      await sql`
        UPDATE workspaces 
        SET subscription_status = 'active',
            updated_at = NOW()
        WHERE id = ${session.currentWorkspace.id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Razorpay verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}

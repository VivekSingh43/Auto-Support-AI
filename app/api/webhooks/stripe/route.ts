import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { sql } from "@/lib/db"
import type Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const { planId, workspaceId } = session.metadata || {}

        if (workspaceId && planId) {
          await sql`
            UPDATE workspaces 
            SET plan_id = ${planId},
                subscription_status = 'active',
                stripe_subscription_id = ${session.subscription as string},
                updated_at = NOW()
            WHERE id = ${workspaceId}
          `
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await sql`
          UPDATE workspaces 
          SET subscription_status = ${subscription.status},
              current_period_end = ${new Date(subscription.current_period_end * 1000).toISOString()},
              updated_at = NOW()
          WHERE stripe_customer_id = ${customerId}
        `
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await sql`
          UPDATE workspaces 
          SET subscription_status = 'canceled',
              updated_at = NOW()
          WHERE stripe_customer_id = ${customerId}
        `
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

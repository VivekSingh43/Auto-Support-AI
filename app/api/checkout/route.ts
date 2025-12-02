import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { getPlanById } from "@/lib/plans"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { planId, country } = await request.json()

    if (!planId || !country) {
      return NextResponse.json({ error: "Plan ID and country are required" }, { status: 400 })
    }

    const plan = await getPlanById(planId)
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    const session = await getSession()
    const isIndia = country === "IN"

    // For India, use Razorpay
    if (isIndia) {
      // Check if RAZORPAY credentials exist
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return NextResponse.json(
          {
            error: "Razorpay not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.",
          },
          { status: 500 },
        )
      }

      const Razorpay = (await import("razorpay")).default
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })

      const order = await razorpay.orders.create({
        amount: plan.price_inr * 100, // Razorpay expects paise
        currency: "INR",
        receipt: `order_${Date.now()}`,
        notes: {
          planId: plan.id,
          userId: session?.user?.id || "guest",
          workspaceId: session?.currentWorkspace?.id || "new",
        },
      })

      return NextResponse.json({
        type: "razorpay",
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      })
    }

    // For international, use Stripe
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    // Create or get Stripe customer
    let customerId: string | undefined

    if (session?.currentWorkspace?.stripe_customer_id) {
      customerId = session.currentWorkspace.stripe_customer_id
    } else if (session?.user) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          userId: session.user.id,
          workspaceId: session.currentWorkspace?.id || "",
        },
      })
      customerId = customer.id

      // Save customer ID to workspace if exists
      if (session.currentWorkspace) {
        await sql`
          UPDATE workspaces 
          SET stripe_customer_id = ${customerId}
          WHERE id = ${session.currentWorkspace.id}
        `
      }
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `AutoSupport ${plan.name} Plan`,
              description: `${plan.max_conversations} conversations/month, ${plan.max_agents} agents, ${plan.max_documents} documents`,
            },
            unit_amount: plan.price_usd * 100, // Stripe expects cents
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?checkout=success&plan=${planId}`,
      cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
      metadata: {
        planId: plan.id,
        userId: session?.user?.id || "",
        workspaceId: session?.currentWorkspace?.id || "",
      },
    })

    return NextResponse.json({
      type: "stripe",
      url: checkoutSession.url,
    })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}

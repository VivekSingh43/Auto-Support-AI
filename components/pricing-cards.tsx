"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Plan } from "@/lib/types"

const COUNTRIES = [
  { code: "IN", name: "India", currency: "INR", symbol: "₹" },
  { code: "US", name: "United States", currency: "USD", symbol: "$" },
  { code: "GB", name: "United Kingdom", currency: "USD", symbol: "$" },
  { code: "OTHER", name: "Other", currency: "USD", symbol: "$" },
]

export function PricingCards({ plans }: { plans: Plan[] }) {
  const [country, setCountry] = useState("US")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const router = useRouter()

  const selectedCountry = COUNTRIES.find((c) => c.code === country) || COUNTRIES[1]
  const isIndia = country === "IN"

  async function handleCheckout(planId: string) {
    setLoadingPlan(planId)

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, country }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed")
      }

      if (data.type === "stripe") {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else if (data.type === "razorpay") {
        // Open Razorpay popup
        await loadRazorpay(data)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed")
      setLoadingPlan(null)
    }
  }

  async function loadRazorpay(data: {
    keyId: string
    orderId: string
    amount: number
    currency: string
  }) {
    // Load Razorpay script
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "AutoSupport",
        description: "Subscription Payment",
        handler: (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          // Payment successful - verify on server
          verifyRazorpayPayment(response)
        },
        prefill: {
          email: "",
        },
        theme: {
          color: "#4f46e5",
        },
      }

      const rzp = new (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay(
        options,
      )
      rzp.open()
      setLoadingPlan(null)
    }
  }

  async function verifyRazorpayPayment(response: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }) {
    try {
      const res = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      })

      if (res.ok) {
        toast.success("Payment successful!")
        router.push("/dashboard")
      } else {
        toast.error("Payment verification failed")
      }
    } catch {
      toast.error("Payment verification failed")
    }
  }

  return (
    <div>
      {/* Country Selector */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-3 bg-muted p-2 rounded-lg">
          <span className="text-sm text-muted-foreground pl-2">Billing region:</span>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-48 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name} ({c.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan, index) => {
          const price = isIndia ? plan.price_inr : plan.price_usd
          const symbol = selectedCountry.symbol
          const isPopular = index === 1

          return (
            <Card key={plan.id} className={`relative ${isPopular ? "border-primary shadow-lg scale-105" : ""}`}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">
                    {symbol}
                    {price}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{plan.max_conversations.toLocaleString()} conversations/month</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>Up to {plan.max_agents} team members</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{plan.max_documents} documents (incl. PDFs)</span>
                  </li>
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={isPopular ? "default" : "outline"}
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

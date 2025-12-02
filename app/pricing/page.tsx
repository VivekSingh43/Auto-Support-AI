import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { getPlans } from "@/lib/plans"
import { PricingCards } from "@/components/pricing-cards"

export default async function PricingPage() {
  const plans = await getPlans()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">AutoSupport</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold">Simple, transparent pricing</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your business. All plans include AI chatbot, knowledge base, and analytics.
            </p>
          </div>

          <PricingCards plans={plans} />

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
            <div className="space-y-6">
              <FaqItem
                question="How does the conversation limit work?"
                answer="Each plan has a monthly conversation limit. A conversation is counted when a visitor starts a new chat session. Ongoing messages within the same session don't count as new conversations."
              />
              <FaqItem
                question="Can I upgrade or downgrade my plan?"
                answer="Yes! You can change your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the new rate applies at your next billing cycle."
              />
              <FaqItem
                question="What payment methods do you accept?"
                answer="We accept all major credit cards via Stripe for international customers, and Razorpay for customers in India (supporting UPI, cards, and netbanking)."
              />
              <FaqItem
                question="Is there a free trial?"
                answer="Yes! All plans come with a 14-day free trial. No credit card required to start."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="font-semibold">AutoSupport</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AutoSupport. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b pb-6">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-muted-foreground text-sm">{answer}</p>
    </div>
  )
}

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare, Bot, FileText, BarChart3, Users, Zap, ArrowRight } from "lucide-react"

export default function HomePage() {
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
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
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

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm mb-6">
            <Zap className="h-4 w-4 text-primary" />
            <span>AI-powered support automation</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto text-balance leading-[1.1]">
            Customer support that works while you sleep
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Train an AI bot on your knowledge base, embed it on your site, and let it handle customer queries 24/7.
            Human handoff when needed.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">No credit card required. 14-day free trial.</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need for AI support</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              From knowledge base training to human handoff, we&apos;ve got you covered.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="Knowledge Base"
              description="Upload PDFs, add FAQs, paste text. Your bot learns from all your content automatically."
            />
            <FeatureCard
              icon={<Bot className="h-6 w-6" />}
              title="AI Chatbot"
              description="Powered by RAG (Retrieval-Augmented Generation) for accurate, contextual answers."
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="Embeddable Widget"
              description="Drop a single script tag on your site. The chat widget appears everywhere."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Human Handoff"
              description="When AI isn&apos;t confident, it creates a ticket for your human agents."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Analytics Dashboard"
              description="Track resolution rates, response times, and conversation trends."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Multi-tenant"
              description="Each workspace is isolated. Perfect for agencies or multiple brands."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Get started in minutes</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to automate your customer support.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              number="1"
              title="Upload Your Content"
              description="Add FAQs, upload PDFs, or paste documentation. We'll chunk and index it."
            />
            <StepCard
              number="2"
              title="Configure Your Bot"
              description="Set the tone, greeting message, and customize the widget appearance."
            />
            <StepCard
              number="3"
              title="Embed & Go Live"
              description="Copy the script tag and paste it on your website. Done!"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to automate your support?</h2>
          <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
            Join thousands of businesses using AutoSupport to deliver instant, accurate customer support.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
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
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/pricing" className="hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="hover:text-foreground transition-colors">
                Sign Up
              </Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AutoSupport. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}

# AutoSupport - AI-Powered Customer Support Platform

AutoSupport is a production-ready SaaS platform that enables businesses to automate customer support using AI. Train a chatbot on your knowledge base (FAQs, documents, PDFs), embed it on your website, and let AI handle support queries while seamlessly escalating to human agents when needed.

## Features

- **Multi-tenant Workspaces**: Each business gets their own isolated workspace with customizable settings
- **Knowledge Base Management**: Upload PDFs, add FAQs, or paste text content
- **AI Chatbot with RAG**: Retrieval-Augmented Generation for accurate, context-aware responses
- **Embeddable Widget**: Simple JavaScript snippet to add chat to any website
- **Ticketing System**: Human handoff when AI confidence is low
- **Analytics Dashboard**: Track conversations, resolution rates, and agent performance
- **Flexible Payments**: Stripe (international) and Razorpay (India) support

## Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Database**: PostgreSQL with pgvector for embeddings
- **AI**: OpenAI (text-embedding-3-small for embeddings, GPT-4o-mini for chat)
- **Auth**: JWT-based with HTTP-only cookies
- **Payments**: Stripe Checkout + Razorpay

## Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-secure-jwt-secret-min-32-chars

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Razorpay (for India payments)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

## Database Setup

1. Enable the pgvector extension in your PostgreSQL database:

\`\`\`sql
CREATE EXTENSION IF NOT EXISTS vector;
\`\`\`

2. Run the migration script in `scripts/001-create-tables.sql`

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations
5. Start the development server: `npm run dev`

## Pricing Plans

| Plan | Price (USD) | Price (INR) | Conversations | Agents | Documents |
|------|-------------|-------------|---------------|--------|-----------|
| Basic | $6/mo | ₹299/mo | 500 | 2 | 10 |
| Standard | $15/mo | ₹799/mo | 2,000 | 5 | 50 |
| Advanced | $29/mo | ₹1,499/mo | 10,000 | 20 | 200 |

## Widget Integration

After setting up your workspace, go to the Widget page in your dashboard to get the embed code:

\`\`\`html
<script>
  window.autoSupportConfig = {
    workspaceKey: 'your-workspace-public-key'
  };
</script>
<script src="https://your-domain.com/widget.js" async></script>
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Knowledge Base
- `POST /api/knowledge-base/faq` - Add FAQ entry
- `POST /api/knowledge-base/text` - Add text content
- `POST /api/knowledge-base/pdf` - Upload PDF
- `DELETE /api/knowledge-base/delete` - Remove content

### Chat
- `POST /api/chat` - Send message to AI
- `GET /api/chat/history` - Get conversation history

### Tickets
- `GET /api/tickets` - List tickets
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets` - Update ticket
- `POST /api/tickets/reply` - Add reply

### Checkout
- `POST /api/checkout` - Create checkout session

## License

MIT

# AI CFO — Workspace

## Overview

Full-stack SaaS financial intelligence dashboard for startups. Connects to Stripe, analyzes revenue data, and uses OpenAI to generate actionable insights.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/ai-cfo)
- **Backend**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM (lib/db)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: JWT (jsonwebtoken) + bcrypt password hashing
- **AI**: OpenAI gpt-5.2 via Replit AI Integrations proxy
- **Stripe**: stripe npm package (test mode)
- **Build**: esbuild (backend), Vite (frontend)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port from $PORT)
│   └── ai-cfo/             # React + Vite frontend (port 22558)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- **users** — accounts with email/password, optional Stripe key, demo mode flag
- **insights** — stored AI insight reports (jsonb) per user

## API Routes

All routes are prefixed with `/api`.

### Auth (`/api/auth`)
- `POST /register` — create account
- `POST /login` — authenticate, get JWT
- `POST /logout` — stateless ack
- `GET /me` — current user (requires Bearer token)

### Stripe (`/api/stripe`)
- `GET /status` — is Stripe connected?
- `GET /demo-mode` — get demo mode state
- `POST /demo-mode` — toggle demo mode `{ demoMode: boolean }`
- `POST /connect` — validate and save Stripe key `{ apiKey: string }`

### Dashboard (`/api/dashboard`)
- `GET /metrics` — MRR, growth, customers, churn, ARPU, invoices
- `GET /revenue-chart` — 12-month revenue/MRR/customers array

### Insights (`/api/insights`)
- `GET /latest` — most recent stored insights
- `POST /generate` — generate new AI insights (OpenAI call)
- `POST /weekly-actions` — get 3 prioritized weekly actions

## Services

- `artifacts/api-server/src/services/stripeService.ts` — Stripe data fetching + demo data generation
- `artifacts/api-server/src/services/insightsService.ts` — OpenAI insight/action generation
- `artifacts/api-server/src/lib/auth.ts` — JWT signing, bcrypt, Express middleware

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned by Replit)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Replit AI proxy URL (auto-set)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI proxy key (auto-set)
- `JWT_SECRET` — JWT signing secret (defaults to dev value; set in production)
- `PORT` — assigned by Replit per artifact

## Key Features

- Email/password authentication with JWT tokens
- Demo mode with realistic simulated SaaS metrics (on by default)
- Stripe connection (test mode) — pulls real revenue, subscriptions, invoices
- Financial dashboard: MRR, MRR growth %, total revenue, active customers, churn rate, ARPU
- 12-month revenue/MRR line chart (Recharts)
- AI Insights: revenue forecast (3 months), churn risks, opportunities, recommended actions
- "What should I do this week?" — 3 prioritized weekly actions

## Codegen

Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.

## Database Migrations

Run `pnpm --filter @workspace/db run push` after changing `lib/db/src/schema/`.

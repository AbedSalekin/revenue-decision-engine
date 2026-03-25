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
workspace/
├── artifacts/
│   ├── api-server/              # Express API server (port from $PORT)
│   │   └── src/
│   │       ├── routes/          # Thin route handlers (auth, stripe, dashboard, insights)
│   │       ├── services/
│   │       │   ├── stripe/      # types.ts, demoData.ts, client.ts, index.ts
│   │       │   └── insights/    # context.ts, index.ts (OpenAI calls)
│   │       └── lib/             # auth.ts, userHelpers.ts
│   └── ai-cfo/                  # React + Vite frontend
│       └── src/
│           ├── pages/           # dashboard.tsx, insights.tsx (thin orchestrators)
│           └── components/
│               ├── dashboard/   # StatCard, Sparkline, RevenueChart, RevenueBreakdown, SkeletonLoaders
│               └── insights/    # ConfidenceBadge, ImpactBadge, ThinkingLoader, EmptyState, WeeklyPriorities
├── server/lib/                  # Shared workspace packages
│   ├── api-spec/                # OpenAPI spec + Orval codegen config
│   ├── api-client-react/        # Generated React Query hooks
│   ├── api-zod/                 # Generated Zod schemas from OpenAPI
│   └── db/                      # Drizzle ORM schema + DB connection
├── pnpm-workspace.yaml          # packages: artifacts/*, server/lib/*, scripts
├── tsconfig.base.json
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
- `GET /demo-mode` — get demo mode state + active company type
- `POST /demo-mode` — toggle demo mode `{ demoMode: boolean }`
- `POST /demo-company` — switch demo archetype `{ companyType: "saas" | "marketplace" | "subscription" }`
- `POST /connect` — validate and save Stripe key `{ apiKey: string }`

### Dashboard (`/api/dashboard`)
- `GET /metrics` — MRR, growth, customers, churn, ARPU, invoices + sparkline
- `GET /revenue-chart` — 12-month revenue/MRR/customers array
- `GET /revenue-breakdown` — revenue by plan (byPlan[] + totalMrr)

### Insights (`/api/insights`)
- `GET /latest` — most recent stored insights
- `POST /generate` — generate new AI insights (OpenAI call)
- `POST /weekly-actions` — get 3 prioritized weekly actions

## Services

- `artifacts/api-server/src/services/stripe/` — types, demo data, live Stripe client, index re-export
- `artifacts/api-server/src/services/insights/` — OpenAI context builder (`context.ts`) + AI calls (`index.ts`)
- `artifacts/api-server/src/lib/auth.ts` — JWT signing, bcrypt, Express middleware
- `artifacts/api-server/src/lib/userHelpers.ts` — `isLiveMode()` and `resolveCompanyType()` shared helpers

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned by Replit)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Replit AI proxy URL (auto-set)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI proxy key (auto-set)
- `JWT_SECRET` — JWT signing secret (defaults to dev value; set in production)
- `PORT` — assigned by Replit per artifact

## Key Features

- Email/password authentication with JWT tokens stored in `localStorage` (`ai_cfo_token`)
- Demo mode with 3 realistic company archetypes: B2B SaaS / Marketplace / Consumer Subscription
- Stripe connection (test mode) — pulls real revenue, subscriptions, invoices
- Financial dashboard: 8 KPI cards with sparklines + MoM badges, 3-metric chart toggle, revenue breakdown by plan
- AI Insights: 3-month forecast with confidence scores, churn risks, growth opportunities
- "What should I do this week?" — 3 prioritized weekly actions with Impact level + Expected Outcome
- Collapsible sidebar (icon-only at 60px), company type switcher pills in topbar (demo mode only)
- Premium landing page with mini dashboard chart preview on the login screen

## TypeScript Conventions

- `req.user` is typed via `artifacts/api-server/src/types/express.d.ts` — never use `(req as any).user`
- All routes use `const { user } = req` after the `requireAuth` middleware
- `isLiveMode(user)` helper centralises the "use real Stripe vs demo" check in each route file
- Insight pruning uses a single `inArray` batch delete — never loop-delete

## Build Notes

- esbuild bundles workspace packages directly (no externalize). Extra `nodePaths` in `build.mjs` point to `server/lib/*/node_modules/` and the pnpm virtual store so transitive dependencies resolve correctly.
- Shared packages live under `server/lib/` but pnpm-workspace.yaml expects `lib/*`. A `lib/` directory at the workspace root contains symlinks (`lib/api-zod -> ../server/lib/api-zod`, etc.) as a compatibility shim.
- `server/tsconfig.base.json` is a symlink to `../tsconfig.base.json` so that workspace package tsconfigs resolving `../../tsconfig.base.json` still work.

## Codegen

Run `pnpm --filter @workspace/api-spec run codegen` after changing `server/lib/api-spec/openapi.yaml`.

## Database Migrations

Run `pnpm --filter @workspace/db run push` after changing `server/lib/db/src/schema/`.

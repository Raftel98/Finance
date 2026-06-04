# PWOS — Setup Guide

## Prerequisites
- Node.js 20+
- PostgreSQL (Supabase recommended)
- npm / pnpm / bun

---

## 1. Install dependencies

```bash
cd pwos
npm install
```

---

## 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` | Supabase → Settings → Database → Transaction pooler URL (port 6543) |
| `DIRECT_URL` | Supabase → Settings → Database → Direct connection URL (port 5432) |
| `AUTH_SECRET` | Run: `openssl rand -base64 32` |
| `OPEN_EXCHANGE_RATES_APP_ID` | https://openexchangerates.org (free tier) |
| `OPENAI_API_KEY` | https://platform.openai.com |
| `R2_*` | Cloudflare dashboard → R2 → Create bucket |
| `UPSTASH_REDIS_*` | https://upstash.com → Create Redis database |

For local development you can skip R2, Upstash, and OpenAI — the AI import and export features won't work but everything else will.

---

## 3. Set up database

```bash
# Push schema to your DB
npm run db:push

# Or run migrations (production)
npm run db:migrate

# Seed demo data
npm run db:seed
```

---

## 4. Run the app

```bash
npm run dev
```

Open http://localhost:3000

**Demo credentials:**
- Email: `demo@pwos.app`
- Password: `demo123456`

---

## 5. Project structure

```
pwos/
├── src/
│   ├── app/
│   │   ├── auth/                    # login, register
│   │   ├── dashboard/               # 11 protected pages
│   │   │   ├── page.tsx             # Main dashboard
│   │   │   ├── transactions/        # Income/expense + recurring rules
│   │   │   ├── assets/              # Asset portfolio
│   │   │   ├── liabilities/         # Debt tracking
│   │   │   ├── credit-cards/        # Card management
│   │   │   ├── net-worth/           # Net worth history + snapshots
│   │   │   ├── budgets/             # Budget planning vs actual
│   │   │   ├── forecast/            # Financial projections + scenarios
│   │   │   ├── goals/               # Financial goals
│   │   │   ├── ai-import/           # AI document extraction
│   │   │   ├── reports/             # Reports + CSV export
│   │   │   └── settings/            # Profile, currency, security
│   │   └── api/                     # 30+ API routes
│   ├── components/
│   │   ├── layout/                  # Sidebar, Topbar
│   │   ├── ui/                      # MetricCard, PageShell
│   │   ├── forms/                   # Auth forms
│   │   └── modules/                 # Feature components (10 modules)
│   ├── hooks/                       # 10 TanStack Query hook files
│   ├── lib/
│   │   ├── auth.ts                  # NextAuth v5 config
│   │   ├── prisma.ts                # Prisma singleton
│   │   ├── constants.ts             # Currency lists, enums
│   │   ├── utils.ts                 # formatCurrency, formatDate, cn
│   │   └── validations/             # 8 Zod schema files
│   ├── services/                    # 8 business logic services
│   │   ├── currency.ts              # Exchange rate engine
│   │   ├── transaction.ts           # Transaction CRUD + filtering
│   │   ├── netWorth.ts              # NW calculation + snapshots
│   │   ├── budget.ts                # Budget vs actual computation
│   │   ├── forecast.ts              # Projection algorithm
│   │   ├── goal.ts                  # Goal progress computation
│   │   ├── aiExtraction.ts          # GPT-4o document pipeline
│   │   └── report.ts                # Report generation + CSV
│   └── types/
│       └── ai.ts                    # Shared AI types
├── prisma/
│   ├── schema.prisma                # 20-table data model
│   └── seed.ts                      # Demo data (5 assets, 3 recurring, goals)
├── .env.example
└── SETUP.md
```

---

## 6. Implementation phases

| Phase | Module | Status |
|-------|--------|--------|
| 0 | Foundation (auth, DB, shell) | ✅ Complete |
| 1 | Transactions + Multi-currency | ✅ Complete |
| 2 | Assets, Liabilities, Credit Cards, Net Worth | ✅ Complete |
| 3 | Budgeting (plan vs actual) | ✅ Complete |
| 4 | Forecasting + Scenario simulation | ✅ Complete |
| 5 | Financial Goals | ✅ Complete |
| 6 | AI Document Processing | ✅ Complete |
| 7 | Reports + CSV Export | ✅ Complete |
| 8 | Settings (profile, security, currency) | ✅ Complete |

---

## Tech stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth v5 + Argon2
- **Charts:** Recharts
- **State:** TanStack Query + Zustand
- **AI:** OpenAI GPT-4o (document extraction)
- **Storage:** Cloudflare R2
- **Cache:** Upstash Redis

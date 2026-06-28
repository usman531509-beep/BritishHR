# Deploying CompliHR UK to Vercel

This app is **Next.js 16 + Prisma 7 (pg driver adapter) + Auth.js v5**. It needs a
hosted PostgreSQL database and four environment variables. The Vercel build runs
`prisma generate && next build` automatically; database migrations and the initial
seed are run **once**, explicitly (they are intentionally not part of the build).

---

## 1. Provision a PostgreSQL database

Use any Postgres provider. Recommended: **Supabase** or **Neon** (both have free
tiers and a pooled endpoint suited to serverless), or add Postgres from the
**Vercel Marketplace** (Project → Storage).

Grab **two** connection strings:

| Variable       | Which connection                              | Used for                          |
| -------------- | --------------------------------------------- | --------------------------------- |
| `DATABASE_URL` | **Pooled** (PgBouncer, e.g. port `6543`)      | App runtime (serverless)          |
| `DIRECT_URL`   | **Direct** (e.g. port `5432`)                 | `prisma migrate deploy` (DDL)     |

Append `?sslmode=require` for Supabase/Neon. (Locally both can be the same URL.)

## 2. Generate secrets

```bash
npx auth secret            # -> AUTH_SECRET
openssl rand -base64 32    # -> ENCRYPTION_KEY  (keep this STABLE forever)
```

> ⚠️ Changing `ENCRYPTION_KEY` later makes already-encrypted PII (NI numbers,
> visa/bank details) unreadable. Set it once and keep it safe.

## 3. Get the code onto Vercel

This folder is not yet a git repo. Pick one:

**A) GitHub (recommended)**
```bash
git init && git add -A && git commit -m "Initial commit"
gh repo create complihr-uk --private --source=. --push   # or push to a repo you made
```
Then on vercel.com → **Add New… → Project** → import the repo.

**B) Vercel CLI**
```bash
npm i -g vercel
vercel link        # create/link the project
```

## 4. Set environment variables on Vercel

Project → **Settings → Environment Variables** (set for **Production**, and
Preview if you use preview deploys):

```
DATABASE_URL    = <pooled connection string>
DIRECT_URL      = <direct connection string>
AUTH_SECRET     = <from step 2>
ENCRYPTION_KEY  = <from step 2>
```

With the CLI you can instead run `vercel env add DATABASE_URL production` etc.

## 5. Run migrations + seed (one time)

Point your local CLI at the **production** database and apply the schema, then
load the baseline data (roles, permissions, demo tenant + logins):

```bash
# pull the prod env locally (CLI), or just export the prod URLs in your shell:
vercel env pull .env.production.local       # creates the file with prod vars
set -a && . ./.env.production.local && set +a

npm run db:deploy     # prisma migrate deploy  (uses DIRECT_URL)
npm run db:seed       # creates roles/permissions + demo accounts
```

Seed logins (password `Password123!`) — **change these before real use**:
`owner@complihr.co.uk`, `hr@hounslow.co.uk`, `manager@hounslow.co.uk`,
`employee@hounslow.co.uk`, `accountant@external.co.uk`.

> Re-run only `npm run db:deploy` after future schema changes. Don't re-run the
> seed against a live DB (it inserts demo data).

## 6. Deploy

Push to your default branch (GitHub flow) or run `vercel --prod` (CLI). Vercel
builds with `prisma generate && next build` and serves the app. Open the
deployment URL and sign in.

---

## Notes / what's already configured for you

- **`vercel.json`** — pins framework + build command.
- **`package.json`** — `build` runs `prisma generate` first; `postinstall` also
  runs it so the client is never stale; `engines.node` pinned to `22.x`.
- **`prisma/schema.prisma`** — `binaryTargets` includes Vercel's Linux engine
  (`rhel-openssl-3.0.x`).
- **`prisma.config.ts`** — Migrate uses `DIRECT_URL` when present.
- **Auth.js** — `trustHost: true` so it works behind Vercel's proxy.
- **Region** — for lowest latency set the Vercel Function region (Project →
  Settings → Functions) to the same region as your database.

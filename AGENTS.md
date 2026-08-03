# Repository Guidelines

This file provides guidance for AI coding agents when working with code in this repository.

## Focused Guides

Read the guide for your focus area before starting work there; skip the others.

- [docs/agents/design.md](docs/agents/design.md) — building or changing any UI: design workflow (shadcn/ui + Impeccable), mobile-first and accessibility floor
- [docs/agents/database.md](docs/agents/database.md) — schema changes, migrations, Neon branches, seeding

## Commands

### Development

```bash
# Install dependencies (requires pnpm)
pnpm install

# Run development server
pnpm dev
```

The app runs on <http://localhost:3000>

### Code Quality

```bash
# Run all linters and formatters
pnpm lint

# Fix linting and formatting issues
pnpm lint:fix
```

### Testing

```bash
# Run Vitest unit tests
pnpm test

# Run tests once (CI mode)
pnpm test:run
```

### Database

```bash
# Push schema changes to Neon (your own branch only — see docs/agents/database.md)
pnpm db:push

# Generate migration files
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Open Drizzle Studio (DB GUI)
pnpm db:studio
```

The primary Neon database is live production. Never run `db:push` or migrations against it — work on a Neon branch (see [docs/agents/database.md](docs/agents/database.md)).

### Build & Deploy

```bash
# Build for production
pnpm build
```

Deployed via Vercel.

## Environment Safety Contract

The canonical Vercel project is `chattanooga-seeds/seeds`. Always link this
project before pulling environment variables:

```bash
vercel whoami
vercel link --yes --scope chattanooga-seeds --project seeds
pnpm env:setup
pnpm env:check
```

Never use `phillips-blues-projects/seeds-sprouts-dev`; it is a deprecated
bootstrap project and is not the source of truth.

### Resource isolation

| Environment | Database | Public images | Private Team files |
| --- | --- | --- | --- |
| Production | Live Neon database | Production Blob store | `seeds-team-files-production` |
| Development | Sanitized persistent clone in `seeds-nonproduction` | `seeds-public-development` | `seeds-team-files-development` |
| Preview | Automatic copy-on-write Neon branch per Preview deployment | `seeds-public-preview` | `seeds-team-files-preview` |

Development and Preview must never receive Production database or Blob write
credentials. Preview database variables are injected for that deployment by
the Vercel-managed Neon integration and are not copied manually.

The database client and Drizzle configuration fail closed when the known
Production database is used outside `VERCEL_ENV=production`. Never set
`ALLOW_PRODUCTION_DATABASE=true` in Development, Preview, CI, or a normal local
shell. It is an owner-only break-glass override that requires explicit approval.
`pnpm dev` and `pnpm build` also verify that both Blob tokens belong to the
expected environment before Next.js starts.

### Local development

1. Run `pnpm install`.
2. Link `chattanooga-seeds/seeds` with the commands above.
3. Run `pnpm env:setup`. It pulls **Development**, never Production, into
   `.env.local` and generates a machine-only Auth secret in
   `.env.development.local`.
4. Run `pnpm env:check`; it must report `production=false`.
5. Run `pnpm db:migrate`, then `pnpm dev`.

`vercel env pull` overwrites its target file. Put personal, non-secret overrides
in `.env.development.local`, not `.env.local`, and never copy credentials or
Auth secrets from another developer. `.env.local` and all `.local` variants
remain gitignored. Hosted Preview and Production use different sensitive
`AUTH_SECRET` values; local development never receives either one.

### Database changes

- Change `lib/db/schema.ts`, run `pnpm db:generate`, and commit the generated
  migration with the code that needs it.
- Use `pnpm db:migrate` for normal Development work. Database commands run the
  safety check first.
- `pnpm db:push` is only for an explicitly disposable Development database.
  Never use it for Preview or Production.
- Vercel runs `pnpm vercel-build`, which validates environment isolation and
  applies committed migrations to the isolated Preview branch before building.
- `pnpm db:sanitize` is only for a freshly cloned non-production database. It
  anonymizes users and removes private team conversations, events, private
  budgets, activity markers, deletion queues, and database-managed admin emails.
- Production migrations happen only through a reviewed `main` deployment.
  Never migrate Production from a developer laptop.

### Preview workflow

Every PR receives its own Vercel Preview deployment and Neon copy-on-write
branch. Test schema changes, writes, and destructive flows there. Preview Blob
stores are shared between previews but isolated from Production; use unique
project-scoped paths and clean up test files. Closing a PR does not necessarily
delete its database branch immediately, so periodically prune old Vercel Preview
deployments/Neon branches according to the configured retention policy.

## Pre-Commit Checklist

Always run all of these locally before committing changes. Fix any failures before committing.

```bash
# 1. Format and lint
pnpm lint:fix

# 2. Run tests
pnpm test:run

# 3. Type check (must pass with zero errors)
pnpm exec tsc --noEmit
```

These three checks match what CI runs. If any fail locally, they will fail in CI. Fix all issues before committing.

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 16 with App Router (React 19)
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Maps**: Mapbox GL JS via react-map-gl
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Auth**: NextAuth.js v5 (Google OAuth)
- **Testing**: Vitest (unit)
- **Deployment**: Vercel

### Key Patterns

- **Server Components First**: Minimize `use client` usage
- **Server Actions**: All mutations via `"use server"` functions in `lib/actions/`
- **Functional Programming**: No classes, use functions
- **Error Handling**: Early returns, guard clauses, user-friendly errors
- **File Structure**: component → subcomponents → helpers → static → types
- **Naming**: lowercase-dash for directories, named exports for components
- **Routing**: Each page has its own URL — use Next.js file-based routing
- **Mobile First**: Design for mobile, scale up to desktop

### Project Structure

```
app/
  page.tsx              # Home — project explorer with grid/map toggle
  admin/page.tsx        # Admin — project management table
  dashboard/            # "Mine" hub — user's projects and supported projects
    projects/[id]/      # Private project workspace: layout + team, edit,
                        # updates, supporters sections
  seeds/
    new/page.tsx        # Create project form
    [id]/page.tsx       # Public project detail view
  api/auth/             # NextAuth API routes

auth.ts                 # NextAuth config (Google OAuth, user upsert)
middleware.ts           # Route protection (dashboard, admin)

components/
  admin/                # Admin data table, actions, council list
  auth/                 # Sign-in, sign-out, user menu
  dashboard/            # Project lists, status badges, workspace nav
  forms/                # Project form, update form, uploads, location picker
  layout/               # Header, footer, mobile nav
  map/                  # Reusable Mapbox wrapper
  seeds/                # Project cards, explorer, team workspace widgets
                        # (updates, roster, budget, events, documents)
  ui/                   # shadcn/ui components

lib/
  actions/              # Server actions (projects, updates, budgets,
                        # team roster/events/activity, council, support)
  project-stages.ts     # Seed → Sprout → Tree lifecycle model
  participant-roles.ts  # Team role definitions
  project-workspace.ts  # Workspace access rules (+ -navigation.ts for nav)
  db/
    index.ts            # Neon + Drizzle connection (neon-http driver)
    schema.ts           # users, projects, project_participants,
                        # project_updates, project_budgets, project_events, …
    types.ts            # Inferred TypeScript types
    queries/            # Read-only query functions
    migrations/         # Drizzle migration files
  validations/          # Zod schemas (project, project-update, budget, …)
```

One data model serves the whole Seed → Sprout → Tree lifecycle: capabilities unlock by stage (`lib/project-stages.ts`, `lib/project-workspace.ts`) rather than by parallel tables or duplicated components. Extend that pattern — new stage-gated features should reuse the `projects` tables and shared components, not fork them.

### React Best Practices

Good refactoring patterns improve code readability and maintainability, but should be balanced with pragmatism. Apply these patterns when they clearly improve the code, not dogmatically.

#### Extract Component Concerns into Hooks

When a component handles data fetching or complex state logic, extract it into a custom hook. This separates concerns and makes components easier to read.

#### Make Hooks Self-Contained

Hooks should encapsulate their own dependencies when possible. This reduces noise in component code and keeps implementation details inside the hook.

#### Follow the Stepdown Rule

Code should read like a narrative, flowing from high-level abstractions to low-level details. In React files, this means: main component → child components → hooks → helper functions.

### Design & UI

Read [docs/agents/design.md](docs/agents/design.md) before building or changing any UI. The essentials:

- **shadcn/ui is the design system.** Build on the primitives in `components/ui/` (add new ones via the shadcn CLI) and customize with Tailwind utilities. Never hand-roll a dialog, popover, tab strip, sheet, or menu — the Radix-based primitives carry the keyboard and screen-reader behavior for free.
- **Impeccable is the design reviewer.** It is installed on demand, not committed — run `pnpm skills:install` before design work, then use `/impeccable` commands (`shape` to plan, `audit`/`critique` to evaluate, `adapt` for responsiveness, `polish` before shipping). A detector hook scans UI files after every edit — act on its findings.
- **Mobile-first, always.** Design for a 320px viewport with touch input first and scale up. Comfortable touch targets, 16px inputs on mobile, no hover-only affordances, and every control labeled for assistive tech. The full floor lives in the design guide.

### Environment Variables

Required environment variables are documented in `.env.example`:

- `DATABASE_URL` — Neon PostgreSQL connection string
- `AUTH_SECRET` — NextAuth secret
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth credentials
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Mapbox access token
- `ADMIN_EMAILS` — Comma-separated admin emails (auto-promoted on sign-in)
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API key for image generation
- `BLOB_READ_WRITE_TOKEN` — Environment-specific public image Blob store
- `TEAM_FILES_BLOB_READ_WRITE_TOKEN` — Environment-specific private Team store

Use `pnpm env:setup` to sync Development variables and generate the local Auth
secret. Never pull Production into a developer worktree.

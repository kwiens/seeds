# Seeds

A community platform for proposing, supporting and growing local projects.
Residents plant a **Seed** (an idea tied to a place), gather support, and
grow it into a **Sprout** (a project underway, with a private team
workspace) and finally a **Tree** (a finished project being maintained).

Seeds was built for [Chattanooga National Park City](https://www.npcseeds.org)
and is designed so any city can run its own instance. City-specific values
live in [`config/`](config/README.md); everything else is shared product
code. Start with [`docs/city-setup.md`](docs/city-setup.md) to launch your
own.

## Features

- **Plant a Seed**: a guided form capturing the idea, the people behind it,
  the place, the resources it has and needs, and photos
- **Explore**: card grid or Mapbox map, with category, badge, search and sort
  filters, plus a listing per lifecycle stage
- **Support**: sign in and give "sunlight"; enough supporters auto-approves
  a pending Seed
- **Team workspace** (Sprout and Tree): private updates with attachments,
  roster and invite links, budgets, events, and documents
- **Public updates**: progress posts on the project page
- **AI posters**: each project gets a vintage-park-poster illustration from
  Google Gemini, stored in Vercel Blob
- **Admin**: approve and advance projects, pin status badges, moderate
  comments, manage admins and Council, export CSVs, edit the site banner,
  homepage phase and optional event page
- **Sharing**: QR codes, sitemap, GPX export of project locations

## Tech stack

Next.js 16 (App Router, React 19), TypeScript, Tailwind CSS v4 with
shadcn/ui, Neon Postgres via Drizzle ORM, NextAuth.js v5 (Google), Mapbox GL,
Google Gemini, Vercel Blob, Vitest and Playwright. Deployed on Vercel.

## Documentation

| Read | When |
| --- | --- |
| [`docs/city-setup.md`](docs/city-setup.md) | You want to run Seeds for your city |
| [`config/README.md`](config/README.md) | You are editing city values |
| [`docs/architecture.md`](docs/architecture.md) | You are changing the app: layers, data model, authorization, conventions, how to add a feature |
| [`AGENTS.md`](AGENTS.md) | Commands, environment safety contract, pre-commit checklist. Also what AI coding agents read first |
| [`docs/agents/design.md`](docs/agents/design.md) | Building UI |
| [`docs/agents/database.md`](docs/agents/database.md) | Schema and migrations |

## Getting started (contributors to the reference deployment)

```bash
pnpm install

# Link the canonical project, then pull isolated Development credentials
vercel link --yes --scope chattanooga-seeds --project seeds
pnpm env:setup

# Confirm the database and storage targets are non-production
pnpm env:check

pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The environment safety
contract in [`AGENTS.md`](AGENTS.md) explains why Production is never reachable
from a laptop.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server (runs the environment check first) |
| `pnpm build` | Production build |
| `pnpm lint` / `pnpm lint:fix` | ESLint and Biome |
| `pnpm test` / `pnpm test:run` | Vitest, watch or once |
| `pnpm test:e2e` | Playwright, against the Development database |
| `pnpm env:setup` | Pull Development variables and create a machine-only Auth secret |
| `pnpm env:check` | Verify required variables and a safe database target |
| `pnpm db:generate` | Generate a migration from `lib/db/schema.ts` |
| `pnpm db:migrate` | Apply committed migrations |
| `pnpm db:push` | Push schema to an explicitly disposable Development database only |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:seed` | Load Chattanooga sample data (`scripts/populate.ts`) |
| `pnpm db:sanitize` | Strip private data from a fresh non-production clone |

## End-to-end tests

The Playwright suite starts the app through `pnpm dev`, refuses Production,
and upserts three namespaced fixture accounts in the Development database.
Install Chromium once, then:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Failures keep screenshots, video and traces under `test-results/`; open the
report with `pnpm exec playwright show-report`. CI uses the `E2E_DATABASE_URL`
secret, which must point at a non-production branch.

## Environment variables

Documented in `.env.example`. The important ones:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Neon connection string for this environment |
| `AUTH_SECRET` | NextAuth secret; machine-specific locally, distinct per hosted environment |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public token |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini key for poster generation |
| `BLOB_READ_WRITE_TOKEN` | Public image store for this environment |
| `TEAM_FILES_BLOB_READ_WRITE_TOKEN` | Private team-file store for this environment |
| `ADMIN_EMAILS` | Comma-separated bootstrap admins |
| `ALLOW_PRODUCTION_DATABASE` | Owner-only break-glass override; never enable normally |

## License

Private.

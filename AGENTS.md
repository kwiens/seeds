# Repository Guidelines

This file provides guidance for AI coding agents when working with code in this repository.

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
# Push schema changes to Neon (dev)
pnpm db:push

# Generate migration files
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Open Drizzle Studio (DB GUI)
pnpm db:studio
```

### Build & Deploy

```bash
# Build for production
pnpm build
```

Deployed via Vercel.

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
  page.tsx              # Home — seed list with grid/map toggle
  home-content.tsx      # Client wrapper for view switching
  admin/page.tsx        # Admin — seed management table
  dashboard/            # User's seeds and supporters
  seeds/
    new/page.tsx        # Create seed form
    [id]/page.tsx       # Seed detail view
    [id]/edit/page.tsx  # Edit seed form
  api/auth/             # NextAuth API routes

auth.ts                 # NextAuth config (Google OAuth, user upsert)
middleware.ts           # Route protection (dashboard, admin)

components/
  admin/                # Admin data table, actions
  auth/                 # Sign-in, sign-out, user menu
  dashboard/            # Seed list, status badges, supporters
  forms/                # Seed form, sortable list, location picker
  layout/               # Header, footer, mobile nav
  map/                  # Reusable Mapbox wrapper
  seeds/                # Seed card, list/map views, support button
  ui/                   # shadcn/ui components

lib/
  actions/              # Server actions (seeds, support, admin, export)
  categories.ts         # Category definitions (5 categories)
  db/
    index.ts            # Neon + Drizzle connection
    schema.ts           # Tables: users, seeds, seed_approvals, seed_supports
    types.ts            # Inferred TypeScript types
    queries/            # Read-only query functions
    migrations/         # Drizzle migration files
  validations/seed.ts   # Zod schema for seed form
```

### React Best Practices

Good refactoring patterns improve code readability and maintainability, but should be balanced with pragmatism. Apply these patterns when they clearly improve the code, not dogmatically.

#### Extract Component Concerns into Hooks

When a component handles data fetching or complex state logic, extract it into a custom hook. This separates concerns and makes components easier to read.

#### Make Hooks Self-Contained

Hooks should encapsulate their own dependencies when possible. This reduces noise in component code and keeps implementation details inside the hook.

#### Follow the Stepdown Rule

Code should read like a narrative, flowing from high-level abstractions to low-level details. In React files, this means: main component → child components → hooks → helper functions.

### UI Components

Our design system components in `components/ui/` are based on shadcn/ui. Use shadcn/ui components as the foundation and customize with Tailwind utilities.

#### Cursor

Tailwind does not set `cursor: pointer` on interactive elements by default. We override this globally in `app/globals.css` — all `<a>`, `<button>`, `[role="button"]`, `<select>`, and `<summary>` elements get `cursor: pointer` via a base layer rule. Do not add `cursor-pointer` classes manually; the global rule handles it.

### Environment Variables

Required environment variables are documented in `.env.example`:

- `DATABASE_URL` — Neon PostgreSQL connection string
- `AUTH_SECRET` — NextAuth secret
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth credentials
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Mapbox access token
- `ADMIN_EMAILS` — Comma-separated admin emails (auto-promoted on sign-in)

Use `vercel env pull` to sync environment variables locally.

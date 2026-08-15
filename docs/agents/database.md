# Database Guide

For agents working on schema, migrations, queries, or seed data.

## The one hard rule

The primary Neon database is **live production**. Never run `pnpm db:push`, `pnpm db:migrate`, or destructive SQL against the `DATABASE_URL` that points at it. Schema changes reach production only through committed migration files applied via the deploy process with human sign-off.

## Working with a Neon branch

Neon branches are cheap copy-on-write clones — make one per work stream:

1. Create a branch from the primary (Neon console, or `neonctl branches create` when authenticated).
2. Point `DATABASE_URL` in your local `.env.local` at the branch's connection string.
3. Iterate freely there: `pnpm db:push` for rapid schema iteration, `pnpm db:generate` to produce the migration files you commit, `scripts/populate.ts` for sample data, `pnpm db:studio` to inspect.
4. Delete the branch when done.

Note the app's driver is `neon-http` (`lib/db/index.ts`), so the database must be Neon (or a Neon-protocol proxy) — a plain local Postgres won't connect.

## Data model principles

- **One project lifecycle, one set of tables.** `projects` and its satellites (`project_participants`, `project_updates`, `project_budgets`, `project_events`, `project_comments`, …) serve Seeds, Sprouts, and Trees alike. Capabilities unlock by stage (`lib/project-stages.ts`, `lib/project-workspace.ts`); never create stage-specific parallel tables or duplicate columns.
- Reads live in `lib/db/queries/` as plain functions; all mutations go through `"use server"` actions in `lib/actions/` that check authorization first (see `lib/project-workspace.ts` and `lib/participant-roles.ts`).
- Types are inferred in `lib/db/types.ts` — extend schema, regenerate nothing, import the inferred types.
- Validate all user input with the Zod schemas in `lib/validations/` before it reaches an action.
- Commit generated migration files from `lib/db/migrations/` alongside the schema change in the same PR.

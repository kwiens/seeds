# Running Seeds for your city

This is the launch checklist for a new city. It assumes you are comfortable
with GitHub, Vercel and a terminal. Budget an afternoon for the accounts and
an evening for the content.

Seeds runs as one deployment per city: your own fork, Vercel project,
database and domain. You own your data and your admins. See
[`architecture.md`](architecture.md) for why.

## 1. Fork and install

```bash
git clone <your fork>
cd seeds
pnpm install
```

## 2. Create the hosted resources

You need, all in one Vercel team:

| Resource | Notes |
| --- | --- |
| **Vercel project** | Framework Next.js. Note its project id from `.vercel/project.json` after `vercel link`. |
| **Neon Postgres** | Install the Neon integration from the Vercel Marketplace. It creates a production database and a copy-on-write branch per Preview deployment. Create one more branch named for development and keep it sanitized (step 7). |
| **Three pairs of Blob stores** | `public` and `team-files`, each for production, development and preview. The team-files store must be **private**. Set `BLOB_READ_WRITE_TOKEN` and `TEAM_FILES_BLOB_READ_WRITE_TOKEN` per environment. |
| **Google OAuth client** | Web application; redirect URI `https://<your domain>/api/auth/callback/google` plus the Vercel preview and localhost origins. Fill `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`. |
| **Mapbox token** | A public token with the Styles and Search APIs. Optionally a custom style. `NEXT_PUBLIC_MAPBOX_TOKEN`. |
| **Google Gemini key** | For poster generation. `GOOGLE_GENERATIVE_AI_API_KEY`. |
| **`AUTH_SECRET`** | Different random value for Production and Preview; never set in Development (local setup generates one per machine). |
| **`ADMIN_EMAILS`** | Comma-separated. These accounts become admins on first sign-in and can then add more from Admin → Settings. |

`.env.example` lists every variable.

## 3. Record the resource ids

Edit [`config/deployment.ts`](../config/deployment.ts):

- `vercelProject`: your team slug, project name and project id.
- `productionDatabase`: the Neon endpoint id (the first label of the host,
  e.g. `ep-cool-name-123456`) and database name of **Production**.
- `blobStores`: the store id from each token (`vercel_blob_rw_<id>_…`) for
  all six stores.

These let the app refuse to start against Production from anywhere except a
Production deployment, even with the wrong credentials. Test it:

```bash
vercel link --yes --scope <team> --project <project>
pnpm env:setup
pnpm env:check   # must print production=false
```

## 4. Make it yours

Edit the files in [`config/`](../config/README.md):

1. `site.ts`: name, tagline, description, city, `origin` (your canonical
   `https://` domain), locale, timezone, currency, contact email, analytics
   id (or `null`), map center and zoom, Mapbox style, auto-approve
   threshold, and `features.harvestFest` (leave `false` unless you want the
   event page).
2. `categories.ts`: your categories. Keep the keys lowercase.
3. `badges.ts`: adjust or keep.
4. `image-prompt.ts`: describe your city for the poster illustrator.
5. `content/about.ts` and `content/faq.ts`: your copy.

Then the assets:

- Replace `public/logo.svg`, `public/logo-horizontal.svg`, `app/icon.svg`
  and the social image referenced by `brand.ogImage`. Update the sizes in
  `site.ts` to match.
- Set the hero colors at the top of `app/globals.css` and, if you like, the
  green theme below them.
- The QR code embeds the favicon paths from `lib/qr.ts`; swap them for yours.

Run `pnpm test:run`: the config tests catch malformed origins, country
codes, timezones and category keys.

## 5. Database

```bash
pnpm db:migrate    # applies committed migrations to your development branch
pnpm dev           # http://localhost:3000
```

Production is migrated by the Vercel build (`pnpm vercel-build`), never from
a laptop. Preview deployments migrate their own Neon branch the same way.

## 6. Deploy

Push to `main`. Point your domain at the Vercel project and set `origin` in
`config/site.ts` to match. Sign in with an `ADMIN_EMAILS` account and open
`/admin`.

## 7. Keep development data safe

After cloning Production into a development branch, run
`pnpm db:sanitize` against that branch. It anonymizes users and strips
private team content. Never pull Production environment variables to a
laptop; `pnpm env:setup` only pulls Development.

## Optional

- **Sample data.** `scripts/populate.ts` seeds fifty Chattanooga projects
  for development. It is city-specific and lives there as an example; write
  your own or run without sample data.
- **Harvest Fest.** An admin-editable public event page at `/harvest-fest`.
  Enable it in `config/site.ts`; the content is edited from Admin.
- **Homepage phase.** Admin → Settings switches the homepage between a
  gathering grid (Phase 1) and a per-stage overview (Phase 2) for later in a
  program year.
- **Claude in CI.** The PR review workflows in `.github/workflows/` need the
  Claude GitHub App and a `CLAUDE_CODE_OAUTH_TOKEN` secret; see
  `.github/claude/README.md`. Delete the workflows if you do not want them.
- **End-to-end tests.** CI's `end-to-end` job needs an `E2E_DATABASE_URL`
  secret pointing at a non-production branch.

## Updating from upstream

Because city values are isolated in `config/`, pulling improvements from the
reference repository is usually a clean merge. Conflicts, when they happen,
are in `config/` and `public/` and are yours to resolve in favor of your
values.

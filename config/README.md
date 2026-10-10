# City configuration

Everything that makes this deployment *Chattanooga's* Seeds instead of
another city's lives in this directory. To run Seeds for your city, edit
these files and the brand assets they point to. You should not need to touch
`app/`, `components/`, or `lib/` to launch.

| File | What it controls |
| --- | --- |
| `site.ts` | Name, tagline, city, canonical origin, locale and timezone, contact email, analytics id, logos and social image, map center and style, the auto-approve supporter threshold, feature flags, sign-in provider label. |
| `categories.ts` | The categories every project is filed under: key, label, icon, colors, and optional About-page copy. Chattanooga ships the five National Park City commitments. |
| `badges.ts` | Status badges admins can pin to a project ("Funded", "Needs Volunteers"). |
| `image-prompt.ts` | How the AI poster prompt describes your city: geography, wildlife, activities, street life. |
| `content/about.ts` | Copy for the About page: hero, timeline of your program, how to help. |
| `content/faq.ts` | Copy for the FAQ page. |
| `deployment.ts` | Identifiers for your Vercel project, production Neon database and Blob stores. These drive the environment safety checks. No secrets. |

Brand colors for the hero sections live at the top of `app/globals.css`
(`--brand-hero` and friends); the main green theme is below them in the same
file. Logos and the social image live in `public/`.

## Changing categories

Category keys are stored as plain text on each project, so editing this file
needs no migration. Adding a category takes effect immediately. Renaming or
removing a key breaks every project that still uses it: update those rows
first (`update projects set category = 'new_key' where category = 'old_key'`),
then change the config.

Keys must be lowercase identifiers (`[a-z][a-z0-9_]*`). `__tests__/config/`
checks that and a few other invariants, so run `pnpm test:run` after editing.

## What is deliberately not configurable

- **The Seed → Sprout → Tree lifecycle** and the gardener/water/sunlight
  vocabulary. That is the product, shared by every city.
- **Team roles** (`lib/participant-roles.ts`). Their labels are editable in
  code but the set of roles is wired into authorization.
- **Routes.** Public project pages live at `/seeds/<id>` so printed QR codes
  keep working.

See [`docs/city-setup.md`](../docs/city-setup.md) for the full launch
checklist and [`docs/architecture.md`](../docs/architecture.md) for how the
rest of the app fits together.

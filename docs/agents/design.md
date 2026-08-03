# Design Guide

For agents building or changing UI. The goal: every surface works beautifully on a phone held in one hand and passes WCAG AA without a follow-up pass.

## Workflow

1. **Start from shadcn/ui.** Use the primitives in `components/ui/`; add missing ones with the shadcn CLI (`pnpm dlx shadcn@latest add <component>`). Compose and restyle with Tailwind utilities instead of building parallel components. The Radix primitives supply focus management, ARIA state, and keyboard behavior — keep them intact when customizing.
2. **Use Impeccable.** The skill is **not committed** — install it into your working tree before design work (idempotent, takes a few seconds, safe to re-run):

   ```bash
   pnpm skills:install
   ```

   It installs for whichever harnesses it detects (`.claude/skills/`, `.github/skills/`), all of which are gitignored. Then reach for it by task: `/impeccable shape` to plan a new surface, `audit` or `critique` to evaluate, `adapt` for device/responsive work, `layout`, `clarify`, `harden` for targeted refinement, `polish` before shipping.

   The detector hook is wired up in the committed `.claude/settings.json` and scans UI files after every edit and on stop — fix what it reports. The hook is guarded, so it silently no-ops when the skill isn't installed; if you never see detector output during UI work, you skipped the install step.
3. **Verify at mobile widths.** Check new UI at 320px and 390px (browser devtools or the chrome-devtools tooling) before calling it done: no horizontal page scroll, nothing unreachable, nothing unreadable.

## Mobile-first floor

- Write base styles for the smallest viewport; layer desktop with `sm:`/`md:` `min-width` variants — not the reverse.
- Touch targets: aim for 44×44px; never below 24px. Small visual icons are fine — grow the hit area with padding plus negative margin (`p-2 -m-2`).
- Keep the form primitives' 16px mobile font (`text-base md:text-sm`). Never pass a bare `text-sm` to `Input`/`Textarea` — it re-enables iOS focus zoom. Use `inputMode` for numeric fields.
- No hover-only affordances: pair `group-hover:` reveals with `group-focus-within:`, and keep actions visible by default on viewports below `sm`.
- User-generated text (names, titles, emails, URLs, filenames) always gets `break-words` or `truncate` + `min-w-0`; give meta rows `flex-wrap`.
- Tables need a mobile strategy: the `Table` primitive's `overflow-x-auto` wrapper at minimum, stacked cards (`flex-col sm:flex-row`) when the content is primary. Let long text cells wrap (`whitespace-normal break-words`).
- Horizontal strips (tabs, filters, thumbnails) scroll with `overflow-x-auto` + `min-w-max`/`shrink-0` rather than squeezing or wrapping badly.

## Accessibility floor

- Every icon-only control has a name: `aria-label` or an `sr-only` span. For labels that appear only on larger screens use `sr-only sm:not-sr-only`, never `hidden sm:inline`.
- Every field has a programmatic label: visible `<Label htmlFor>` preferred, `aria-label` when the design has none. Placeholders are not labels.
- Async feedback is announced: `role="alert"` on errors, `role="status"` on progress/success indicators.
- State is programmatic, not just visual: `aria-pressed` on toggles, `aria-expanded` + `aria-controls` on disclosures, `aria-current="page"` on active nav links.
- One `h1` per page, heading levels in order. The root layout owns the single `<main>` (with the skip link target `id="main"`) — nested layouts and pages use `<div>`.
- Decorative images (avatars beside names, card images beside titles) get `alt=""`; external links get an `sr-only` "(opens in new tab)".
- `<details>/<summary>` with flex styling loses the native marker — add a chevron with `group-open:rotate-180`.
- Text contrast ≥ 4.5:1 (3:1 for large text), including brand colors on brand backgrounds.

## Conventions

- Cursor: a global rule in `app/globals.css` sets `cursor: pointer` on `<a>`, `<button>`, `[role="button"]`, `<select>`, and `<summary>`. Don't add `cursor-pointer` to those; do add it to other interactive roles (e.g. `role="option"`).
- Popovers/dialogs must fit a 320px viewport (`PopoverContent` ships `collisionPadding`; dialogs use the shadcn responsive max-width).

# PortfolioForge Redesign — Before / After / Why

Date: 2026-09-24. Full redesign of the PortfolioForge frontend (workshop direction).
Scope: `index.html`, `styles.css`, `app.js` (themes, fonts, labels, export), `view.html`.
Untouched: `js/backend.js` (OAuth continuity, auth, dashboard, saving, sharing).

## Design system

| # | Before | After | Why |
|---|--------|-------|-----|
| 1 | Editorial paper-and-ink: serif display (Fraunces/DM Serif), 10 themes (Paper, Ink, Moss, Clay, Slate, Bone, Ocean, Ultraviolet, Rose, Mint) | Developer workshop: Archivo (variable, incl. expanded/condensed via `font-stretch`) + IBM Plex Mono, 8 themes (Drafting, Blueprint, Night Shift, Signal, Steel, Brass, Carbon, Chalk) | Aditya: "don't make it look like an ai slop". The editorial look was generic-AI; the workshop metaphor (spec plates, stamps, construction grids, mono data labels) is ownable and matches "forge" |
| 2 | 6 typography pairings incl. serifs (Editorial, Literary, Brutalist…) | 4 type systems, all Archivo-based: Industrial (expanded black), Standard, Technical (condensed), Mono | One family, four voices. Serif pairings fought the workshop concept; variable width axis gives range without font soup |
| 3 | Avatar shape control (circle/rounded) | Removed | Fewer knobs, stronger opinion. Squared 3px radius system everywhere; the plate frame is the identity |
| 4 | Numbered section eyebrows (01, 02…), drop caps, grain overlay, marquee | Stamped labels (PORTRAIT / ABOUT / WORK…), spec lines, no grain, no marquee, no drop caps | Per taste-skill/impeccable anti-slop rules: decorative numbering and grain are AI-slop tells |
| 5 | Google Fonts CDN links in downloaded HTML | Downloaded HTML links Google Fonts (Archivo + IBM Plex Mono) with system fallbacks; app shell uses self-hosted woff2 | Standalone file stays small and works offline-ish; live app has zero CDN dependency for type |
| 6 | Generic `.chip` demo buttons with `data-user` | Demo chips restyled as spec plates; JS reads `data-demo` (falls back to `data-user`) | Contract match with new markup |

## Generator (landing)

| # | Before | After | Why |
|---|--------|-------|-----|
| 7 | Centered hero, three feature cards, marquee strip | Asymmetric hero + input spec plate (what we read / what we print), spec-sheet feature rows, stamp strip | Breaks the "three equal cards" landing cliché; explains the machine before asking for input |
| 8 | — | Trust strip (Free to try / No signup / Public data only), resume privacy note | Answers the two anxieties (cost, data) before the first keystroke |

## Portfolio output

| # | Before | After | Why |
|---|--------|-------|-----|
| 9 | Centered hero, avatar circle, bio serif | Hero grid: plate (photo/monogram in stamped frame) + OPEN FOR WORK stamp (rotated, only when `hireable === true`), giant uppercase name, tagline with accent rule, spec plate (Location / GitHub rows) | Hireable becomes a physical stamp, not a pill. Spec plate turns metadata into the design |
| 10 | Work cards in a grid with generic buttons | Numbered work index (01–06), kicker row (language dot + topic tags), README excerpt as "FROM THE README" pull block | Reads like a build log / parts list instead of a template card grid |
| 11 | Timeline with dots | Ruled timeline with square accent markers, mono dates | Squares, not dots: the workshop has no circles |
| 12 | Language bars (rounded) | Square segmented bar + legend with mono percentages | Same data, squared to the system |
| 13 | Contact section with `.btn-gold` | `.btn-forge` (accent block, hard shadow) + ghost buttons + mono social chips | `btn-gold` belonged to the old palette; the forge button is the single loudest element on the page |
| 14 | Footer "Forged with ◆ PortfolioForge" | "COMPOSED BY PORTFOLIOFORGE" colophon + "Printed with PortfolioForge. Source: …" | Print-shop language, and the source line is honest about data provenance |

## Customize drawer

| # | Before | After | Why |
|---|--------|-------|-----|
| 15 | Theme swatches as tri-dots, 10 themes | 8 workshop plates (bg/accent/accent2), grouped by light/dark | The swatch previews the actual material, not an abstraction |
| 16 | Font options with serif previews | 4 Archivo-based options with live previews | What you see is what you get |
| 17 | Shape control | Removed (see 3) | — |
| 18 | — | Density control (Comfortable/Compact) now affects the real layout | Previously decorative-ish; now wired to export CSS too |

## Export / share

| # | Before | After | Why |
|---|--------|-------|-----|
| 19 | `exportCSS()` emitted the old editorial classes, `.btn-gold`, dropcap, grain | Rewritten: every workshop class, theme vars with `--on-accent`, per-font `font-stretch` tweaks, compact-density overrides, reduced-motion guard | Downloaded file must look identical to the live portfolio |
| 20 | Downloaded HTML included grain div + 6-family Google Fonts URL | No grain, Archivo + IBM Plex Mono only | Matches the redesign, smaller file |
| 21 | `view.html` was a full duplicate of the old editorial page | Rebuilt from the new shell, header stripped (read-only), `viewpage-error` shell kept | Share links render the new design; error states preserved |

## Copy

| # | Before | After | Why |
|---|--------|-------|-----|
| 22 | Em dashes and middle dots scattered through generated copy ("shipped — the archive", "★ and counting" fine) | Periods and commas; "★" kept (it is data, not decoration) | House rule: no em/en dashes in visible strings |
| 23 | "Forged with ◆ PortfolioForge — from public GitHub data." | "Printed with PortfolioForge. Source: public GitHub data." | Print metaphor + provenance |

## Preserved (did not change)

- GitHub → portfolio generation from public data; resume import (PDF/DOCX/TXT/MD, 100% client-side)
- Theme / typography / section / copy / photo customization, all persisted per mode
- Standalone HTML download; Supabase auth + saved portfolios + shareable `view.html`
- Auth gates on Customize and Download; OAuth snapshot/restore (2h expiry, auto-open Customize) in `js/backend.js` — untouched
- "Open for work" stamp renders only when `hireable === true` (now via `hidden`, not `display`)
- Reduced-motion support, mobile bottom action bar, safe-area insets, 44px touch targets

## QA fixes during the 2026-09-24 pass

- `view.html` was missing its `<script src="js/view.js">` tag after regeneration (shared-link error shell never rendered); re-added and verified the error shell shows.
- Mobile 390px had 219px horizontal overflow from the site header; header now wraps to two rows on small screens (nav becomes non-sticky, mini-nav sticks to top).
- Avatar images that fail to load now fall back to the monogram via `onerror` (was a broken-image icon).
- Resume mode spec plate labeled the LinkedIn/website row "GitHub"; the label now matches the actual link (LinkedIn / Website / GitHub).
- Em dashes removed from all redesign-owned visible strings (kept in untouched `js/backend.js` by design).
- `downloadHTML()` no longer links Google Fonts: the five self-hosted woff2 files are embedded as base64 `@font-face` at download time (~342KB file), verified rendering offline with `document.fonts.check`.
- Verified: all 8 themes switch, all 4 type systems apply (incl. condensed `font-stretch`), compact density shrinks section rhythm, resume sample + privacy modal flow, error state for unknown users, auth gates (locked buttons + auth modal on tap), no console errors from app code.

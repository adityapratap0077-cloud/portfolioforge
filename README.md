# PortfolioForge

Turn a GitHub username or a resume file into a crafted, editorial portfolio in
seconds. Customize the theme, typography, copy and photo, download a
standalone HTML file — or create a free account to save portfolios and share
them with public links.

**Design** — warm paper/ink editorial system: serif display type, hairline
rules, generous whitespace, one restrained accent per theme. Six themes
(Paper, Ink, Moss, Clay, Slate, Bone), three type pairings, compact/comfortable
density, and subtle motion (scroll reveals + a soft card tilt) that respects
`prefers-reduced-motion`. No gradients-as-decoration, no glow, no orbs.

**Backend (optional)** — Supabase Auth + Postgres. Email/password sign-up,
persisted sessions, a protected dashboard (list / open / rename / delete /
public-private toggle / share links), and public read-only pages at
`view.html?token=…`. Everything works without it: the generator is 100%
client-side and the dashboard shows setup steps until you connect Supabase.

## Quick start

No build step. Serve the folder statically:

```bash
cd portfolioforge
python3 -m http.server 8080
# open http://localhost:8080
```

- `index.html` — generator, portfolio view, dashboard, auth
- `view.html?token=…` — public read-only portfolio page

## Connect Supabase (free)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard go to **SQL Editor** and run
   [`supabase/schema.sql`](supabase/schema.sql). This creates the `profiles`
   and `portfolios` tables, indexes, Row Level Security policies and the
   `updated_at` trigger.
3. Copy your **Project URL** and **anon public key**
   (Project Settings → API) into [`supabase-config.js`](supabase-config.js).
4. Reload the site. Sign-in / Create account appears in the header; the
   **Save** button in the portfolio toolbar and the **Dashboard** tab light up.

The anon key is safe to publish — RLS restricts it to owner-only
reads/writes. Public portfolios are readable **only** through the
`get_public_portfolio(p_token)` RPC, which returns a row solely when it is
`is_public` **and** the exact unguessable 32-char `share_token` matches.
There is no anonymous direct select on the table, so public portfolios
cannot be enumerated via the API.

## What each file does

| File | Purpose |
|---|---|
| `index.html` | App shell: landing/generator, dashboard, portfolio, customize drawer, auth + save modals |
| `styles.css` | Full editorial design system (app + portfolio + dashboard) |
| `app.js` | GitHub fetching, resume parsing (PDF/DOCX/TXT/MD, in-browser), rendering, customization, HTML export |
| `js/supabase-client.js` | Loads Supabase JS from CDN only when configured; exposes `window.PFSB` |
| `js/backend.js` | Auth UI, save/update, dashboard CRUD, share links |
| `js/view.js` | Public page: strips editor chrome, loads a portfolio by share token |
| `view.html` | Public read-only portfolio page |
| `supabase-config.js` | Your Project URL + anon key (empty by default = backend disabled) |
| `supabase/schema.sql` | Tables, indexes, RLS policies, `get_public_portfolio()` RPC, trigger |

## Privacy notes

- Resume files are parsed entirely in your browser — nothing is uploaded.
- Uploaded profile photos are stored only in the browser (localStorage);
  generating a new portfolio clears them.
- **Contact review:** after parsing a resume, the app shows every detected
  email, phone, location and profile link and asks you to opt each one in.
  Email, phone and location default to **excluded**. Anything you exclude is
  never rendered, saved, downloaded, or shared — the saved record keeps only
  the approved fields plus your include/exclude decision.
- Saved portfolios store only the rendered portfolio data + your
  customization. Share links work only while a portfolio is marked Public.

## Tech

Static HTML/CSS/vanilla JS. Optional backend: Supabase (Auth + Postgres +
RLS) via the official JS client loaded from CDN — no server code, deploys
as a static site anywhere.

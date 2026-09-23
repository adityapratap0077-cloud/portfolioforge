<div align="center">

# PORTFOLIOFORGE

### Turn a GitHub username into a crafted portfolio — in seconds

![PortfolioForge](https://img.shields.io/badge/PORTFOLIOFORGE-2026-%23F2F0EB?style=for-the-badge&labelColor=%23060608)
![Status](https://img.shields.io/badge/STATUS-LIVE-%237A1212?style=for-the-badge&labelColor=%23060608)
![Backend](https://img.shields.io/badge/BACKEND-OPTIONAL_SUPABASE-%23060608?style=for-the-badge&labelColor=%23060608)
![AI](https://img.shields.io/badge/AI-NONE_NEEDED-%23060608?style=for-the-badge&labelColor=%23060608)

Paste a GitHub username or drop a resume file — get an editorial-grade
portfolio site you can restyle, download as a standalone HTML file, or save
to a free account and share with a public link.

[Live Demo](https://portfolioforge-delta.vercel.app/) • [GitHub](https://github.com/adityapratap0077-cloud/portfolioforge)

</div>

---

## What it does

- **GitHub → portfolio** — fetch any GitHub user and generate a full portfolio from their public profile and repos
- **Resume parsing** — drop a PDF, DOCX, TXT or Markdown resume; everything is parsed **in your browser**, nothing is uploaded
- **Contact privacy review** — after parsing, the app lists every detected email, phone, location and profile link and asks you to opt each one in. Email, phone and location default to **excluded**; excluded fields are never rendered, saved, downloaded or shared
- **10 themes** — Paper, Ink, Moss, Clay, Slate, Bone, Ocean, Ultraviolet, Rose, Mint: one restrained accent per theme
- **6 typography pairings** — Editorial, Modern, Mono, Literary, Brutalist, Minimal
- **Design controls** — compact/comfortable density, custom copy, photo upload, subtle motion that respects `prefers-reduced-motion`
- **HTML export** — download the finished portfolio as a single standalone HTML file
- **Optional backend** — free Supabase account: persisted portfolios, dashboard (open / rename / delete / public–private toggle), public read-only pages at `view.html?token=…`
- **Works without the backend** — the generator is 100% client-side; the dashboard shows setup steps until you connect Supabase

## Design system

Warm paper-and-ink editorial style: serif display type, hairline rules,
generous whitespace. No gradients-as-decoration, no glow, no orbs.

## Privacy

- Resume files are parsed entirely in your browser — nothing is uploaded.
- Uploaded profile photos are stored only in the browser (localStorage); generating a new portfolio clears them.
- The anon key is safe to publish — Row Level Security restricts it to owner-only reads/writes. Public portfolios are readable **only** through the `get_public_portfolio(p_token)` RPC, which returns a row solely when it is `is_public` **and** the exact unguessable 32-char `share_token` matches. There is no anonymous direct select on the table, so public portfolios cannot be enumerated via the API.

---

## Quick start

No build step. Serve the folder statically:

```bash
git clone https://github.com/adityapratap0077-cloud/portfolioforge.git
cd portfolioforge
python3 -m http.server 8080
# open http://localhost:8080
```

- `index.html` — generator, portfolio view, dashboard, auth
- `view.html?token=…` — public read-only portfolio page

## Connect Supabase (free, optional)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard go to **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql). This creates the `profiles` and `portfolios` tables, indexes, Row Level Security policies and the `updated_at` trigger.
3. Copy your **Project URL** and **anon public key** (Project Settings → API) into [`supabase-config.js`](supabase-config.js).
4. Reload the site. Sign-in / Create account appears in the header; the **Save** button in the portfolio toolbar and the **Dashboard** tab light up.

---

## Project structure

| File | Purpose |
| :--- | :--- |
| `index.html` | App shell: landing/generator, dashboard, portfolio, customize drawer, auth + save modals |
| `styles.css` | Full editorial design system (app + portfolio + dashboard) |
| `app.js` | GitHub fetching, resume parsing (PDF/DOCX/TXT/MD, in-browser), rendering, customization, HTML export |
| `js/supabase-client.js` | Loads Supabase JS from CDN only when configured; exposes `window.PFSB` |
| `js/backend.js` | Auth UI, save/update, dashboard CRUD, share links |
| `js/view.js` | Public page: strips editor chrome, loads a portfolio by share token |
| `view.html` | Public read-only portfolio page |
| `supabase-config.js` | Your Project URL + anon key (empty by default = backend disabled) |
| `supabase/schema.sql` | Tables, indexes, RLS policies, `get_public_portfolio()` RPC, trigger |

## Tech

Static HTML/CSS/vanilla JS. Optional backend: Supabase (Auth + Postgres + RLS)
via the official JS client loaded from CDN — no server code, deploys as a
static site anywhere.

---

**Aditya Pratap** — Creative Technologist
Gorakhpur, India — github.com/adityapratap0077-cloud

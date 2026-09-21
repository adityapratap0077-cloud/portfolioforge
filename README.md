# PortfolioForge

Turn any GitHub profile into a luxury portfolio. Paste a username — get a dark, editorial, gold-accented portfolio generated from real public GitHub data, downloadable as a standalone HTML file.

**Live:** https://portfolioforge-delta.vercel.app/

## How it works
- 100% client-side. No backend, no API keys, no build step.
- Fetches public data from the GitHub REST API in the browser.
- Generates: hero (avatar, name, bio, location), stats (repos, followers, stars, forks), top 6 repos by stars, language breakdown.
- **Download HTML** exports the generated portfolio as a fully standalone `.html` file.

## Run locally
```bash
cd portfolioforge
python3 -m http.server 8471
# open http://localhost:8471/
```

## Files
- `index.html` — generator view, loading skeletons, error view, portfolio view
- `styles.css` — luxury dark theme (near-black, gold accents, serif display)
- `app.js` — fetch / render / export logic

MIT License.

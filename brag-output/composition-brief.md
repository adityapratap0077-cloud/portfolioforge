# Hyperframes Composition Brief: PortfolioForge

## Objective
Create a short launch-style brag video for PortfolioForge — a generator that turns a GitHub username or resume into a full editorial portfolio website in seconds.

## Output
- Composition directory: `~/workspace/portfolioforge/brag-output/composition/`
- Rendered video: `~/workspace/portfolioforge/brag-output/brag.mp4`
- Format: vertical — 1080x1920
- Duration: 20 seconds

## Source Material
- Project root: `~/workspace/portfolioforge/`
- Primary files read: index.html (generator UI, headlines, CTA copy), styles.css (palette, fonts), README.md (feature list, theme names)
- Product name: PortfolioForge
- Tagline / strongest claim: "A portfolio that reads like you, built in seconds."
- Key UI or visual moment to recreate: the generator input card (`@ github username` + Generate button + "Free to try · No sign-up needed · Only public GitHub data"), the "Forging portfolio…" loading line, and a forged editorial portfolio hero with ranked repo cards.
- Copy that must appear verbatim:
  - "Your GitHub is not your portfolio."
  - "Generate" (button)
  - "Free to try · No sign-up needed · Only public GitHub data"
  - "Forging portfolio…"
  - "A portfolio that reads like you."
  - "Download HTML · Save to account · Share a link"
  - "portfolioforge-delta.vercel.app"

## Creative Direction
- Tone preset: polished
- Creative direction: quiet premium product film with playful energy — editorial paper-and-ink, restrained motion, one accent, sharp cuts.
- Interpretation: restrained layouts, generous whitespace, serif display type; pacing from snappy entrances and beat-snapped reveals, never from loudness.
- Angle: Every dev's GitHub looks the same — grey squares. PortfolioForge forges that raw public data into a crafted editorial portfolio. Show the actual flow: username in, Generate tap, portfolio out.
- Hook: "Your GitHub is not your portfolio." slamming in word by word.
- Outro / punchline: "PortfolioForge." logo slam, closer "A portfolio that reads like *you*.", URL, "FREE TO TRY · NO SIGN-UP NEEDED", bell over the fade.
- Avoid:
  - Generic SaaS language ("streamline your workflow" etc.)
  - Abstract filler visuals — every scene recreates a product moment or its exact palette/typography
  - Invented star counts, fake metrics, or claims not in the source material (repo cards show name + caption only)

## Visual Identity
- Background: #FBF8F1 (paper)
- Text: #211B13 (ink)
- Accent: #B4431F (terracotta rust)
- Supporting: #F4EEE1 (paper-2 cards), #E5D9C1 (hairlines), #6E6355 (muted), #AC9E86 (faint)
- Display font: Fraunces (vendored in composition/assets/fonts/)
- Body font: Space Grotesk (vendored)
- Mono: IBM Plex Mono (vendored)
- Visual references from the project: hairline rules top/bottom of scenes, mono kickers with letter-spacing, serif display headline with italic accent word, card borders in ink, `@` input prefix, demo-chip style theme swatches.

## Storyboard
Use the storyboard in `~/workspace/portfolioforge/brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook — 3.2s — "Your GitHub is not your portfolio." word slams on paper.
2. The one text box — 5.6s — recreated generator: "@ |" + typed "torvalds", Generate tap, "Forging portfolio…".
3. The forge result — 4.6s — editorial hero (Linus Torvalds) + 3 repo cards arriving beat-snapped.
4. Make it yours — 4.2s — "Ten themes. Six type pairings." + 6 swatches + final card "Download HTML · Save to account · Share a link".
5. Outro — 2.4s — logo slam, closer, URL, free note, bell over fade.

## Audio
- Audio role: warm bed with professional accents; motion-matched SFX.
- Audio arc: bed present from 0, building through typing/cards/swatches, swelling on the forge reveal, fading under the final bell in the outro.
- Music: `assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3` (already copied), data-volume 0.35, data-fade-out 1.5.
- Music treatment: fade under final logo; let final bell SFX ring over the music.
- Music cue guidance: bundled preset `~/workspace/skills/brag/assets/music/cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json`. Tempo 120.19 BPM. Beat grid (0–20s): 3.02, 3.52, 4.02, 4.53, 5.03, 5.53, 6.03, 6.52, 7.02, 7.52, 8.02, 8.52, 9.02, 9.52, 10.02, 10.52, 11.02, 11.52, 12.02, 12.52, 13.01, 13.51, 14.02, 14.52, 15.02, 15.52, 16.02, 16.52, 17.02, 17.52, 18.02, 18.52, 19.02, 19.52, 20.02. Strong cues: 17.52s, 18.02s, 18.52s, 20.02s.
- Audio-reactive treatment: subtle; use music RMS/bass to breathe the hero card presence / accent warmth. No waveform visuals.
- Audio-coupled moments:
  - Hook words — soft impact tick per word slam
  - Username typing — 8 keypresses (keypress-*.wav) matched to characters
  - Generate tap — click_001.ogg + card drop
  - Forge reveal — announcement swell
  - Repo cards — drop_001.ogg per card, beat-snapped (9.52 / 10.52 / 11.52)
  - Theme swatches — impactSoft_medium_002.ogg per swatch, beat-snapped (14.02→16.52)
  - Outro logo — impactBell_heavy_000.ogg at ~17.95
- SFX selection guidance: prefer the low high-frequency-risk files already vendored in composition/assets/sfx/ (same set as the proven banaobot run); see `<skill-dir>/assets/sfx/sfx-analysis.md`.
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: music already copied into `composition/assets/music/`; vendored SFX in `composition/assets/sfx/`.

## Hyperframes Instructions
Build the composition in `~/workspace/portfolioforge/brag-output/composition/` following this proven structure (mirrors the previously successful banaobot run):
- index.html with GSAP (vendored at `vendor/gsap.min.js` — no CDN), fonts linked from `assets/fonts/fonts.css`, one `#root` composition 1080x1920 data-duration 20, five `<section class="clip">` scenes with data-start/data-duration/data-track-index, one `<audio>` music tag (data-track-index 10) plus SFX `<audio>` tags (data-track-index 11+), and a single paused GSAP timeline registered on `window.__timelines["brag"]`.
- Scenes overlap visually like the banaobot version: absolute-positioned full-frame sections, hairline rules top/bottom, fast-in then hold, no scene-exit fades that could land on the poster frame.
- Requirements:
  - Show at least one real UI, copy, or visual element from the source project (the generator input card is the centerpiece).
  - Keep all text readable in the final render.
  - Total 20 seconds, vertical 1080x1920.
  - Include the music/SFX layer as specified.
  - Treat audio notes as guidance; choose SFX after the visual animation exists.
  - Beat-lock the outro logo slam to the 17.52s strong cue (within ±0.15s); snap sequential arrivals to the beat grid (±0.10s); prefer readability over beats when in doubt.
  - Use local assets only (fonts, GSAP, music, SFX all vendored).
  - Run `hyperframes check` before render — the single gate.
- Meta: hyperframes.json, meta.json, package.json mirror the banaobot composition (ids renamed to "portfolioforge-brag").

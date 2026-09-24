# PortfolioForge full redesign — design read (taste-skill §0.B, recorded 2026-09-24)

## Reading
Reading this as: **a portfolio-generation product for developers and creative
technologists**, with a restrained typography-led studio language, leaning toward
contemporary Swiss/editorial web design and quiet product tooling.

## Dials
- DESIGN_VARIANCE: 6 (a decisive break from the industrial forge era, still a product, not a manifesto)
- MOTION_INTENSITY: 3 (one motion vocabulary: fade + 16px rise, expo-out; a single authored generator intro)
- VISUAL_DENSITY: 3 (generous whitespace, sparse hairline rules, calm editorial rhythm)

## Direction (reference-informed)
- **Framer:** the product itself is the visual — restrained monochrome surfaces, one accent, tight display tracking (−0.04em), slim navigation, high-fidelity output previews.
- **Cargo:** the interface recedes and the real work leads; black-on-white restraint, minimal chrome.
- **Adobe Portfolio:** a small curated theme set where themes differ meaningfully through navigation, grid density, image ratio and typography — hence per-theme flourishes, not palette swaps.
- **Cyd Stumpel:** one flat accent, a cohesive motion grammar, work index first.
- **Adham Dannaway:** one complete conceptual hero idea rather than many effects — here: the live typographic portfolio specimen on the generator.
- **Tobias van Schneider:** project title, category, real imagery and useful captions create professionalism.
- **Stefan Vitasović:** normalize every project through one consistent presentation system so varied source material feels cohesive — the work index.

## Killed
Orange-on-black Vanta node field · industrial "forge" styling · stamps and spec
plates · oversized all-caps headings · generic feature-card grids · machine-room
dashboard aesthetics · decorative glass and animation that does not communicate ·
decorative Unicode icon glyphs (★/⑂) · decorative section/journey numbering theatre ·
repeated eyebrow labels · 8-theme palette-swap theming (now 8 designed worlds with
per-theme flourishes) · PFFX/Vanta/GSAP/Lenis runtime.

## Kept
GitHub username → portfolio generation · resume flow with privacy review · customize
drawer (now a body-level layer, fixing the header-overlap stacking bug) · auth gates ·
standalone offline HTML export with base64 fonts (works from file://) · save/share
view · 8 themes · 4 type systems · "1 star" pluralization · OAuth continuity in
js/backend.js (untouched) · zero CDN dependencies.

## Audit notes (anti-slop)
- Hero: one idea (name, tagline, portrait, availability) — no centered generic hero.
- Eyebrows: none repeated; section headlines stand on their own.
- Work: a single editorial index, not cards — title, kicker, excerpt, mono meta line.
- Motion: scroll reveals only, expo-out, 70ms staggers; hero intro runs once on the generator.
- Status dots: none decorative; "Open for work" is genuine state-driven copy.
- Drawer stacking: #drawer is a direct child of body, z-index 95 > nav 60; verified via elementFromPoint.

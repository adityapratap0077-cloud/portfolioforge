import sys, time, json, os
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765/index.html"
OUT = "/home/hatch/workspace/portfolioforge/preview/redesign"
GH = "/home/hatch/workspace/pf-qa/gh/aditya"
USER = "adityapratap0077-cloud"

def load(p):
    with open(p, encoding="utf-8", errors="replace") as f:
        return f.read()

CACHE = {
    f"/users/{USER}": ("application/json", load(f"{GH}/user.json")),
    f"/users/{USER}/repos?per_page=100&sort=updated": ("application/json", load(f"{GH}/repos.json")),
    f"/users/{USER}/events/public": ("application/json", load(f"{GH}/events.json")),
    f"/users/{USER}/social_accounts": ("application/json", load(f"{GH}/social.json")),
    f"/users/{USER}/repos?per_page=1&sort=created&direction=asc": ("application/json", load(f"{GH}/first.json")),
}
for fn in os.listdir(f"{GH}/readme"):
    if fn.endswith(".md"):
        repo = fn[:-3]
        CACHE[f"/repos/{USER}/{repo}/readme"] = ("text/plain", load(f"{GH}/readme/{fn}"))

def handle(route):
    url = route.request.url
    if "api.github.com" not in url:
        route.continue_(); return
    path = url.split("api.github.com", 1)[1]
    hit = None
    for k, v in CACHE.items():
        if path == k or (path.startswith(k.split("?")[0] + "?") and k.split("?")[0] in path):
            hit = v; break
    if hit:
        route.fulfill(status=200, content_type=hit[0], body=hit[1])
    else:
        route.fulfill(status=404, content_type="application/json", body='{"message":"not mocked"}')

errors = []

def new_page(p, **kw):
    browser = p.chromium.launch(
        executable_path="/home/hatch/.cache/ms-playwright/chromium-1243/chrome-linux/chrome",
        args=["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    ctx = browser.new_context(viewport=kw.get("viewport", {"width": 1440, "height": 900}),
                              reduced_motion=kw.get("reduced", "no-preference"))
    pg = ctx.new_page()
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.route("**/*", handle)
    return browser, pg

def shot(pg, name):
    pg.screenshot(path=f"{OUT}/{name}.png")
    print("shot", name, flush=True)

def libcheck(pg, label):
    info = pg.evaluate("""() => ({
        gsap: !!window.gsap, lenis: !!window.Lenis,
        three: !!window.THREE, vanta: !!window.VANTA,
        net: !!(window.VANTA && window.VANTA.NET),
        waves: !!(window.VANTA && window.VANTA.WAVES),
        pffx: !!window.PFFX,
        fxEl: !!document.querySelector('.pf-fx')
    })""")
    print(f"[{label}] libs={json.dumps(info)}", flush=True)

def overflow(pg, label):
    o = pg.evaluate("""() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        offenders: [...document.querySelectorAll('*')].filter(e => {
            const r = e.getBoundingClientRect();
            return r.width > window.innerWidth + 1 && r.width < 10000;
        }).slice(0,5).map(e => e.tagName + '.' + String(e.className).split(' ')[0])
    })""")
    print(f"[{label}] scrollW={o['scrollW']} clientW={o['clientW']} offenders={o['offenders']}", flush=True)

def generate(pg):
    pg.fill("#username-input", USER)
    pg.click("#panel-github button[type=submit]")
    pg.wait_for_selector("#view-portfolio:not([hidden]) #sec-hero", timeout=60000)
    pg.wait_for_timeout(2500)  # let vanta + gsap + count-up settle

with sync_playwright() as p:
    # ── 1. generator, desktop ──
    browser, pg = new_page(p)
    pg.goto(BASE, wait_until="load")
    pg.wait_for_timeout(2500)
    libcheck(pg, "generator")
    overflow(pg, "generator")
    shot(pg, "fx-generator")
    # ── 2. generate portfolio (default theme Drafting, light) ──
    generate(pg)
    libcheck(pg, "portfolio-drafting")
    overflow(pg, "portfolio-drafting")
    shot(pg, "fx-portfolio-drafting")
    # ── 3. nightshift theme (vanta NET) ──
    pg.evaluate("() => { window.PF.openDrawer(); }")
    pg.wait_for_timeout(800)
    shot(pg, "fx-drawer")
    pg.evaluate("""() => {
        const c = window.PF.getCust(); c.theme = 'nightshift';
        window.PF.applyCustomize();
    }""")
    pg.wait_for_timeout(2500)
    libcheck(pg, "portfolio-nightshift")
    shot(pg, "fx-portfolio-nightshift")
    # ── 4. signal theme (vanta WAVES) ──
    pg.evaluate("""() => {
        const c = window.PF.getCust(); c.theme = 'signal';
        window.PF.applyCustomize();
    }""")
    pg.wait_for_timeout(2500)
    shot(pg, "fx-portfolio-signal")
    pg.evaluate("() => window.PF.closeDrawer()")
    # ── 5. journey plural check ──
    pl = pg.evaluate("""() => [...document.querySelectorAll('.t-item')].map(e =>
        (e.querySelector('.t-title')||{}).textContent + ' | ' +
        ((e.querySelector('.t-detail')||{}).textContent||'').slice(0,90))""")
    print("[journey]", json.dumps(pl[:4], indent=1), flush=True)
    browser.close()

    # ── 6. mobile 390px ──
    browser, pg = new_page(p, viewport={"width": 390, "height": 844})
    pg.goto(BASE, wait_until="load")
    pg.wait_for_timeout(2000)
    shot(pg, "fx-generator-390")
    generate(pg)
    overflow(pg, "portfolio-390")
    shot(pg, "fx-portfolio-390")
    browser.close()

    # ── 7. reduced motion: no fx canvas, no lenis ──
    browser, pg = new_page(p, reduced="reduce")
    pg.goto(BASE, wait_until="load")
    pg.wait_for_timeout(1500)
    libcheck(pg, "reduced")
    shot(pg, "fx-generator-reduced")
    browser.close()

print("CONSOLE ERRORS:", json.dumps(errors[:20], indent=1), flush=True)

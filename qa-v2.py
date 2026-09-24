import sys, time, json, os, re
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765/index.html"
OUT = "/home/hatch/workspace/portfolioforge/preview/redesign"
GH = "/home/hatch/workspace/pf-qa/gh"
os.makedirs(OUT, exist_ok=True)

def load(p):
    with open(p, encoding="utf-8", errors="replace") as f:
        return f.read()

CACHE = {
    "/users/torvalds": ("application/json", load(f"{GH}/user.json")),
    "/users/torvalds/repos?per_page=100&sort=updated": ("application/json", load(f"{GH}/repos.json")),
    "/users/torvalds/events/public": ("application/json", load(f"{GH}/events.json")),
    "/users/torvalds/social_accounts": ("application/json", load(f"{GH}/social.json")),
    "/users/torvalds/repos?per_page=1&sort=created&direction=asc": ("application/json", load(f"{GH}/first.json")),
}
for repo in ["linux", "AudioNoise", "GuitarPedal", "uemacs", "test-tlb", "pesconvert"]:
    CACHE[f"/repos/torvalds/{repo}/readme"] = ("text/plain", load(f"{GH}/readme/{repo}.md"))

def handle(route):
    url = route.request.url
    path = url.split("api.github.com", 1)[1]
    hit = None
    for k, v in CACHE.items():
        if path == k or (path.startswith(k.split("?")[0] + "?") and k.split("?")[0] in path):
            hit = v
            break
    if hit:
        route.fulfill(status=200, content_type=hit[0], body=hit[1])
    else:
        route.fulfill(status=404, content_type="application/json", body='{"message":"not mocked"}')

errors = []
fail_urls = []
results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))
    print(("PASS " if cond else "FAIL ") + name + (" — " + detail if detail else ""), flush=True)

def overflow_info(page):
    return page.evaluate("""() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        offenders: [...document.querySelectorAll('*')].filter(e => {
            const r = e.getBoundingClientRect();
            return r.width > window.innerWidth + 1 && r.width < 10000;
        }).slice(0,5).map(e => e.tagName + '.' + String(e.className).split(' ')[0])
    })""")

def gen_portfolio(page):
    page.fill("#username-input", "torvalds")
    page.click("#panel-github button[type=submit]")
    page.wait_for_selector("#view-portfolio:not([hidden]) #sec-hero", timeout=60000)
    page.wait_for_function("() => (document.querySelector('#sec-hero')||{}).offsetHeight > 50", timeout=60000)
    page.evaluate("() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'))")
    page.wait_for_timeout(1500)

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path="/home/hatch/.cache/ms-playwright/chromium-1243/chrome-linux/chrome")
    page = browser.new_page()
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("requestfailed", lambda r: fail_urls.append(r.url))
    page.route("**/api.github.com/**", handle)

    # ── DESKTOP 1440 ──
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(1200)

    fonts = page.evaluate("""() => [...document.fonts].filter(f => /Clash|Zodiak/.test(f.family)).map(f => f.family + ' ' + f.weight + ' ' + f.status)""")
    check("clash+zodiak loaded", len(fonts) >= 6, "; ".join(sorted(set(fonts)))[:160])

    page.screenshot(path=f"{OUT}/v2-desktop-generator-hero.png")
    # specimen interactivity: theme cards
    page.click('.theme-card[data-theme-key="ink"]')
    page.wait_for_timeout(400)
    bg = page.evaluate("() => document.querySelector('.hero-specimen').style.getPropertyValue('--bg')")
    check("theme card previews on specimen", bg.strip().lower() == "#161310", bg)
    active = page.evaluate("() => document.querySelector('.theme-card.active').dataset.themeKey")
    check("theme card active state", active == "ink", active)
    cust_theme = page.evaluate("() => window.PF.getCust().theme")
    check("theme choice saved to cust", cust_theme == "ink", cust_theme)
    page.click('.theme-card[data-theme-key="paper"]')
    page.wait_for_timeout(300)
    # type rows
    page.click('.type-row[data-font-key="editorial"]')
    page.wait_for_timeout(400)
    df = page.evaluate("() => document.querySelector('.hero-specimen').dataset.font")
    check("type row previews on specimen", df == "editorial", df)
    cust_font = page.evaluate("() => window.PF.getCust().font")
    check("font choice saved to cust", cust_font == "editorial", cust_font)
    # scroll specimen into view for the shot (ink + editorial specimen)
    page.click('.theme-card[data-theme-key="forest"]')
    page.wait_for_timeout(300)
    page.evaluate("() => document.querySelector('.hero-specimen').scrollIntoView({block:'center'})")
    page.wait_for_timeout(400)
    page.screenshot(path=f"{OUT}/v2-desktop-specimen.png")
    page.evaluate("() => window.scrollTo(0,0)")

    # steps / themes / types sections
    for sel, name in [(".steps", "steps"), (".themes", "themes"), (".types", "types")]:
        page.evaluate(f"() => document.querySelector('{sel}').scrollIntoView({{block:'start'}})")
        page.wait_for_timeout(400)
        page.screenshot(path=f"{OUT}/v2-desktop-generator-{name}.png")
    page.evaluate("() => window.scrollTo(0,0)")

    ov = overflow_info(page)
    check("desktop generator: no horizontal overflow", ov["scrollW"] <= ov["clientW"] + 1, str(ov))

    # signed-out gate: customize button should prompt auth
    page.evaluate("() => window.PF.getCust && (localStorage.clear())")
    page.reload(wait_until="networkidle"); page.wait_for_timeout(800)

    # ── generate portfolio ──
    gen_portfolio(page)
    page.screenshot(path=f"{OUT}/v2-desktop-portfolio-hero.png", full_page=False)
    page.evaluate("() => document.querySelector('#sec-work').scrollIntoView()")
    page.wait_for_timeout(400)
    page.screenshot(path=f"{OUT}/v2-desktop-portfolio-work.png")
    page.evaluate("() => document.querySelector('.pf-footer').scrollIntoView({block:'center'})")
    page.wait_for_timeout(400)
    page.screenshot(path=f"{OUT}/v2-desktop-portfolio-footer.png")
    colophon = page.evaluate("() => document.querySelector('#footer-note').textContent")
    check("colophon mentions faces+theme+date", "Set in" in colophon and "theme. Printed" in colophon, colophon[:120])

    # all 8 themes x 4 fonts on the portfolio (hero strip each)
    themes = ["paper","ink","forest","cobalt","clay","slate","dusk","mono"]
    for t in themes:
        page.evaluate(f"() => {{ const c = window.PF.getCust(); c.theme = '{t}'; window.PF.applyCustomize(); }}")
        page.wait_for_timeout(350)
        page.evaluate("() => window.scrollTo(0,0)")
        page.screenshot(path=f"{OUT}/v2-theme-{t}.png")
    bthemes = page.evaluate("() => getComputedStyle(document.body).getPropertyValue('--bg').trim()")
    check("8 theme shots taken", True, f"last body --bg={bthemes}")
    for f in ["grotesk","editorial","technical","mono"]:
        page.evaluate(f"() => {{ const c = window.PF.getCust(); c.font = '{f}'; c.theme='paper'; window.PF.applyCustomize(); }}")
        page.wait_for_timeout(300)
        col = page.evaluate("() => document.querySelector('#footer-note').textContent")
        ok = ("Clash Display" in col) if f=="grotesk" else ("Zodiak" in col) if f=="editorial" else ("IBM Plex Mono" in col)
        check(f"colophon names {f} face", ok, col[:90])

    # signed-out gate: customize button should prompt auth (user is signed out)
    page.click("#customize-btn")
    page.wait_for_timeout(500)
    gate = page.evaluate("() => !document.querySelector('#auth-modal').hidden")
    check("signed-out customize opens auth gate", gate, "")
    page.keyboard.press("Escape"); page.wait_for_timeout(300)

    # drawer: open via PF API + stacking test (wait for the open transition)
    page.evaluate("() => window.PF.openDrawer()")
    page.wait_for_function("() => !document.querySelector('#drawer').hidden && document.querySelector('#drawer').classList.contains('open')", timeout=5000)
    page.wait_for_timeout(500)
    page.screenshot(path=f"{OUT}/v2-desktop-drawer.png")
    hit = page.evaluate("""() => {
        const b = document.querySelector('#drawer-close');
        const r = b.getBoundingClientRect();
        const el = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
        return el ? (el.id || el.className) : 'none';
    }""")
    check("drawer close on top (elementFromPoint)", hit == "drawer-close", str(hit))
    page.keyboard.press("Escape"); page.wait_for_timeout(300)

    # export: download via PF API, then open standalone via file://
    page.evaluate("() => { const c = window.PF.getCust(); c.theme='forest'; c.font='editorial'; window.PF.applyCustomize(); }")
    page.wait_for_timeout(400)
    with page.expect_download() as dl_info:
        page.evaluate("() => window.PF.downloadHTML()")
    dl = dl_info.value
    dl_path = f"{OUT}/v2-export-standalone.html"
    dl.save_as(dl_path)
    html = open(dl_path, encoding="utf-8").read()
    check("export downloaded", len(html) > 50000, f"{len(html)} bytes")
    check("export embeds fonts (no CDN)", "data:font/woff2" in html and "fonts.googleapis" not in html and "fonts.gstatic" not in html, "")
    check("export has colophon", "Set in" in html and "Zodiak" in html, "")
    check("export has forest+editorial rules", "--font-serif" in html and "font-style:italic" in html, "")

    # ── MOBILE 390 ──
    mob = browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    mob.on("console", lambda m: errors.append("[mob] " + m.text) if m.type == "error" else None)
    mob.on("pageerror", lambda e: errors.append("[mob] " + str(e)))
    mob.on("requestfailed", lambda r: fail_urls.append("[mob] " + r.url))
    mob.route("**/api.github.com/**", handle)
    mob.goto(BASE, wait_until="networkidle")
    mob.wait_for_timeout(1200)
    mob.screenshot(path=f"{OUT}/v2-mobile-generator-hero.png")
    mov = overflow_info(mob)
    check("mobile generator: no horizontal overflow", mov["scrollW"] <= mov["clientW"] + 1, str(mov))
    # specimen interactivity on mobile
    mob.evaluate("() => document.querySelector('.hero-specimen').scrollIntoView({block:'center'})")
    mob.wait_for_timeout(400)
    mob.screenshot(path=f"{OUT}/v2-mobile-specimen.png")
    gen_portfolio(mob)
    mob.evaluate("() => window.scrollTo(0,0)")
    mob.wait_for_timeout(400)
    mob.screenshot(path=f"{OUT}/v2-mobile-portfolio-hero.png")
    mobv = overflow_info(mob)
    check("mobile portfolio: no horizontal overflow", mobv["scrollW"] <= mobv["clientW"] + 1, str(mobv))

    # ── export via file:// ──
    fpage = browser.new_page(viewport={"width": 1440, "height": 900})
    fpage.on("console", lambda m: errors.append("[file] " + m.text) if m.type == "error" else None)
    fpage.on("pageerror", lambda e: errors.append("[file] " + str(e)))
    fpage.on("requestfailed", lambda r: fail_urls.append("[file] " + r.url))
    fpage.goto("file://" + dl_path, wait_until="networkidle")
    fpage.wait_for_timeout(1200)
    fpage.screenshot(path=f"{OUT}/v2-export-file.png")
    ffonts = fpage.evaluate("() => [...document.fonts].filter(f => /Clash|Zodiak/.test(f.family) && f.status==='loaded').length")
    ffaces = html.count("@font-face")
    check("file:// export embeds all faces", ffaces >= 11, f"{ffaces} @font-face blocks")
    check("file:// export loads used embedded fonts", ffonts >= 2, f"{ffonts} loaded")
    fcol = fpage.evaluate("() => document.querySelector('.pf-footer').textContent.slice(0,80)")
    check("file:// export renders footer", "Set in" in fcol, fcol[:60])

    browser.close()

print("\n==== console/page errors ====")
real_errors = [e for e in errors if "favicon" not in e.lower()]
for e in real_errors[:15]:
    print("ERR:", e[:220])
print(f"total errors: {len(real_errors)}")
print("---- failed request URLs ----")
seen = []
for u in fail_urls:
    if u not in seen:
        seen.append(u)
for u in seen[:15]:
    print("FAILURL:", u[:130])
fails = [r for r in results if not r[1]]
print(f"\n==== {len(results) - len(fails)}/{len(results)} checks passed ====")
# the sandbox blocks the Supabase CDN (jsdelivr); that failure is environmental,
# not a product bug — don't fail the run on it, but keep it reported above
actionable = [e for e in real_errors if "jsdelivr" not in e and "supabase" not in e.lower()]
sys.exit(1 if fails or actionable else 0)

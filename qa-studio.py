import sys, time, json, os
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765/index.html"
OUT = "/home/hatch/workspace/portfolioforge/preview/redesign"
GH = "/home/hatch/workspace/pf-qa/gh"

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

def gen_and_shoot(page, name, width):
    page.set_viewport_size({"width": width, "height": 900})
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(600)
    page.screenshot(path=f"{OUT}/{name}-generator.png")
    print(f"[{name}] generator shot", flush=True)
    page.fill("#username-input", "torvalds")
    page.click("#panel-github button[type=submit]")
    page.wait_for_selector("#view-portfolio:not([hidden]) #sec-hero", timeout=60000)
    page.wait_for_function("() => (document.querySelector('#sec-hero')||{}).offsetHeight > 50", timeout=60000)
    page.evaluate("() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'))")
    page.wait_for_timeout(1200)
    overflow = page.evaluate("""() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        offenders: [...document.querySelectorAll('*')].filter(e => {
            const r = e.getBoundingClientRect();
            return r.width > window.innerWidth + 1 && r.width < 10000;
        }).slice(0,5).map(e => e.tagName + '.' + String(e.className).split(' ')[0])
    })""")
    print(f"[{name}] overflow scrollW={overflow['scrollW']} clientW={overflow['clientW']} offenders={overflow['offenders']}", flush=True)
    hero = page.evaluate("""() => ({
        name: document.querySelector('#pf-name').textContent,
        tagline: document.querySelector('#pf-tagline').textContent.slice(0,70),
        theme: document.body.dataset.theme,
        font: document.body.dataset.font,
        workItems: document.querySelectorAll('.work-item').length,
        timeline: document.querySelectorAll('.t-item').length,
        journey: document.querySelectorAll('.journey li').length,
        stats: [...document.querySelectorAll('.stat-num')].map(e=>e.textContent),
        meta: [...document.querySelectorAll('#hero-meta li')].map(e=>e.textContent.trim()).join(' | '),
        statusHidden: document.querySelector('#pf-status').hidden
    })""")
    print(f"[{name}] hero={json.dumps(hero)}", flush=True)
    page.screenshot(path=f"{OUT}/{name}-portfolio.png", full_page=True)
    print(f"[{name}] portfolio shot", flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path="/home/hatch/.cache/ms-playwright/chromium-1243/chrome-linux/chrome",
        args=["--no-sandbox"])
    pg = browser.new_page()
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("requestfailed", lambda r: errors.append(f"REQFAIL {r.url[:90]} :: {r.failure}"))
    pg.route("**://api.github.com/**", handle)

    gen_and_shoot(pg, "desktop-1440", 1440)
    gen_and_shoot(pg, "mobile-390", 390)

    # drawer: open, verify stacking, customize shots, cycle all 8 themes + 4 fonts
    pg.set_viewport_size({"width": 1440, "height": 900})
    pg.goto(BASE, wait_until="networkidle")
    pg.fill("#username-input", "torvalds")
    pg.click("#panel-github button[type=submit]")
    pg.wait_for_selector("#view-portfolio:not([hidden]) #sec-hero", timeout=60000)
    pg.evaluate("() => window.PF.openDrawer()")
    pg.wait_for_timeout(700)
    drawer_state = pg.evaluate("""() => {
        const btn = document.querySelector('#drawer-close');
        const r = btn.getBoundingClientRect();
        const el = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
        return { el: el ? (el.id || el.tagName) : 'null', drawerVisible: !document.querySelector('#drawer').hidden,
                 drawerZ: getComputedStyle(document.querySelector('#drawer')).zIndex,
                 transform: getComputedStyle(btn).transform, filter: getComputedStyle(btn).filter };
    }""")
    print(f"[drawer] stacking={json.dumps(drawer_state)}", flush=True)
    pg.screenshot(path=f"{OUT}/customize-drawer.png")
    print("[drawer] shot", flush=True)
    swatches = pg.evaluate("() => [...document.querySelectorAll('#theme-swatches button[data-theme-key]')].map(b=>b.getAttribute('data-theme-key'))")
    fonts = pg.evaluate("() => [...document.querySelectorAll('#font-options button[data-font-key]')].map(b=>b.getAttribute('data-font-key'))")
    print(f"[themes] {json.dumps(swatches)}", flush=True)
    print(f"[fonts] {json.dumps(fonts)}", flush=True)
    for theme in swatches:
        pg.click(f"#theme-swatches button[data-theme-key='{theme}']")
        pg.wait_for_timeout(250)
        t = pg.evaluate("() => document.body.dataset.theme")
        if t != theme:
            print(f"[theme] MISMATCH clicked {theme} got {t}", flush=True)
        if theme in ("paper", "ink", "forest", "mono"):
            pg.screenshot(path=f"{OUT}/theme-{theme}.png")
    for f in fonts:
        pg.click(f"#font-options button[data-font-key='{f}']")
        pg.wait_for_timeout(250)
        got = pg.evaluate("() => document.querySelector('#view-portfolio').dataset.font")
        ff = pg.evaluate("() => getComputedStyle(document.querySelector('#pf-name')).fontFamily")
        if got != f:
            print(f"[font] MISMATCH clicked {f} got {got}", flush=True)
        else:
            print(f"[font] {f} -> {ff[:40]}", flush=True)
        if f in ("grotesk", "editorial"):
            pg.screenshot(path=f"{OUT}/font-{f}.png")
    pg.evaluate("() => window.PF.closeDrawer()")

    # download HTML capture
    try:
        with pg.expect_download() as dl_info:
            pg.evaluate("() => window.PF.downloadHTML()")
        dl = dl_info.value
        dl_path = f"{OUT}/download-test.html"
        dl.save_as(dl_path)
        html = open(dl_path, encoding="utf-8").read()
        print(f"[download] bytes={len(html)} work-item={'.work-item' in html} stamp={'.stamp' in html} "
              f"googlefonts={'fonts.googleapis' in html} base64font={'data:font' in html} filejs={'js/' in html} "
              f"hero-meta={'hero-meta' in html}", flush=True)
    except Exception as e:
        print(f"[download] FAILED: {e}", flush=True)

    # resume sample flow
    pg.goto(BASE, wait_until="networkidle")
    pg.click("#tab-resume")
    pg.click("#resume-sample-btn")
    pg.wait_for_timeout(500)
    pg.click("#resume-generate-btn")
    pg.wait_for_selector("#privacy-modal:not([hidden])", timeout=15000)
    pg.click("#privacy-confirm")
    pg.wait_for_selector("#view-portfolio:not([hidden]) #sec-hero", timeout=30000)
    pg.wait_for_timeout(1200)
    pg.evaluate("() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'))")
    rname = pg.evaluate("() => document.querySelector('#pf-name').textContent")
    print(f"[resume] name={rname}", flush=True)
    pg.screenshot(path=f"{OUT}/resume-sample.png", full_page=True)

    # error state
    pg.goto(BASE, wait_until="networkidle")
    pg.fill("#username-input", "no-such-user-xyz-123")
    pg.click("#panel-github button[type=submit]")
    pg.wait_for_selector("#view-error:not([hidden])", timeout=30000)
    etitle = pg.evaluate("() => document.querySelector('#error-title').textContent")
    print(f"[error] title={etitle}", flush=True)
    pg.screenshot(path=f"{OUT}/error-state.png")

    # exportCSS sanity
    pg.goto(BASE, wait_until="networkidle")
    css = pg.evaluate("() => window.PF.exportCSS()")
    print(f"[exportCSS] len={len(css)} work-item={'.work-item' in css} stamp={'.stamp' in css} btn-forge={'.btn-forge' in css}", flush=True)

    browser.close()
print("CONSOLE ERRORS:", json.dumps(errors[:20], indent=1) if errors else "none")
print("QA DONE", flush=True)

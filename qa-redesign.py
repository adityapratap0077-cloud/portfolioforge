import sys, time, json, os, re
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
    page.wait_for_timeout(800)
    page.screenshot(path=f"{OUT}/{name}-generator.png")
    print(f"[{name}] generator shot", flush=True)
    page.fill("#username-input", "torvalds")
    page.click("#panel-github button[type=submit]")
    page.wait_for_selector("#view-portfolio:not([hidden]) #sec-hero", timeout=60000)
    page.wait_for_function("() => (document.querySelector('#sec-hero')||{}).offsetHeight > 50", timeout=60000)
    page.evaluate("() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'))")
    page.wait_for_timeout(2000)
    page.evaluate("""() => new Promise(res => {
        let y = 0; const h = document.body.scrollHeight;
        const t = setInterval(() => { y += 700; window.scrollTo(0, y);
            if (y >= h) { clearInterval(t); window.scrollTo(0,0); res(); } }, 120);
    })""")
    page.wait_for_timeout(1000)
    overflow = page.evaluate("""() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        offenders: [...document.querySelectorAll('*')].filter(e => {
            const r = e.getBoundingClientRect();
            return r.width > window.innerWidth + 1 && r.width < 10000;
        }).slice(0,5).map(e => e.tagName + '.' + String(e.className).split(' ')[0])
    })""")
    print(f"[{name}] scrollW={overflow['scrollW']} clientW={overflow['clientW']} offenders={overflow['offenders']}", flush=True)
    hero = page.evaluate("""() => ({
        name: document.querySelector('#pf-name').textContent,
        tagline: document.querySelector('#pf-tagline').textContent.slice(0,60),
        stamp: document.querySelector('#pf-status').hidden,
        theme: document.body.dataset.theme,
        workCards: document.querySelectorAll('.work-card').length,
        timelineItems: document.querySelectorAll('.t-item').length,
        stats: [...document.querySelectorAll('.stat-num')].map(e=>e.textContent)
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
    pg.route("**://api.github.com/**", handle)
    gen_and_shoot(pg, "desktop-1440", 1440)
    gen_and_shoot(pg, "mobile-390", 390)

    # theme switching via drawer (bypass auth gate by calling PF.openDrawer directly)
    pg.set_viewport_size({"width": 1440, "height": 900})
    pg.goto(BASE, wait_until="networkidle")
    pg.fill("#username-input", "torvalds")
    pg.click("#panel-github button[type=submit]")
    pg.wait_for_selector("#view-portfolio:not([hidden]) #sec-hero", timeout=60000)
    pg.evaluate("() => window.PF.openDrawer()")
    pg.wait_for_timeout(500)
    try:
        for theme in ["blueprint", "nightshift", "signal", "carbon"]:
            pg.click(f"#theme-swatches button[data-theme-key='{theme}']")
            pg.wait_for_timeout(400)
            t = pg.evaluate("() => document.body.dataset.theme")
            print(f"[theme] clicked {theme} -> body data-theme={t}", flush=True)
            pg.screenshot(path=f"{OUT}/theme-{theme}.png")
    except Exception as e:
        print(f"[theme] FAILED: {e}", flush=True)
    pg.evaluate("() => window.PF.closeDrawer()")

    # download HTML capture
    try:
        with pg.expect_download() as dl_info:
            pg.evaluate("() => window.PF.downloadHTML()")
        dl = dl_info.value
        dl_path = f"{OUT}/download-test.html"
        dl.save_as(dl_path)
        html = open(dl_path, encoding="utf-8").read()
        print(f"[download] bytes={len(html)} has-work-card={'.work-card' in html} has-grain={'grain' in html} has-googlefonts={'fonts.googleapis' in html}", flush=True)
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
    pg.wait_for_timeout(1500)
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
    print(f"[exportCSS] len={len(css)} has-work-card={'.work-card' in css} has-grain={'grain' in css} has-stamp={'.stamp' in css}", flush=True)

    browser.close()
print("CONSOLE ERRORS:", json.dumps(errors[:20], indent=1) if errors else "none")
print("QA DONE", flush=True)

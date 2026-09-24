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

def generate(page):
    page.fill("#username-input", USER)
    page.click("#panel-github button[type=submit]")
    page.wait_for_selector("#view-portfolio:not([hidden]) #sec-hero", timeout=60000)
    page.wait_for_function("() => (document.querySelector('#sec-hero')||{}).offsetHeight > 50", timeout=60000)
    page.evaluate("() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'))")
    page.wait_for_timeout(1500)
    page.evaluate("""() => new Promise(res => {
        let y = 0; const h = document.body.scrollHeight;
        const t = setInterval(() => { y += 700; window.scrollTo(0, y);
            if (y >= h) { clearInterval(t); window.scrollTo(0,0); res(); } }, 120);
    })""")
    page.wait_for_timeout(1000)

def diagnostics(page, label):
    overflow = page.evaluate("""() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        offenders: [...document.querySelectorAll('*')].filter(e => {
            const r = e.getBoundingClientRect();
            return r.width > window.innerWidth + 1 && r.width < 10000;
        }).slice(0,5).map(e => e.tagName + '.' + String(e.className).split(' ')[0])
    })""")
    print(f"[{label}] scrollW={overflow['scrollW']} clientW={overflow['clientW']} offenders={overflow['offenders']}", flush=True)
    hero = page.evaluate("""() => ({
        name: (document.querySelector('#pf-name')||{}).textContent,
        tagline: ((document.querySelector('#pf-tagline')||{}).textContent||'').slice(0,80),
        stampHidden: (document.querySelector('#pf-status')||{}).hidden,
        theme: document.body.dataset.theme,
        workCards: document.querySelectorAll('.work-card').length,
        timelineItems: document.querySelectorAll('.t-item').length,
        stats: [...document.querySelectorAll('.stat-num')].map(e=>e.textContent)
    })""")
    print(f"[{label}] hero={json.dumps(hero)}", flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path="/home/hatch/.cache/ms-playwright/chromium-1243/chrome-linux/chrome",
        args=["--no-sandbox"])
    pg = browser.new_page()
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.route("**://api.github.com/**", handle)

    # 1) desktop drafting
    pg.set_viewport_size({"width": 1440, "height": 900})
    pg.goto(BASE, wait_until="networkidle")
    pg.wait_for_timeout(800)
    generate(pg)
    diagnostics(pg, "aditya-desktop-drafting")
    pg.screenshot(path=f"{OUT}/aditya-desktop-drafting.png", full_page=True)
    print("[aditya-desktop-drafting] shot", flush=True)

    # 2) mobile drafting
    pg.set_viewport_size({"width": 390, "height": 844})
    pg.goto(BASE, wait_until="networkidle")
    pg.wait_for_timeout(800)
    generate(pg)
    diagnostics(pg, "aditya-mobile")
    pg.screenshot(path=f"{OUT}/aditya-mobile.png", full_page=True)
    print("[aditya-mobile] shot", flush=True)

    # 3) nightshift + customize drawer open
    pg.set_viewport_size({"width": 1440, "height": 900})
    pg.goto(BASE, wait_until="networkidle")
    pg.wait_for_timeout(800)
    generate(pg)
    pg.evaluate("() => window.PF.openDrawer()")
    pg.wait_for_timeout(500)
    pg.click("#theme-swatches button[data-theme-key='nightshift']")
    pg.wait_for_timeout(500)
    t = pg.evaluate("() => document.body.dataset.theme")
    print(f"[aditya-nightshift] body data-theme={t}", flush=True)
    diagnostics(pg, "aditya-nightshift-customize")
    pg.screenshot(path=f"{OUT}/aditya-nightshift-customize.png")
    print("[aditya-nightshift-customize] shot", flush=True)

    browser.close()
print("CONSOLE ERRORS:", json.dumps(errors[:20], indent=1) if errors else "none")
print("QA DONE", flush=True)

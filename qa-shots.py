import sys, time, json, os, re
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765/index.html"
OUT = "/home/hatch/workspace/pf-qa"
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
        if path == k or path.startswith(k.split("?")[0] + "?") and k.split("?")[0] in path:
            hit = v
            break
    if hit:
        route.fulfill(status=200, content_type=hit[0], body=hit[1])
    else:
        route.fulfill(status=404, content_type="application/json", body='{"message":"not mocked"}')

def gen_and_shoot(page, name, width):
    page.set_viewport_size({"width": width, "height": 900})
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(800)
    page.fill("#username-input", "torvalds")
    page.click("#panel-github button.btn-primary[type=submit]")
    # wait for the portfolio view to render (hero exists and has size)
    page.wait_for_selector("#sec-hero", state="attached", timeout=60000)
    page.wait_for_function("() => (document.querySelector('#sec-hero')||{}).offsetHeight > 50", timeout=60000)
    # force-reveal everything so screenshots capture final state
    page.evaluate("() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'))")
    page.wait_for_timeout(2500)
    # scroll through to trigger reveals
    page.evaluate("""() => new Promise(res => {
        let y = 0; const h = document.body.scrollHeight;
        const t = setInterval(() => { y += 600; window.scrollTo(0, y);
            if (y >= h) { clearInterval(t); window.scrollTo(0,0); res(); } }, 120);
    })""")
    page.wait_for_timeout(1200)
    overflow = page.evaluate("""() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        offenders: [...document.querySelectorAll('*')].filter(e => {
            const r = e.getBoundingClientRect();
            return r.width > window.innerWidth + 1 && r.width < 10000;
        }).slice(0,5).map(e => e.tagName + '.' + (e.className.baseVal !== undefined ? '' : String(e.className).split(' ')[0]))
    })""")
    print(f"[{name}] scrollW={overflow['scrollW']} clientW={overflow['clientW']} offenders={overflow['offenders']}", flush=True)
    page.screenshot(path=f"{OUT}/{name}.png", full_page=True)
    print(f"[{name}] saved", flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path="/home/hatch/.cache/ms-playwright/chromium-1243/chrome-linux/chrome",
        args=["--no-sandbox"])
    pg = browser.new_page()
    pg.route("**://api.github.com/**", handle)
    gen_and_shoot(pg, "desktop-1440", 1440)

    # auth modal screenshot (desktop)
    pg.set_viewport_size({"width": 1440, "height": 900})
    pg.goto(BASE, wait_until="networkidle")
    pg.wait_for_timeout(1000)
    btn = pg.query_selector("#auth-area button")
    if btn:
        print("auth button text:", btn.inner_text(), flush=True)
        btn.click()
        pg.wait_for_timeout(800)
        gbtn = pg.query_selector("#auth-google, [id*=google i]")
        print("google btn found:", bool(gbtn), flush=True)
        if gbtn:
            print("google btn text:", gbtn.inner_text().strip(), flush=True)
        pg.screenshot(path=f"{OUT}/auth-modal.png")
        print("[auth-modal] saved", flush=True)
    else:
        print("NO auth button found in #auth-area", flush=True)
        print("auth-area html:", pg.inner_html("#auth-area")[:500], flush=True)

    gen_and_shoot(pg, "mobile-390", 390)
    browser.close()
print("QA DONE", flush=True)

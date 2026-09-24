import os, json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765/index.html"
OUT = "/home/hatch/workspace/portfolioforge/preview/redesign"
GH = "/home/hatch/workspace/pf-qa/gh/aditya"
USER = "adityapratap0077-cloud"

def load(p):
    return open(p, encoding="utf-8", errors="replace").read()

CACHE = {
    f"/users/{USER}": load(f"{GH}/user.json"),
    f"/users/{USER}/repos?per_page=100&sort=updated": load(f"{GH}/repos.json"),
    f"/users/{USER}/events/public": load(f"{GH}/events.json"),
    f"/users/{USER}/social_accounts": load(f"{GH}/social.json"),
    f"/users/{USER}/repos?per_page=1&sort=created&direction=asc": load(f"{GH}/first.json"),
}
for fn in os.listdir(f"{GH}/readme"):
    if fn.endswith(".md"):
        CACHE[f"/repos/{USER}/{fn[:-3]}/readme"] = load(f"{GH}/readme/{fn}")

def handle(route):
    url = route.request.url
    if "api.github.com" not in url:
        route.continue_(); return
    path = url.split("api.github.com", 1)[1]
    hit = next((v for k, v in CACHE.items() if path == k or path.startswith(k.split("?")[0] + "?")), None)
    if hit:
        route.fulfill(status=200, content_type="text/plain", body=hit)
    else:
        route.fulfill(status=404, content_type="application/json", body='{"message":"not mocked"}')

errors = []
CHROME = "/home/hatch/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"

def launch(p, **kw):
    b = p.chromium.launch(executable_path=CHROME,
        args=["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    ctx = b.new_context(viewport=kw.get("vp", {"width": 1440, "height": 900}),
                        reduced_motion=kw.get("reduced", "no-preference"))
    pg = ctx.new_page()
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.route("**/*", handle)
    return b, pg

with sync_playwright() as p:
    b, pg = launch(p)
    pg.goto(BASE, wait_until="load")
    pg.wait_for_timeout(2500)
    print("[gen] view =", pg.evaluate("() => document.body.getAttribute('data-view')"),
          "fx =", pg.evaluate("() => !!document.querySelector('.pf-fx')"))
    pg.screenshot(path=f"{OUT}/fx-generator.png"); print("shot fx-generator", flush=True)

    # resume flow via sample
    pg.click("#tab-resume")
    pg.wait_for_timeout(400)
    pg.screenshot(path=f"{OUT}/fx-resume-tab.png")
    pg.click("#resume-sample-btn")
    pg.wait_for_timeout(600)
    pg.click("#resume-generate-btn")
    pg.wait_for_selector("#view-portfolio:not([hidden]) #sec-hero", timeout=30000)
    pg.wait_for_timeout(2000)
    print("[resume] name =", pg.evaluate("() => document.querySelector('#pf-name').textContent"),
          "stats =", pg.evaluate("() => [...document.querySelectorAll('.stat-num')].map(e=>e.textContent).join(',')"))
    pg.screenshot(path=f"{OUT}/fx-resume-portfolio.png"); print("shot fx-resume-portfolio", flush=True)
    pg.click("#startover-btn")
    pg.wait_for_timeout(800)

    # github flow + brass NET
    pg.fill("#username-input", USER)
    pg.click("#panel-github button[type=submit]")
    pg.wait_for_selector("#view-portfolio:not([hidden]) #sec-hero", timeout=60000)
    pg.wait_for_timeout(2000)
    pg.evaluate("() => { const c = window.PF.getCust(); c.theme = 'brass'; window.PF.applyCustomize(); }")
    pg.wait_for_timeout(2200)
    pg.screenshot(path=f"{OUT}/fx-portfolio-brass.png"); print("shot fx-portfolio-brass", flush=True)

    # count-up landed values
    print("[countup] stats =", pg.evaluate("() => [...document.querySelectorAll('.stat-num')].map(e=>e.textContent).join(',')"))
    b.close()

    # reduced motion re-check
    b, pg = launch(p, reduced="reduce")
    pg.goto(BASE, wait_until="load")
    pg.wait_for_timeout(1800)
    print("[reduced] fx =", pg.evaluate("() => !!document.querySelector('.pf-fx')"),
          "view =", pg.evaluate("() => document.body.getAttribute('data-view')"))
    pg.screenshot(path=f"{OUT}/fx-generator-reduced.png"); print("shot fx-generator-reduced", flush=True)
    b.close()

    # view.html error shell
    b, pg = launch(p)
    pg.goto("http://localhost:8765/view.html#/nope", wait_until="load")
    pg.wait_for_timeout(2000)
    print("[view-err] visible =", pg.evaluate("() => { const e = document.querySelector('#view-error'); return e && !e.hidden; }"),
          "title =", (pg.evaluate("() => (document.querySelector('#view-error h1')||{}).textContent") or "")[:50])
    pg.screenshot(path=f"{OUT}/fx-view-error.png"); print("shot fx-view-error", flush=True)
    b.close()

print("ERRORS (non-supabase):", json.dumps([e for e in errors if "supabase" not in e.lower() and "EMPTY_RESPONSE" not in e][:10], indent=1), flush=True)

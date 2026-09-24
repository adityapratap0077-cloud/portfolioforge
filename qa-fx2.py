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

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path="/home/hatch/.cache/ms-playwright/chromium-1243/chrome-linux/chrome",
        args=["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    pg = browser.new_page(viewport={"width": 1440, "height": 900})
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.route("**/*", handle)

    # generator with dark nav fix
    pg.goto(BASE, wait_until="load")
    pg.wait_for_timeout(2500)
    print("[gen] data-view =", pg.evaluate("() => document.body.getAttribute('data-view')"))
    pg.screenshot(path=f"{OUT}/fx-generator.png")
    print("shot fx-generator", flush=True)

    # generate, then cycle the dark/atmosphere themes
    pg.fill("#username-input", USER)
    pg.click("#panel-github button[type=submit]")
    pg.wait_for_selector("#view-portfolio:not([hidden]) #sec-hero", timeout=60000)
    pg.wait_for_timeout(2000)

    for theme, shot in [("signal", "fx-portfolio-signal"), ("blueprint", "fx-portfolio-blueprint"),
                        ("carbon", "fx-portfolio-carbon"), ("brass", "fx-portfolio-brass"),
                        ("steel", "fx-portfolio-steel"), ("chalk", "fx-portfolio-chalk"),
                        ("drafting", "fx-portfolio-drafting")]:
        pg.evaluate(f"""() => {{ const c = window.PF.getCust(); c.theme = '{theme}';
            window.PF.applyCustomize(); }}""")
        pg.wait_for_timeout(2200)
        fx = pg.evaluate("() => !!document.querySelector('.pf-fx')")
        print(f"[{theme}] fxEl={fx} theme={pg.evaluate('() => document.body.dataset.theme')}", flush=True)
        pg.screenshot(path=f"{OUT}/{shot}.png")
        print("shot", shot, flush=True)

    # auth gate still intact
    gate = pg.evaluate("""() => ({
        customizeLocked: document.querySelector('#btn-customize').classList.contains('locked'),
        dlLocked: document.querySelector('#btn-download').classList.contains('locked')
    })""")
    print("[gates]", json.dumps(gate), flush=True)
    browser.close()

print("CONSOLE ERRORS:", json.dumps([e for e in errors if "supabase" not in e.lower() and "ERR_EMPTY" not in e][:10], indent=1), flush=True)

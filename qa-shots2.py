import json, os
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
    path = route.request.url.split("api.github.com", 1)[1]
    for k, v in CACHE.items():
        if path == k:
            route.fulfill(status=200, content_type=v[0], body=v[1])
            return
    route.fulfill(status=404, content_type="application/json", body='{}')

EXE = "/home/hatch/.cache/ms-playwright/chromium-1243/chrome-linux/chrome"

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=EXE, args=["--no-sandbox"])

    # ── A: resume-generated portfolio at mobile width ──
    pg = browser.new_page(viewport={"width": 390, "height": 900})
    pg.route("**://api.github.com/**", handle)
    pg.goto(BASE, wait_until="domcontentloaded")
    pg.wait_for_timeout(1000)
    pg.click("#tab-resume")
    pg.wait_for_timeout(400)
    pg.click("#resume-sample-btn")
    pg.wait_for_timeout(600)
    pg.click("#resume-generate-btn")
    pg.wait_for_selector("#sec-hero", state="attached", timeout=30000)
    pg.wait_for_timeout(2500)
    pg.evaluate("() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'))")
    ov = pg.evaluate("() => ({s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth})")
    print("[resume-mobile] scrollW=%s clientW=%s" % (ov["s"], ov["c"]), flush=True)
    pg.screenshot(path=f"{OUT}/resume-mobile-390.png", full_page=True)
    print("[resume-mobile] saved", flush=True)

    # ── B: theme switching on desktop (github portfolio) ──
    pg.set_viewport_size({"width": 1440, "height": 900})
    pg.goto(BASE, wait_until="domcontentloaded")
    pg.wait_for_timeout(800)
    pg.fill("#username-input", "torvalds")
    pg.click("#panel-github button.btn-primary[type=submit]")
    pg.wait_for_selector("#sec-hero", state="attached", timeout=60000)
    pg.wait_for_timeout(2500)
    pg.evaluate("() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'))")
    # open customize drawer and pick theme 2 (Emerald Noir)
    pg.click("#customize-btn")
    pg.wait_for_timeout(600)
    theme_btns = pg.query_selector_all("[data-theme]")
    print("[themes] theme buttons found:", len(theme_btns), flush=True)
    if len(theme_btns) >= 2:
        theme_btns[1].click()
        pg.wait_for_timeout(800)
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(400)
    pg.evaluate("() => window.scrollTo(0, 0)")
    pg.wait_for_timeout(600)
    pg.screenshot(path=f"{OUT}/theme-emerald.png")
    print("[theme-emerald] saved", flush=True)
    # font + density controls present?
    print("[customize] font opts:", pg.eval_on_selector_all("[data-font]", "e=>e.length"),
          "density opts:", pg.eval_on_selector_all("[data-density]", "e=>e.length"), flush=True)

    # ── C: standalone HTML export → render it ──
    with pg.expect_download() as dl_info:
        pg.click("#download-btn")
    dl = dl_info.value
    exp_path = f"{OUT}/export-standalone.html"
    dl.save_as(exp_path)
    print("[export] downloaded bytes:", os.path.getsize(exp_path), flush=True)
    pg2 = browser.new_page(viewport={"width": 1440, "height": 900})
    pg2.goto("file://" + exp_path, wait_until="domcontentloaded")
    pg2.wait_for_timeout(1500)
    pg2.evaluate("() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'))")
    pg2.screenshot(path=f"{OUT}/export-desktop.png", full_page=True)
    print("[export-desktop] saved", flush=True)
    pg3 = browser.new_page(viewport={"width": 390, "height": 900})
    pg3.goto("file://" + exp_path, wait_until="domcontentloaded")
    pg3.wait_for_timeout(1500)
    pg3.evaluate("() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'))")
    ov3 = pg3.evaluate("() => ({s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth})")
    print("[export-mobile] scrollW=%s clientW=%s" % (ov3["s"], ov3["c"]), flush=True)
    pg3.screenshot(path=f"{OUT}/export-mobile.png", full_page=True)
    print("[export-mobile] saved", flush=True)

    browser.close()
print("QA2 DONE", flush=True)

/* PortfolioForge — public read-only portfolio page (view.html?token=...).
 * Requires app.js (window.PF) and js/supabase-client.js (window.PFSB).
 * Strips all editor chrome, then loads the shared portfolio by token.
 */
(function () {
  "use strict";
  if (!window.PF || !window.PFSB) return;
  var PF = window.PF;
  function $(id) { return document.getElementById(id); }

  /* strip every editing/account element — this page is read-only */
  var nav = document.querySelector(".site-nav");
  if (nav) nav.remove();
  var authArea = $("auth-area");
  if (authArea) authArea.remove();
  var toolbar = document.querySelector(".toolbar");
  if (toolbar) toolbar.remove();
  ["drawer", "drawer-scrim", "auth-modal", "save-modal"].forEach(function (id) {
    var e = $(id);
    if (e) e.remove();
  });

  function fail(title, msg) {
    ["view-generator", "view-dashboard", "view-loading", "view-error", "view-portfolio"].forEach(function (id) {
      var e = $(id);
      if (e) e.hidden = true;
    });
    var t = $("viewpage-error-title"), m = $("viewpage-error-msg"), box = $("viewpage-error");
    if (t) t.textContent = title;
    if (m) m.textContent = msg;
    if (box) box.hidden = false;
  }

  PF.show("loading");

  var token = null;
  try { token = new URLSearchParams(window.location.search).get("token"); } catch (e) { token = null; }

  if (!token) {
    fail("Link not found", "This share link is missing its token. Ask the portfolio owner for a fresh link.");
    return;
  }
  if (!window.PFSB.configured()) {
    fail("Backend not connected", "This shared portfolio needs its backend configured. The owner hasn't connected Supabase yet.");
    return;
  }
  window.PFSB.ensure().then(function (c) {
    if (!c) {
      fail("Couldn't load the backend", "The Supabase library failed to load. Check your connection and try again.");
      return null;
    }
    /* Public reads go through a narrow SECURITY DEFINER RPC that only
       returns a row when it is public AND the exact share token matches.
       There is no direct anonymous select on the table, so public
       portfolios cannot be enumerated. */
    return c.rpc("get_public_portfolio", { p_token: token }).maybeSingle();
  }).then(function (res) {
    if (!res || res.error || !res.data) {
      fail("Link not found", "This portfolio doesn't exist, isn't public, or the link is wrong.");
      return;
    }
    var pd = res.data.portfolio_data || {};
    var ok = PF.setSource({ type: pd.type, ref: pd.ref, data: pd.data }, pd.customization);
    if (!ok) {
      fail("Couldn't open this portfolio", "The saved data looks corrupted. Ask the owner to re-save it.");
      return;
    }
    document.title = (res.data.title || "Portfolio") + " — PortfolioForge";
    PF.show("portfolio");
    window.scrollTo(0, 0);
  }).catch(function (err) {
    fail("Couldn't load this portfolio", (err && err.message) || "Something went wrong — try again.");
  });
})();

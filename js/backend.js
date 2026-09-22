/* PortfolioForge — auth, saving and dashboard (optional Supabase backend).
 * Requires app.js (window.PF) and js/supabase-client.js (window.PFSB).
 * If Supabase isn't configured, the generator keeps working untouched and
 * the dashboard shows setup instructions instead of data.
 */
(function () {
  "use strict";
  if (!window.PF || !window.PFSB) return;
  var PF = window.PF;

  var sb = null;
  var user = null;
  var authMode = "signin";
  var currentSavedId = null;   // id of the dashboard entry currently open
  var dashboardOpen = false;

  /* ── tiny helpers ── */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function showModal(id) { var m = $(id); if (m) m.hidden = false; }
  function hideModal(id) { var m = $(id); if (m) m.hidden = true; }
  function hideEl(id) { var e = $(id); if (e) e.hidden = true; }
  function setBusy(btn, busy, label) {
    if (!btn) return;
    btn.disabled = !!busy;
    if (busy) { btn.dataset.label = btn.textContent; btn.textContent = "Working…"; }
    else if (btn.dataset.label) btn.textContent = btn.dataset.label;
  }
  function randToken() {
    var a = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(a);
    else for (var i = 0; i < 16; i++) a[i] = Math.floor(Math.random() * 256);
    var out = "";
    for (var j = 0; j < a.length; j++) out += ("0" + a[j].toString(16)).slice(-2);
    return out;
  }
  function shareUrl(token) {
    var base = location.href.split(/[?#]/)[0].replace(/index\.html?$/i, "");
    if (base.charAt(base.length - 1) !== "/") base += "/";
    return base + "view.html?token=" + token;
  }
  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
    catch (e) { return ""; }
  }
  function ensureClient(cb) {
    window.PFSB.ensure().then(function (c) {
      sb = c;
      if (!c) { PF.toast("Backend isn't configured yet — see the Dashboard setup steps"); return; }
      cb();
    }).catch(function (err) { PF.toast(err && err.message ? err.message : "Couldn't reach the backend"); });
  }

  /* ── header auth area ── */
  function userLabel() {
    if (!user) return "";
    var meta = user.user_metadata || {};
    return meta.display_name || (user.email ? user.email.split("@")[0] : "Account");
  }
  function renderAuthArea() {
    var area = $("auth-area");
    if (!area) return;
    area.innerHTML = "";
    if (!window.PFSB.configured()) {
      var setup = document.createElement("button");
      setup.type = "button";
      setup.className = "btn-ghost sm";
      setup.textContent = "Connect backend";
      setup.title = "Set up Supabase to unlock accounts, saving and sharing";
      setup.addEventListener("click", openDashboard);
      area.appendChild(setup);
      return;
    }
    if (user) {
      var chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = userLabel();
      chip.title = user.email || "";
      var out = document.createElement("button");
      out.type = "button";
      out.className = "btn-ghost sm";
      out.textContent = "Sign out";
      out.addEventListener("click", signOut);
      area.appendChild(chip);
      area.appendChild(out);
    } else {
      var inBtn = document.createElement("button");
      inBtn.type = "button";
      inBtn.className = "btn-ghost sm";
      inBtn.textContent = "Sign in";
      inBtn.addEventListener("click", function () { openAuth("signin"); });
      var upBtn = document.createElement("button");
      upBtn.type = "button";
      upBtn.className = "btn-primary sm";
      upBtn.textContent = "Create account";
      upBtn.addEventListener("click", function () { openAuth("signup"); });
      area.appendChild(inBtn);
      area.appendChild(upBtn);
    }
  }

  /* ── auth modal ── */
  function openAuth(mode) {
    setAuthMode(mode || "signin");
    hideEl("auth-error");
    var f = $("auth-form");
    if (f) f.reset();
    showModal("auth-modal");
    setTimeout(function () { var e = $("auth-email"); if (e) e.focus(); }, 60);
  }
  function setAuthMode(mode) {
    authMode = mode;
    var si = $("auth-tab-signin"), su = $("auth-tab-signup");
    if (si) si.classList.toggle("active", mode === "signin");
    if (su) su.classList.toggle("active", mode === "signup");
    var t = $("auth-title"), sub = $("auth-sub"), btn = $("auth-submit"), nm = $("auth-name-row");
    if (t) t.textContent = mode === "signin" ? "Sign in" : "Create account";
    if (sub) sub.textContent = mode === "signin"
      ? "Welcome back — your saved portfolios are waiting."
      : "One account keeps every portfolio you forge, ready to share.";
    if (btn) btn.textContent = mode === "signin" ? "Sign in" : "Create account";
    if (nm) nm.hidden = mode === "signin";
  }
  function authFail(msg) {
    var e = $("auth-error");
    if (e) { e.textContent = msg; e.hidden = false; }
  }
  function doAuth() {
    var email = $("auth-email").value.trim();
    var password = $("auth-password").value;
    var name = $("auth-name").value.trim();
    var btn = $("auth-submit");
    if (!email || !password) { authFail("Enter your email and password."); return; }
    setBusy(btn, true);
    hideEl("auth-error");
    function done(err) {
      setBusy(btn, false);
      if (err) { authFail(err.message || "Something went wrong — try again."); return; }
      hideModal("auth-modal");
      PF.toast(authMode === "signin" ? "Signed in" : "Account created — welcome");
    }
    if (authMode === "signin") {
      sb.auth.signInWithPassword({ email: email, password: password }).then(function (res) { done(res.error); });
    } else {
      sb.auth.signUp({
        email: email, password: password,
        options: { data: { display_name: name || email.split("@")[0] } }
      }).then(function (res) {
        if (res.error) { done(res.error); return; }
        ensureProfile(res.data && res.data.user);
        done(null);
      });
    }
  }
  function signOut() {
    ensureClient(function () {
      sb.auth.signOut().then(function () {
        user = null;
        currentSavedId = null;
        renderAuthArea();
        if (dashboardOpen) renderDashboard();
        PF.toast("Signed out");
      });
    });
  }
  function ensureProfile(u) {
    if (!sb || !u) return;
    var meta = u.user_metadata || {};
    sb.from("profiles").upsert({
      id: u.id,
      display_name: meta.display_name || (u.email ? u.email.split("@")[0] : null)
    }, { onConflict: "id" }).then(function () { /* best-effort */ });
  }

  /* ── save flow ── */
  function handleSaveClick() {
    if (!window.PFSB.configured()) {
      PF.toast("Connect Supabase to save portfolios — setup steps are on the Dashboard");
      openDashboard();
      return;
    }
    ensureClient(function () {
      if (!user) {
        openAuth("signup");
        PF.toast("Create a free account to save this portfolio");
        return;
      }
      var src = PF.getSource();
      if (!src) { PF.toast("Generate a portfolio first, then save it"); return; }
      var inp = $("save-title-input");
      inp.value = src.title || "";
      hideEl("save-error");
      showModal("save-modal");
      setTimeout(function () { inp.focus(); inp.select(); }, 60);
    });
  }
  function doSave() {
    var title = $("save-title-input").value.trim();
    if (!title) {
      var e = $("save-error");
      e.textContent = "Give your portfolio a title.";
      e.hidden = false;
      return;
    }
    var src = PF.getSource();
    if (!src || !user) return;
    var btn = $("save-confirm");
    setBusy(btn, true);
    hideEl("save-error");
    var row = {
      user_id: user.id,
      title: title,
      source_type: src.type,
      source_ref: src.ref,
      portfolio_data: { type: src.type, ref: src.ref, data: src.data, customization: src.customization },
      updated_at: new Date().toISOString()
    };
    function ok() {
      setBusy(btn, false);
      hideModal("save-modal");
      PF.toast(currentSavedId ? "Portfolio updated" : "Portfolio saved to your dashboard");
      if (dashboardOpen) renderDashboard();
    }
    function fail(err) {
      setBusy(btn, false);
      var e2 = $("save-error");
      e2.textContent = (err && err.message) || "Couldn't save — try again.";
      e2.hidden = false;
    }
    if (currentSavedId) {
      sb.from("portfolios").update(row).eq("id", currentSavedId).then(function (res) {
        if (res.error) fail(res.error); else ok();
      });
    } else {
      row.share_token = randToken();
      row.is_public = false;
      sb.from("portfolios").insert(row).select("id").single().then(function (res) {
        if (res.error) { fail(res.error); return; }
        currentSavedId = res.data.id;
        ok();
      });
    }
  }

  /* ── dashboard ── */
  function setNav(active) {
    ["nav-create", "nav-dashboard"].forEach(function (id) {
      var b = $(id);
      if (b) b.classList.toggle("active", id === active);
    });
  }
  function openDashboard() {
    dashboardOpen = true;
    setNav("nav-dashboard");
    PF.show("dashboard");
    renderDashboard();
  }
  function goCreate() {
    dashboardOpen = false;
    setNav("nav-create");
    PF.show("generator");
  }
  function renderDashboard() {
    var box = $("dashboard-content");
    if (!box) return;
    box.innerHTML = "";
    if (!window.PFSB.configured()) { box.appendChild(setupCard()); return; }
    box.innerHTML = '<p class="dash-loading"><span class="spinner"></span> Loading your portfolios…</p>';
    ensureClient(function () {
      if (!user) { box.innerHTML = ""; box.appendChild(signinCard()); return; }
      sb.from("portfolios")
        .select("id,title,source_type,source_ref,share_token,is_public,updated_at,created_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .then(function (res) {
          box.innerHTML = "";
          if (res.error) {
            var err = document.createElement("div");
            err.className = "setup-card";
            err.innerHTML = '<h2>Couldn\'t load your portfolios</h2><p>' + esc(res.error.message) +
              '</p><p class="ctl-hint">If this is a fresh project, make sure you ran <code>supabase/schema.sql</code>.</p>';
            box.appendChild(err);
            return;
          }
          var rows = res.data || [];
          if (!rows.length) { box.appendChild(emptyCard()); return; }
          rows.forEach(function (r) { box.appendChild(portfolioRow(r)); });
        });
    });
  }
  function setupCard() {
    var d = document.createElement("div");
    d.className = "setup-card";
    d.innerHTML =
      '<p class="eyebrow">Backend · optional</p>' +
      '<h2>Connect Supabase to unlock accounts</h2>' +
      '<p>Saving, your dashboard and public share links run on Supabase (free tier is plenty). ' +
      'The generator works fully without it.</p>' +
      '<ol class="setup-steps">' +
      '<li>Create a free project at <strong>supabase.com</strong>.</li>' +
      '<li>Open the SQL editor and run <code>supabase/schema.sql</code> from this project.</li>' +
      '<li>Copy your <strong>Project URL</strong> and <strong>anon key</strong> into <code>supabase-config.js</code>.</li>' +
      '<li>Reload this page — sign-in, save and sharing will light up.</li>' +
      '</ol>';
    return d;
  }
  function signinCard() {
    var d = document.createElement("div");
    d.className = "setup-card";
    d.innerHTML =
      '<p class="eyebrow">Dashboard</p>' +
      '<h2>Sign in to see your portfolios</h2>' +
      '<p>Your saved portfolios live in your account — pick up right where you left off, on any device.</p>';
    var row = document.createElement("div");
    row.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin-top:18px";
    var si = document.createElement("button");
    si.type = "button"; si.className = "btn-ghost"; si.textContent = "Sign in";
    si.addEventListener("click", function () { openAuth("signin"); });
    var su = document.createElement("button");
    su.type = "button"; su.className = "btn-primary"; su.textContent = "Create account";
    su.addEventListener("click", function () { openAuth("signup"); });
    row.appendChild(si); row.appendChild(su);
    d.appendChild(row);
    return d;
  }
  function emptyCard() {
    var d = document.createElement("div");
    d.className = "setup-card";
    d.innerHTML =
      '<p class="eyebrow">Dashboard</p>' +
      '<h2>No saved portfolios yet</h2>' +
      '<p>Generate one from a GitHub username or your resume, hit <strong>Save</strong> in the portfolio toolbar, and it will appear here.</p>';
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn-primary"; b.textContent = "Create your first portfolio";
    b.style.marginTop = "18px";
    b.addEventListener("click", goCreate);
    d.appendChild(b);
    return d;
  }
  function portfolioRow(r) {
    var d = document.createElement("div");
    d.className = "pf-row";
    d.dataset.id = r.id;
    var srcLabel = r.source_type === "github" ? "GitHub" : "Resume";
    var srcRef = r.source_type === "github" ? "@" + r.source_ref : r.source_ref;
    d.innerHTML =
      '<div class="pf-row-main">' +
        '<div class="pf-row-title"><span class="pf-row-title-text">' + esc(r.title) + '</span> ' +
          '<span class="pf-badge ' + (r.is_public ? "public" : "private") + '">' + (r.is_public ? "Public" : "Private") + '</span> ' +
          '<span class="pf-badge src">' + srcLabel + '</span></div>' +
        '<div class="pf-row-sub">' + esc(srcRef) + ' · Updated ' + esc(fmtDate(r.updated_at)) + '</div>' +
        '<div class="share-line" hidden>' +
          '<input class="share-input" readonly value="' + esc(shareUrl(r.share_token)) + '" aria-label="Share link">' +
          '<button type="button" class="btn-ghost sm" data-act="copy">Copy link</button>' +
        '</div>' +
      '</div>' +
      '<div class="pf-row-actions">' +
        '<button type="button" class="btn-primary sm" data-act="open">Open</button>' +
        '<button type="button" class="btn-ghost sm" data-act="rename">Rename</button>' +
        '<button type="button" class="btn-ghost sm" data-act="toggle">' + (r.is_public ? "Make private" : "Make public") + '</button>' +
        '<button type="button" class="btn-ghost sm" data-act="share">Share link</button>' +
        '<button type="button" class="btn-ghost sm danger" data-act="delete">Delete</button>' +
      '</div>';
    d._row = r;
    return d;
  }
  function findRowEl(id) {
    var box = $("dashboard-content");
    return box ? box.querySelector('.pf-row[data-id="' + id + '"]') : null;
  }
  function onDashboardClick(ev) {
    var btn = ev.target.closest("[data-act]");
    if (!btn) return;
    var rowEl = ev.target.closest(".pf-row");
    if (!rowEl) return;
    var r = rowEl._row;
    var act = btn.getAttribute("data-act");
    if (act === "open") openSaved(r);
    else if (act === "rename") startRename(rowEl, r);
    else if (act === "toggle") togglePublic(r);
    else if (act === "share") toggleShareLine(rowEl, r);
    else if (act === "copy") copyShareLink(rowEl, r);
    else if (act === "delete") deleteSaved(r);
  }
  function openSaved(r) {
    ensureClient(function () {
      sb.from("portfolios").select("*").eq("id", r.id).single().then(function (res) {
        if (res.error || !res.data) { PF.toast("Couldn't open that portfolio"); return; }
        var full = res.data;
        var pd = full.portfolio_data || {};
        currentSavedId = full.id;
        var ok = PF.setSource(
          { type: full.source_type, ref: full.source_ref, data: pd.data },
          pd.customization
        );
        if (!ok) { PF.toast("That saved portfolio looks corrupted"); return; }
        dashboardOpen = false;
        setNav("nav-create");
        PF.show("portfolio");
        window.scrollTo(0, 0);
        PF.toast("Opened — saving now updates this entry");
      });
    });
  }
  function startRename(rowEl, r) {
    var titleSpan = rowEl.querySelector(".pf-row-title-text");
    if (!titleSpan) return;
    var input = document.createElement("input");
    input.className = "rename-input";
    input.value = r.title;
    input.maxLength = 80;
    input.setAttribute("aria-label", "Rename portfolio");
    titleSpan.replaceWith(input);
    input.focus();
    input.select();
    var done = false;
    function commit(save) {
      if (done) return;
      done = true;
      var v = input.value.trim();
      if (save && v && v !== r.title) {
        ensureClient(function () {
          sb.from("portfolios").update({ title: v }).eq("id", r.id).then(function (res) {
            if (res.error) { PF.toast("Couldn't rename: " + res.error.message); }
            else { PF.toast("Renamed"); }
            renderDashboard();
          });
        });
      } else {
        renderDashboard();
      }
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") commit(true);
      else if (e.key === "Escape") commit(false);
    });
    input.addEventListener("blur", function () { commit(true); });
  }
  function togglePublic(r) {
    ensureClient(function () {
      sb.from("portfolios").update({ is_public: !r.is_public }).eq("id", r.id).then(function (res) {
        if (res.error) { PF.toast("Couldn't update: " + res.error.message); return; }
        PF.toast(r.is_public ? "Now private — the share link is off" : "Now public — the share link is live");
        renderDashboard();
      });
    });
  }
  function toggleShareLine(rowEl, r) {
    var line = rowEl.querySelector(".share-line");
    if (!line) return;
    line.hidden = !line.hidden;
    if (!line.hidden) {
      var inp = line.querySelector(".share-input");
      if (inp) { inp.focus(); inp.select(); }
      if (!r.is_public) PF.toast("This one is private — flip it to Public for the link to work");
    }
  }
  function copyShareLink(rowEl, r) {
    var url = shareUrl(r.share_token);
    function ok() { PF.toast("Share link copied"); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(ok, function () { fallbackCopy(url); ok(); });
    } else { fallbackCopy(url); ok(); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }
  function deleteSaved(r) {
    if (!window.confirm('Delete "' + r.title + '"? This can\'t be undone.')) return;
    ensureClient(function () {
      sb.from("portfolios").delete().eq("id", r.id).then(function (res) {
        if (res.error) { PF.toast("Couldn't delete: " + res.error.message); return; }
        if (currentSavedId === r.id) currentSavedId = null;
        PF.toast("Deleted");
        renderDashboard();
      });
    });
  }

  /* ── wire up ── */
  function resetSaved() { currentSavedId = null; }

  PF.on("nav-dashboard", "click", openDashboard);
  PF.on("nav-create", "click", goCreate);
  PF.on("nav-brand", "click", function (ev) { ev.preventDefault(); goCreate(); });

  PF.on("save-btn", "click", handleSaveClick);
  PF.on("save-form", "submit", function (ev) { ev.preventDefault(); doSave(); });
  PF.on("save-cancel", "click", function () { hideModal("save-modal"); });
  PF.on("save-close", "click", function () { hideModal("save-modal"); });

  PF.on("auth-tab-signin", "click", function () { setAuthMode("signin"); });
  PF.on("auth-tab-signup", "click", function () { setAuthMode("signup"); });
  PF.on("auth-form", "submit", function (ev) { ev.preventDefault(); doAuth(); });
  PF.on("auth-close", "click", function () { hideModal("auth-modal"); });

  PF.on("gen-form", "submit", resetSaved);
  PF.on("resume-generate-btn", "click", resetSaved);
  PF.on("resume-sample-btn", "click", resetSaved);
  PF.on("startover-btn", "click", resetSaved);
  PF.on("startover-btn", "click", resetSaved);

  document.addEventListener("click", function (ev) {
    if (ev.target.closest && ev.target.closest("#dashboard-content [data-act]")) onDashboardClick(ev);
    ["auth-modal", "save-modal"].forEach(function (id) {
      var m = $(id);
      if (m && !m.hidden && ev.target === m) m.hidden = true;
    });
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") {
      hideModal("auth-modal");
      hideModal("save-modal");
      if (window.PF && PF.closeDrawer) PF.closeDrawer();
    }
  });

  /* boot */
  renderAuthArea();
  window.PFSB.ensure().then(function (c) {
    sb = c;
    if (!c) return;
    sb.auth.getSession().then(function (res) {
      user = (res.data && res.data.session && res.data.session.user) || null;
      renderAuthArea();
      if (user) ensureProfile(user);
    });
    sb.auth.onAuthStateChange(function (ev, session) {
      user = (session && session.user) || null;
      renderAuthArea();
      if (user && (ev === "SIGNED_IN" || ev === "TOKEN_REFRESHED")) ensureProfile(user);
      if (dashboardOpen) renderDashboard();
    });
  }).catch(function () { /* offline / blocked CDN — generator unaffected */ });
})();

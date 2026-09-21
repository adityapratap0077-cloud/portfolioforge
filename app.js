/* ═══════════════ PortfolioForge — app logic ═══════════════
   100% client-side. Themes, fonts, motion & content customization are
   applied via data-attributes on #view-portfolio and persisted to localStorage. */
(function () {
  "use strict";

  var API = "https://api.github.com";

  /* ── themes: 6 full variable sets ── */
  var THEMES = [
    { key: "gold", name: "Royal Gold",
      accent: "#c9a24b", accent2: "#e8c876", bg: "#0b0a08",
      vars: { bg: "#0b0a08", bg2: "#12100d", surface: "#14120e", ink: "#ece5d8",
              muted: "#97907f", faint: "#5f5a4e", accent: "#c9a24b", accent2: "#e8c876",
              rgb: [201, 162, 75] } },
    { key: "emerald", name: "Emerald Noir",
      accent: "#2fae72", accent2: "#5fe3a1", bg: "#071009",
      vars: { bg: "#071009", bg2: "#0c1710", surface: "#0f1c14", ink: "#e6f0e8",
              muted: "#8ba393", faint: "#55685c", accent: "#2fae72", accent2: "#5fe3a1",
              rgb: [47, 174, 114] } },
    { key: "crimson", name: "Crimson Velvet",
      accent: "#d6455a", accent2: "#ff7a8f", bg: "#0e0708",
      vars: { bg: "#0e0708", bg2: "#150b0d", surface: "#1a0e10", ink: "#f0e4e4",
              muted: "#a39090", faint: "#665454", accent: "#d6455a", accent2: "#ff7a8f",
              rgb: [214, 69, 90] } },
    { key: "ocean", name: "Ocean Depths",
      accent: "#35b6d9", accent2: "#6fe0ff", bg: "#060b12",
      vars: { bg: "#060b12", bg2: "#0a121c", surface: "#0d1622", ink: "#e2ecf5",
              muted: "#8ba0b5", faint: "#54667a", accent: "#35b6d9", accent2: "#6fe0ff",
              rgb: [53, 182, 217] } },
    { key: "violet", name: "Violet Dusk",
      accent: "#a06ee8", accent2: "#c9a5ff", bg: "#0c0812",
      vars: { bg: "#0c0812", bg2: "#120c1c", surface: "#171026", ink: "#ece4f5",
              muted: "#a294b8", faint: "#665a7d", accent: "#a06ee8", accent2: "#c9a5ff",
              rgb: [160, 110, 232] } },
    { key: "ivory", name: "Ivory Light",
      accent: "#a5762f", accent2: "#8a5f1f", bg: "#f6f1e7",
      vars: { bg: "#f6f1e7", bg2: "#ece3cf", surface: "#fffdf6", ink: "#221b12",
              muted: "#6e6355", faint: "#a79b85", accent: "#a5762f", accent2: "#8a5f1f",
              rgb: [165, 118, 47] } }
  ];

  /* ── typography: 3 system-stack pairings (offline-safe) ── */
  var SANS_STACK = '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,"Helvetica Neue",Arial,sans-serif';
  var FONTS = [
    { key: "editorial", name: "Editorial", hint: "Serif display · Sans body",
      display: '"Didot","Bodoni MT",Georgia,"Times New Roman",serif', body: SANS_STACK },
    { key: "modern", name: "Modern", hint: "Sans display · Sans body",
      display: SANS_STACK, body: SANS_STACK },
    { key: "mono", name: "Mono", hint: "Monospace display · Sans body",
      display: 'ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace',
      body: SANS_STACK }
  ];

  function themeByKey(k) {
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].key === k) return THEMES[i];
    return THEMES[0];
  }
  function fontByKey(k) {
    for (var i = 0; i < FONTS.length; i++) if (FONTS[i].key === k) return FONTS[i];
    return FONTS[0];
  }
  function rgba(rgb, a) { return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")"; }

  /* ── customize state (persisted) ── */
  var CUST_KEY = "pf-customize-v1";
  var DEFAULT_CUST = {
    theme: "gold", font: "editorial", motion: true, density: "comfortable",
    sections: { activity: true, stack: true, journey: true },
    tagline: "", bio: ""
  };
  function loadCust() {
    try {
      var raw = localStorage.getItem(CUST_KEY);
      if (raw) {
        var p = JSON.parse(raw), c = {}, k;
        for (k in DEFAULT_CUST) c[k] = (p[k] !== undefined) ? p[k] : DEFAULT_CUST[k];
        c.sections = {
          activity: !!(p.sections && p.sections.activity !== undefined ? p.sections.activity : true),
          stack: !!(p.sections && p.sections.stack !== undefined ? p.sections.stack : true),
          journey: !!(p.sections && p.sections.journey !== undefined ? p.sections.journey : true)
        };
        return c;
      }
    } catch (e) { /* storage unavailable — use defaults */ }
    return JSON.parse(JSON.stringify(DEFAULT_CUST));
  }
  var cust = loadCust();
  function saveCust() {
    try { localStorage.setItem(CUST_KEY, JSON.stringify(cust)); } catch (e) { /* ignore */ }
  }

  /* GitHub linguist colors for common languages */
  var LANG_COLORS = {
    "JavaScript": "#f1e05a", "TypeScript": "#3178c6", "Python": "#3572A5",
    "Java": "#b07219", "Go": "#00ADD8", "Rust": "#dea584", "C": "#555555",
    "C++": "#f34b7d", "C#": "#178600", "Ruby": "#701516", "PHP": "#4F5D95",
    "Swift": "#F05138", "Kotlin": "#A97BFF", "HTML": "#e34c26", "CSS": "#563d7c",
    "SCSS": "#c6538c", "Shell": "#89e051", "Dart": "#00B4AB", "Lua": "#000080",
    "R": "#198CE7", "Scala": "#c22d40", "Haskell": "#5e5086", "Elixir": "#6e4a7e",
    "Clojure": "#db5855", "Vue": "#41b883", "Svelte": "#ff3e00", "Zig": "#ec915c",
    "Jupyter Notebook": "#DA5B0B", "TeX": "#3D6117", "Dockerfile": "#384d54",
    "Vim Script": "#199f4b", "Emacs Lisp": "#c065db", "Objective-C": "#438eff",
    "Perl": "#0298c3", "Groovy": "#e69f56", "PowerShell": "#012456"
  };
  function langColor(l) { return LANG_COLORS[l] || "#8a857a"; }

  /* ── dom refs ── */
  function $(id) { return document.getElementById(id); }
  var views = {
    generator: $("view-generator"),
    loading: $("view-loading"),
    error: $("view-error"),
    portfolio: $("view-portfolio")
  };
  var form = $("gen-form"), input = $("username-input");
  var lastUsername = "";

  var REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var FINE_POINTER = !!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches);

  function show(name) {
    Object.keys(views).forEach(function (k) { views[k].hidden = (k !== name); });
    window.scrollTo(0, 0);
    if (name === "portfolio") { initMotion(); }
    else { clearMotion(); views.portfolio.classList.remove("motion-on"); }
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function fmtNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  function fmtMonthYear(iso) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  function relTime(iso) {
    var s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return "just now";
    var m = Math.floor(s / 60);
    if (m < 60) return m + "m ago";
    var h = Math.floor(m / 60);
    if (h < 24) return h + "h ago";
    var d = Math.floor(h / 24);
    if (d < 7) return d + "d ago";
    var w = Math.floor(d / 7);
    if (w < 5) return w + "w ago";
    var mo = Math.floor(d / 30);
    if (mo < 12) return mo + "mo ago";
    var y = Math.floor(d / 365);
    return y + "y ago";
  }

  function repoLink(fullName) {
    return '<a href="https://github.com/' + esc(fullName) + '" target="_blank" rel="noopener">' + esc(fullName) + "</a>";
  }

  /* ── fetch ── */
  function api(url) {
    return fetch(url, { headers: { "Accept": "application/vnd.github+json" } })
      .then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            var err = new Error(body.message || ("GitHub API error " + res.status));
            err.status = res.status;
            err.resetAt = res.headers.get("x-ratelimit-reset");
            throw err;
          });
        }
        return res.json();
      });
  }

  function apiRawReadme(owner, repo) {
    return fetch(API + "/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo) + "/readme",
      { headers: { "Accept": "application/vnd.github.raw" } })
      .then(function (res) {
        if (!res.ok) { var e = new Error("readme " + res.status); e.status = res.status; throw e; }
        return res.text();
      });
  }

  function generate(username) {
    username = (username || "").trim().replace(/^@/, "");
    if (!username) { input.focus(); return; }
    lastUsername = username;
    /* custom copy belongs to the previous profile — reset it, keep theme/font/motion/density/sections */
    cust.tagline = ""; cust.bio = ""; saveCust();
    show("loading");
    var u = encodeURIComponent(username);

    /* user + repos are critical; events / social / first-repo are best-effort */
    var pUser = api(API + "/users/" + u);
    var pRepos = api(API + "/users/" + u + "/repos?per_page=100&sort=updated");
    var pEvents = api(API + "/users/" + u + "/events/public").catch(function () { return null; });
    var pSocial = api(API + "/users/" + u + "/social_accounts").catch(function () { return null; });
    var pFirst = api(API + "/users/" + u + "/repos?per_page=1&sort=created&direction=asc")
      .catch(function () { return null; });

    Promise.all([pUser, pRepos, pEvents, pSocial, pFirst]).then(function (r) {
      renderPortfolio({ user: r[0], repos: r[1], events: r[2], social: r[3], first: (r[4] && r[4][0]) || null });
      show("portfolio");
    }).catch(function (err) {
      showError(err);
    });
  }

  function showError(err) {
    var title = "Something went wrong", msg = err.message || "Please try again.";
    if (err.status === 404) {
      title = "User not found";
      msg = "No GitHub user @" + lastUsername + " exists. Check the spelling and try again.";
    } else if (err.status === 403 && /rate limit/i.test(err.message || "")) {
      title = "Rate limit reached";
      var when = err.resetAt
        ? new Date(parseInt(err.resetAt, 10) * 1000).toLocaleTimeString()
        : "shortly";
      msg = "GitHub allows 60 unauthenticated requests per hour and the limit is hit. It resets around " + when + " — please wait a moment and retry.";
    } else if (err.status === 403) {
      title = "Access forbidden";
    } else if (err instanceof TypeError) {
      title = "Network error";
      msg = "Could not reach api.github.com. Check your connection and try again.";
    }
    $("error-title").textContent = title;
    $("error-msg").textContent = msg;
    show("error");
  }

  /* ── README excerpts ── */
  function excerptFromReadme(md) {
    var lines = String(md || "").split("\n")
      .map(function (l) { return l.trim(); })
      .filter(function (l) {
        return l && !/^```/.test(l) && !/^<[^>]*>$/.test(l) && !/^\|?[\s:|\-]+\|?$/.test(l);
      });
    var t = lines.join(" ")
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[#>*_`~]/g, "")
      .replace(/\s+/g, " ").trim();
    if (t.length > 200) t = t.slice(0, 200).replace(/\s+\S*$/, "") + "…";
    return t;
  }

  function loadReadmes(top) {
    var note = $("work-note");
    var stopped = false;
    top.forEach(function (r) {
      var slot = document.querySelector('.work-excerpt[data-repo="' + r.id + '"]');
      if (!slot || stopped) return;
      apiRawReadme(r.owner.login, r.name).then(function (md) {
        var t = excerptFromReadme(md);
        slot.classList.remove("loading");
        slot.innerHTML = '<span class="excerpt-label">From the README</span>' +
          (t ? esc(t) : '<span style="color:var(--faint);font-style:normal">README is empty.</span>');
      }).catch(function (err) {
        slot.classList.remove("loading");
        if (err.status === 403 && !stopped) {
          stopped = true;
          note.hidden = false;
          note.textContent = "GitHub's rate limit kicked in — some README excerpts couldn't load. Everything else is intact; regenerate in a little while for the full picture.";
          document.querySelectorAll(".work-excerpt.loading").forEach(function (s) {
            s.classList.remove("loading");
            s.innerHTML = '<span style="color:var(--faint);font-style:normal">Excerpt unavailable — rate limit.</span>';
          });
        } else if (err.status === 404) {
          slot.innerHTML = '<span style="color:var(--faint);font-style:normal">No README in this repository.</span>';
        } else {
          slot.innerHTML = '<span style="color:var(--faint);font-style:normal">Excerpt unavailable.</span>';
        }
      });
    });
  }

  /* ── activity ── */
  var EVENT_TYPES = ["PushEvent", "CreateEvent", "PullRequestEvent", "IssuesEvent",
    "IssueCommentEvent", "WatchEvent", "ForkEvent", "ReleaseEvent",
    "PullRequestReviewEvent", "PublicEvent"];

  function humanizeEvent(e) {
    var p = e.payload || {}, repo = (e.repo && e.repo.name) || "";
    switch (e.type) {
      case "PushEvent": {
        var n = (p.commits && p.commits.length) || p.size || 1;
        var branch = (p.ref || "").replace("refs/heads/", "");
        return "Pushed " + n + " commit" + (n === 1 ? "" : "s") +
          (branch ? " to <em>" + esc(branch) + "</em>" : "") + " in " + repoLink(repo);
      }
      case "CreateEvent":
        if (p.ref_type === "repository") return "Created repository " + repoLink(repo);
        return "Created " + esc(p.ref_type || "ref") + " <em>" + esc(p.ref || "") + "</em> in " + repoLink(repo);
      case "PullRequestEvent": {
        var pr = p.pull_request || {};
        var action = p.action === "closed" && pr.merged ? "Merged" :
          (p.action || "opened").charAt(0).toUpperCase() + (p.action || "opened").slice(1);
        return action + " pull request #" + esc(pr.number || "") + " in " + repoLink(repo) +
          (pr.title ? ": <em>" + esc(pr.title) + "</em>" : "");
      }
      case "IssuesEvent": {
        var is = p.issue || {};
        var ia = (p.action || "opened").charAt(0).toUpperCase() + (p.action || "opened").slice(1);
        return ia + " issue #" + esc(is.number || "") + " in " + repoLink(repo) +
          (is.title ? ": <em>" + esc(is.title) + "</em>" : "");
      }
      case "IssueCommentEvent": {
        var ic = p.issue || {};
        return "Commented on #" + esc(ic.number || "") + " in " + repoLink(repo);
      }
      case "WatchEvent":
        return "Starred " + repoLink(repo);
      case "ForkEvent":
        return "Forked " + repoLink(repo) +
          (p.forkee && p.forkee.full_name ? " → " + repoLink(p.forkee.full_name) : "");
      case "ReleaseEvent":
        return "Published release <em>" + esc((p.release && p.release.tag_name) || "") + "</em> in " + repoLink(repo);
      case "PullRequestReviewEvent": {
        var rpr = p.pull_request || {};
        return "Reviewed pull request #" + esc(rpr.number || "") + " in " + repoLink(repo);
      }
      case "PublicEvent":
        return "Open-sourced " + repoLink(repo);
      default:
        return null;
    }
  }

  function renderTimeline(events) {
    var tl = $("activity-timeline"), note = $("activity-note");
    tl.innerHTML = ""; note.hidden = true;
    if (!events || !events.length) {
      note.hidden = false;
      note.textContent = "No recent public activity to show — GitHub only exposes the last few months of public events.";
      return;
    }
    var shown = 0;
    for (var i = 0; i < events.length && shown < 8; i++) {
      if (EVENT_TYPES.indexOf(events[i].type) === -1) continue;
      var text = humanizeEvent(events[i]);
      if (!text) continue;
      var item = document.createElement("div");
      item.className = "t-item";
      item.innerHTML = '<p class="t-text">' + text + '</p><p class="t-date">' + esc(relTime(events[i].created_at)) + "</p>";
      tl.appendChild(item);
      shown++;
    }
    if (shown === 0) {
      note.hidden = false;
      note.textContent = "No recent public activity to show — GitHub only exposes the last few months of public events.";
    }
  }

  /* ── journey ── */
  function renderJourney(user, first, topRepo) {
    var list = $("journey-list");
    list.innerHTML = "";
    var items = [];

    items.push({
      title: "Joined GitHub",
      detail: "Became <em>@" + esc(user.login) + "</em> in " + esc(fmtMonthYear(user.created_at)) + "."
    });

    if (first) {
      items.push({
        title: "First repository",
        detail: repoLink(first.full_name) + " — created " + esc(fmtMonthYear(first.created_at)) + ". Every journey starts with a first commit."
      });
    } else {
      items.push({ title: "First repository", detail: "No public repositories yet — the story is still being written." });
    }

    items.push({
      title: fmtNum(user.public_repos) + " repos and counting",
      detail: esc(fmtNum(user.public_repos)) + " public repositories shipped — the archive keeps growing."
    });

    if (topRepo && (topRepo.stargazers_count || 0) > 0) {
      items.push({
        title: "Top starred project",
        detail: repoLink(topRepo.full_name) + " — " + esc(fmtNum(topRepo.stargazers_count)) + "★ and counting."
      });
    } else {
      items.push({ title: "Top starred project", detail: "No stars yet — every journey starts somewhere." });
    }

    var numerals = ["01", "02", "03", "04"];
    items.forEach(function (it, i) {
      var li = document.createElement("li");
      li.innerHTML = '<span class="j-num">' + numerals[i] + '</span><div><p class="j-title">' +
        esc(it.title) + '</p><p class="j-detail">' + it.detail + "</p></div>";
      list.appendChild(li);
    });
  }

  /* ── contact ── */
  function renderContact(user, social) {
    var box = $("contact-links");
    box.innerHTML = "";

    var actions = document.createElement("div");
    actions.className = "contact-actions";
    actions.innerHTML = '<a class="btn-gold" href="' + esc(user.html_url) + '" target="_blank" rel="noopener">View GitHub Profile <span aria-hidden="true">↗</span></a>';

    if (user.blog) {
      var blog = user.blog.trim();
      if (!/^https?:\/\//i.test(blog)) blog = "https://" + blog;
      var label = blog.replace(/^https?:\/\//i, "").replace(/\/$/, "");
      actions.innerHTML += ' <a class="btn-ghost" href="' + esc(blog) + '" target="_blank" rel="noopener">' + esc(label) + ' <span aria-hidden="true">↗</span></a>';
    }
    box.appendChild(actions);

    if (social && social.length) {
      var chips = document.createElement("div");
      chips.className = "social-chips";
      social.forEach(function (s) {
        if (!s.url) return;
        var a = document.createElement("a");
        a.className = "social-chip";
        a.href = s.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = s.provider || "Link";
        chips.appendChild(a);
      });
      if (chips.children.length) box.appendChild(chips);
    }
  }

  /* ═══════════════ customize ═══════════════ */
  function currentAccent() {
    try {
      var v = getComputedStyle(views.portfolio).getPropertyValue("--accent").trim();
      return v || "#c9a24b";
    } catch (e) { return "#c9a24b"; }
  }

  function applyCustomText() {
    var tagline = $("pf-tagline"), bio = $("about-bio");
    if (!tagline || !bio) return;
    tagline.textContent = cust.tagline || tagline.dataset.base || "";
    if (cust.bio) { bio.textContent = cust.bio; bio.classList.remove("dropcap"); }
    else { bio.textContent = bio.dataset.base || bio.textContent; bio.classList.add("dropcap"); }
  }

  function syncPanel() {
    function each(sel, fn) {
      var nodes = document.querySelectorAll(sel);
      for (var i = 0; i < nodes.length; i++) fn(nodes[i]);
    }
    each("#theme-swatches .swatch", function (b) {
      b.classList.toggle("active", b.getAttribute("data-theme-key") === cust.theme);
    });
    each("#font-options .font-opt", function (b) {
      b.classList.toggle("active", b.getAttribute("data-font-key") === cust.font);
    });
    each("#density-options button", function (b) {
      b.classList.toggle("active", b.getAttribute("data-density") === cust.density);
    });
    each('#section-toggles input[data-sec]', function (inp) {
      inp.checked = !!cust.sections[inp.getAttribute("data-sec")];
    });
    var mo = $("tgl-motion");
    if (mo) mo.checked = cust.motion;
  }

  function applyCustomize() {
    var vp = views.portfolio;
    vp.setAttribute("data-theme", cust.theme);
    vp.setAttribute("data-font", cust.font);
    vp.setAttribute("data-density", cust.density);
    /* sections */
    $("sec-activity").hidden = !cust.sections.activity;
    $("sec-stack").hidden = !cust.sections.stack;
    $("sec-journey").hidden = !cust.sections.journey;
    var navMap = { activity: "sec-activity", stack: "sec-stack", journey: "sec-journey" };
    Object.keys(navMap).forEach(function (k) {
      var a = document.querySelector('.mini-nav a[data-nav="' + k + '"]');
      if (a) a.hidden = !cust.sections[k];
    });
    applyCustomText();
    syncPanel();
    initMotion();
  }

  function buildPanel() {
    /* theme swatches */
    var sw = $("theme-swatches");
    THEMES.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "swatch";
      b.setAttribute("data-theme-key", t.key);
      b.setAttribute("aria-label", t.name + " theme");
      b.innerHTML = '<span class="dots" aria-hidden="true"><i style="background:' + t.accent + '"></i>' +
        '<i style="background:' + t.accent2 + '"></i><i style="background:' + t.bg + '"></i></span>' +
        "<span>" + esc(t.name) + "</span>";
      b.addEventListener("click", function () {
        cust.theme = t.key; saveCust(); applyCustomize();
      });
      sw.appendChild(b);
    });

    /* font options */
    var fo = $("font-options");
    FONTS.forEach(function (f) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "font-opt";
      b.setAttribute("data-font-key", f.key);
      b.innerHTML = '<span class="aa" style="font-family:' + f.display + '" aria-hidden="true">Ag</span>' +
        '<span class="font-meta"><strong>' + esc(f.name) + "</strong><em>" + esc(f.hint) + "</em></span>";
      b.addEventListener("click", function () {
        cust.font = f.key; saveCust(); applyCustomize();
      });
      fo.appendChild(b);
    });

    /* section toggles */
    var st = $("section-toggles");
    [["activity", "Recent Activity"], ["stack", "Tech Stack"], ["journey", "Journey"]].forEach(function (pair) {
      var lab = document.createElement("label");
      lab.className = "switch";
      var inp = document.createElement("input");
      inp.type = "checkbox";
      inp.setAttribute("data-sec", pair[0]);
      var knob = document.createElement("span");
      knob.className = "knob";
      knob.setAttribute("aria-hidden", "true");
      var lbl = document.createElement("span");
      lbl.className = "switch-label";
      lbl.textContent = pair[1];
      lab.appendChild(inp); lab.appendChild(knob); lab.appendChild(lbl);
      inp.addEventListener("change", function () {
        cust.sections[pair[0]] = inp.checked; saveCust(); applyCustomize();
      });
      st.appendChild(lab);
    });

    /* density */
    var dg = $("density-options");
    [["comfortable", "Comfortable"], ["compact", "Compact"]].forEach(function (pair) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("data-density", pair[0]);
      b.textContent = pair[1];
      b.addEventListener("click", function () {
        cust.density = pair[0]; saveCust(); applyCustomize();
      });
      dg.appendChild(b);
    });

    /* motion toggle */
    $("tgl-motion").addEventListener("change", function (ev) {
      cust.motion = ev.target.checked; saveCust(); applyCustomize();
    });

    /* editable text */
    var ft = $("fld-tagline"), fb = $("fld-bio");
    ft.addEventListener("input", function () {
      cust.tagline = ft.value.trim(); saveCust(); applyCustomText();
    });
    fb.addEventListener("input", function () {
      cust.bio = fb.value.trim(); saveCust(); applyCustomText();
    });
  }

  function openDrawer() {
    $("fld-tagline").value = cust.tagline;
    $("fld-bio").value = cust.bio;
    var d = $("drawer"), s = $("drawer-scrim");
    d.hidden = false; s.hidden = false;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { d.classList.add("open"); s.classList.add("open"); });
    });
  }
  function closeDrawer() {
    var d = $("drawer"), s = $("drawer-scrim");
    d.classList.remove("open"); s.classList.remove("open");
    setTimeout(function () { d.hidden = true; s.hidden = true; }, 400);
  }
  function drawerOpen() {
    return !$("drawer").hidden && $("drawer").classList.contains("open");
  }

  /* ═══════════════ 3D depth & motion ═══════════════ */
  var motionCleanup = [];
  var particleState = null;

  function clearMotion() {
    motionCleanup.forEach(function (fn) { try { fn(); } catch (e) { /* ignore */ } });
    motionCleanup = [];
    particleState = null;
  }

  function motionActive() {
    return cust.motion && !REDUCED && !views.portfolio.hidden;
  }

  function initMotion() {
    clearMotion();
    var vp = views.portfolio;
    if (!motionActive()) { vp.classList.remove("motion-on"); vp.classList.add("motion-off"); return; }
    vp.classList.add("motion-on");
    vp.classList.remove("motion-off");
    initReveals(vp);
    if (FINE_POINTER) {
      initTilt(vp);
      initHeroParallax();
    }
    initParticles();
  }

  function initReveals(vp) {
    var reveals = vp.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      for (var i = 0; i < reveals.length; i++) reveals[i].classList.add("in");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var idx = Array.prototype.indexOf.call(reveals, en.target);
          en.target.style.transitionDelay = ((idx % 4) * 70) + "ms";
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    for (var j = 0; j < reveals.length; j++) io.observe(reveals[j]);
    motionCleanup.push(function () { io.disconnect(); });
  }

  function initTilt(vp) {
    var cards = vp.querySelectorAll(".work-card");
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        var glare = card.querySelector(".glare");
        function mv(ev) {
          var r = card.getBoundingClientRect();
          var px = (ev.clientX - r.left) / r.width - 0.5;
          var py = (ev.clientY - r.top) / r.height - 0.5;
          card.classList.add("tilting");
          card.style.transform = "perspective(1200px) rotateX(" + (-py * 4).toFixed(2) +
            "deg) rotateY(" + (px * 5).toFixed(2) + "deg)";
          if (glare) {
            glare.style.setProperty("--mx", ((px + 0.5) * 100).toFixed(1) + "%");
            glare.style.setProperty("--my", ((py + 0.5) * 100).toFixed(1) + "%");
          }
        }
        function lv() { card.classList.remove("tilting"); card.style.transform = ""; }
        card.addEventListener("mousemove", mv);
        card.addEventListener("mouseleave", lv);
        motionCleanup.push(function () {
          card.removeEventListener("mousemove", mv);
          card.removeEventListener("mouseleave", lv);
          card.classList.remove("tilting");
          card.style.transform = "";
        });
      })(cards[i]);
    }
  }

  function initHeroParallax() {
    var hero = $("sec-hero");
    if (!hero) return;
    var layers = hero.querySelectorAll("[data-depth]");
    var orbs = document.querySelector("#view-portfolio .fx-orbs");
    if (!layers.length && !orbs) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    function tick() {
      cx += (tx - cx) * 0.09; cy += (ty - cy) * 0.09;
      for (var i = 0; i < layers.length; i++) {
        var d = parseFloat(layers[i].getAttribute("data-depth")) || 10;
        layers[i].style.transform = "translate3d(" + (cx * d * 1.6).toFixed(1) + "px," +
          (cy * d * 1.6).toFixed(1) + "px,0)";
      }
      if (orbs) orbs.style.transform = "translate3d(" + (cx * -22).toFixed(1) + "px," + (cy * -16).toFixed(1) + "px,0)";
      if (Math.abs(tx - cx) > 0.0008 || Math.abs(ty - cy) > 0.0008) { raf = requestAnimationFrame(tick); }
      else { raf = 0; }
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }
    function mv(ev) {
      var r = hero.getBoundingClientRect();
      tx = (ev.clientX - r.left) / r.width - 0.5;
      ty = (ev.clientY - r.top) / r.height - 0.5;
      kick();
    }
    function lv() { tx = 0; ty = 0; kick(); }
    hero.addEventListener("mousemove", mv);
    hero.addEventListener("mouseleave", lv);
    motionCleanup.push(function () {
      hero.removeEventListener("mousemove", mv);
      hero.removeEventListener("mouseleave", lv);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      for (var i = 0; i < layers.length; i++) layers[i].style.transform = "";
      if (orbs) orbs.style.transform = "";
    });
  }

  function initParticles() {
    var cv = $("pf-particles"), hero = $("sec-hero");
    if (!cv || !hero || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var N = window.innerWidth < 640 ? 28 : 70;
    var W = 0, H = 0, run = true, raf = 0;
    var st = { accent: currentAccent() };
    particleState = st;
    function size() {
      var r = hero.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function mk(init) {
      return {
        x: Math.random() * W, y: init ? Math.random() * H : H + 10,
        r: Math.random() * 1.7 + 0.5, s: Math.random() * 0.32 + 0.08,
        o: Math.random() * 0.45 + 0.15, ph: Math.random() * 6.283
      };
    }
    var ps = [];
    size();
    for (var i = 0; i < N; i++) ps.push(mk(true));
    function frame(t) {
      raf = requestAnimationFrame(frame);
      if (!run || document.hidden) return;
      ctx.clearRect(0, 0, W, H);
      for (var j = 0; j < ps.length; j++) {
        var p = ps[j];
        p.y -= p.s;
        p.x += Math.sin(t / 1600 + p.ph) * 0.12;
        if (p.y < -12) { ps[j] = mk(false); continue; }
        var tw = p.o * (0.6 + 0.4 * Math.sin(t / 700 + p.ph));
        ctx.globalAlpha = tw;
        ctx.fillStyle = st.accent;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    raf = requestAnimationFrame(frame);
    function onResize() { size(); }
    function onVis() { run = !document.hidden; }
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    var heroIO = null;
    if ("IntersectionObserver" in window) {
      heroIO = new IntersectionObserver(function (es) {
        run = es[0].isIntersecting && !document.hidden;
      });
      heroIO.observe(hero);
    }
    motionCleanup.push(function () {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      if (heroIO) heroIO.disconnect();
      particleState = null;
    });
  }

  function retintParticles() {
    if (particleState) particleState.accent = currentAccent();
  }

  /* ── render ── */
  function renderPortfolio(data) {
    var user = data.user, repos = data.repos;

    /* hero */
    var avatar = $("pf-avatar");
    avatar.src = user.avatar_url + "&s=336";
    avatar.alt = (user.name || user.login) + "'s avatar";
    $("pf-name").textContent = user.name || user.login;
    var heroTag = $("pf-tagline");
    heroTag.textContent = user.bio || "Software Developer";
    heroTag.dataset.base = heroTag.textContent;
    var loc = $("pf-location");
    if (user.location) { loc.textContent = user.location; loc.style.display = ""; }
    else { loc.style.display = "none"; }
    $("pf-meta-sep").style.display = user.location ? "" : "none";
    var gh = $("pf-github");
    gh.textContent = "github.com/" + user.login;
    gh.href = user.html_url;

    /* about */
    var aboutBio = $("about-bio");
    aboutBio.classList.add("dropcap");
    if (user.bio) { aboutBio.textContent = user.bio; }
    else { aboutBio.textContent = "This developer hasn't written a public bio yet — the work below speaks for them."; }
    aboutBio.dataset.base = aboutBio.textContent;
    var metaBits = [];
    if (user.company) metaBits.push(esc(user.company));
    if (user.location) metaBits.push(esc(user.location));
    metaBits.push("On GitHub since " + esc(fmtMonthYear(user.created_at)));
    if (user.blog) {
      var blog = user.blog.trim();
      if (!/^https?:\/\//i.test(blog)) blog = "https://" + blog;
      metaBits.push('<a href="' + esc(blog) + '" target="_blank" rel="noopener">' +
        esc(blog.replace(/^https?:\/\//i, "").replace(/\/$/, "")) + "</a>");
    }
    $("about-meta").innerHTML = metaBits.join(" &nbsp;·&nbsp; ");

    /* stats */
    var totalStars = 0, totalForks = 0;
    repos.forEach(function (r) { totalStars += r.stargazers_count || 0; totalForks += r.forks_count || 0; });
    $("st-repos").textContent = fmtNum(user.public_repos);
    $("st-followers").textContent = fmtNum(user.followers);
    $("st-stars").textContent = fmtNum(totalStars);
    $("st-forks").textContent = fmtNum(totalForks);
    var years = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (365.25 * 24 * 3600 * 1000));
    $("st-years").textContent = years < 1 ? "<1" : String(years);

    /* top repos */
    var sorted = repos.slice().sort(function (a, b) { return (b.stargazers_count || 0) - (a.stargazers_count || 0); });
    var top = repos.filter(function (r) { return !r.fork; })
      .sort(function (a, b) { return (b.stargazers_count || 0) - (a.stargazers_count || 0); })
      .slice(0, 6);
    if (top.length === 0) top = sorted.slice(0, 6);
    var topRepo = top[0] || sorted[0] || null;

    var grid = $("work-grid");
    grid.innerHTML = "";
    $("work-note").hidden = true;
    if (top.length === 0) {
      grid.innerHTML = '<p class="work-empty">No public repositories yet — check back soon.</p>';
    } else {
      top.forEach(function (r, i) {
        var card = document.createElement("article");
        card.className = "work-card reveal";
        var num = ("0" + (i + 1)).slice(-2);

        var kicker = "";
        if (r.language) {
          kicker += '<span><span class="lang-dot" style="background:' + langColor(r.language) + '"></span>' + esc(r.language) + "</span>";
        }
        (r.topics || []).slice(0, 4).forEach(function (t) {
          kicker += '<span class="topic-tag">' + esc(t) + "</span>";
        });

        card.innerHTML =
          '<div class="work-index">' + num + "</div>" +
          '<div class="work-body">' +
            (kicker ? '<div class="work-kicker">' + kicker + "</div>" : "") +
            '<h3 class="work-name"><a href="' + esc(r.html_url) + '" target="_blank" rel="noopener">' + esc(r.name) + "</a></h3>" +
            (r.description ? '<p class="work-desc">' + esc(r.description) + "</p>"
              : '<p class="work-desc" style="color:var(--faint);font-style:italic">No description provided.</p>') +
            '<div class="work-excerpt loading" data-repo="' + r.id + '" aria-live="polite"></div>' +
            '<div class="work-foot"><span class="work-stats"><span>★ ' + fmtNum(r.stargazers_count || 0) + "</span>" +
            "<span>⑂ " + fmtNum(r.forks_count || 0) + "</span></span>" +
            '<span class="work-updated">Updated ' + esc(relTime(r.updated_at)) + "</span></div>" +
            '<div class="glare" aria-hidden="true"></div>' +
          "</div>";
        grid.appendChild(card);
      });
    }

    /* activity */
    renderTimeline(data.events);

    /* languages */
    var counts = {};
    repos.forEach(function (r) { if (r.language) counts[r.language] = (counts[r.language] || 0) + 1; });
    var langs = Object.keys(counts).map(function (l) { return { name: l, n: counts[l] }; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 6);
    var total = langs.reduce(function (s, l) { return s + l.n; }, 0);
    var bar = $("lang-bar"), legend = $("lang-legend");
    bar.innerHTML = ""; legend.innerHTML = "";
    if (langs.length === 0) {
      $("sec-stack").style.display = "none";
    } else {
      $("sec-stack").style.display = "";
      langs.forEach(function (l) {
        var pct = Math.round((l.n / total) * 100);
        var seg = document.createElement("div");
        seg.className = "lang-seg";
        seg.style.flexGrow = l.n;
        seg.style.background = langColor(l.name);
        seg.title = l.name + " — " + pct + "%";
        bar.appendChild(seg);
        var item = document.createElement("span");
        item.className = "lang-item";
        item.innerHTML = '<span class="lang-dot" style="background:' + langColor(l.name) + '"></span>' +
          esc(l.name) + '<span class="pct">' + pct + "%</span>";
        legend.appendChild(item);
      });
    }

    /* journey + contact */
    renderJourney(user, data.first, topRepo);
    renderContact(user, data.social);

    /* apply saved customization (theme, sections, text, motion) */
    applyCustomize();

    /* lazy README excerpts after first paint */
    if (top.length) {
      setTimeout(function () { loadReadmes(top); }, 60);
    }
  }

  /* ── export standalone HTML ── */
  function exportCSS() {
    var t = themeByKey(cust.theme), f = fontByKey(cust.font), v = t.vars;
    var root = ":root{" +
      "--bg:" + v.bg + ";--bg-2:" + v.bg2 + ";--surface:" + v.surface + ";" +
      "--ink:" + v.ink + ";--muted:" + v.muted + ";--faint:" + v.faint + ";" +
      "--accent:" + v.accent + ";--accent-2:" + v.accent2 + ";--accent-rgb:" + v.rgb.join(" ") + ";" +
      "--accent-dim:" + rgba(v.rgb, 0.28) + ";--line:" + rgba(v.rgb, 0.16) + ";" +
      "--glow:" + rgba(v.rgb, 0.07) + ";" +
      "--font-display:" + f.display + ";--font-body:" + f.body + "}";

    var R = [
      "html{scroll-behavior:smooth}",
      "body{background:radial-gradient(1200px 600px at 50% -10%," + rgba(v.rgb, 0.08) + ",transparent 60%),radial-gradient(900px 500px at 90% 110%," + rgba(v.rgb, 0.05) + ",transparent 60%),var(--bg);color:var(--ink);font-family:var(--font-body);font-weight:300;margin:0;padding:0;-webkit-font-smoothing:antialiased;min-height:100vh}",
      ".wrap{max-width:1120px;margin:0 auto;padding:0 24px}",
      ".fx-orbs{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}",
      ".orb{position:absolute;border-radius:50%;filter:blur(70px);opacity:.55;animation:drift 24s ease-in-out infinite alternate}",
      ".orb-1{width:540px;height:540px;top:-150px;left:-130px;background:radial-gradient(circle," + rgba(v.rgb, 0.34) + ",transparent 70%)}",
      ".orb-2{width:470px;height:470px;bottom:-140px;right:-110px;background:radial-gradient(circle," + rgba(v.rgb, 0.26) + ",transparent 70%);animation-delay:-9s}",
      ".orb-3{width:300px;height:300px;top:36%;left:58%;background:radial-gradient(circle," + rgba(v.rgb, 0.16) + ",transparent 70%);animation-delay:-16s}",
      "@keyframes drift{from{transform:translate(0,0) scale(1)}to{transform:translate(64px,44px) scale(1.12)}}",
      ".pf{padding:84px 24px 40px;max-width:1120px;margin:0 auto;position:relative;z-index:1}",
      ".pf section{margin-bottom:96px}",
      ".sec-eyebrow{font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:var(--muted);margin-bottom:16px;font-family:var(--font-body)}",
      ".sec-num{color:var(--accent);font-weight:500}",
      ".sec-title{font-family:var(--font-display);font-weight:500;font-size:clamp(2.2rem,5vw,3.4rem);line-height:1.05;margin:0 0 26px}",
      ".hairline{height:1px;margin-bottom:44px;background:linear-gradient(90deg,var(--accent-dim)," + rgba(v.rgb, 0.06) + " 55%,transparent)}",
      ".section-note{font-family:var(--font-body);font-size:14px;color:var(--faint);font-weight:300}",
      ".inline-note{font-size:13px;color:var(--muted);line-height:1.7;border:1px solid var(--line);border-radius:12px;background:var(--bg-2);padding:14px 20px;margin-bottom:28px;font-family:var(--font-body)}",
      ".hero{display:flex;gap:48px;align-items:center;margin-bottom:96px;position:relative;perspective:1100px}",
      "#pf-particles{position:absolute;inset:0;pointer-events:none;opacity:.85}",
      ".hero-text{min-width:0}",
      ".avatar{width:168px;height:168px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid var(--accent-dim);padding:7px;background:var(--bg-2);box-shadow:0 0 0 1px " + rgba(v.rgb, 0.12) + ",0 18px 50px rgba(0,0,0,.5)}",
      ".pf-name{font-family:var(--font-display);font-weight:600;font-size:clamp(3rem,8vw,5.6rem);line-height:1.02;margin:0 0 18px}",
      ".pf-tagline{font-family:var(--font-display);font-style:italic;font-size:clamp(1.25rem,2.6vw,1.7rem);color:var(--accent-2);line-height:1.5;max-width:640px;margin:0 0 22px}",
      ".pf-meta{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);margin-bottom:30px;font-family:var(--font-body)}",
      ".pf-meta a{color:var(--accent);text-decoration:none}",
      ".scroll-cue{display:none}",
      ".about-bio{font-size:17px;line-height:1.9;max-width:780px;margin:0 0 22px;font-family:var(--font-body);font-weight:300}",
      ".dropcap::first-letter{font-family:var(--font-display);font-weight:600;font-size:3.4em;line-height:.85;float:left;padding:6px 12px 0 0;color:var(--accent-2)}",
      ".about-meta{font-size:13px;letter-spacing:.1em;color:var(--muted);margin-bottom:52px;line-height:2;font-family:var(--font-body)}",
      ".about-meta a{color:var(--accent);text-decoration:none}",
      ".stats{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:16px;overflow:hidden}",
      ".stat{background:var(--surface);padding:30px 18px;text-align:center}",
      ".stat-num{display:block;font-family:var(--font-display);font-size:2.4rem;font-weight:600;color:var(--accent-2);margin-bottom:6px}",
      ".stat-label{font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);font-family:var(--font-body)}",
      ".work-list{display:flex;flex-direction:column;perspective:1400px}",
      ".work-card{display:grid;grid-template-columns:110px 1fr;gap:32px;padding:44px 0;border-bottom:1px solid " + rgba(v.rgb, 0.12) + ";position:relative;overflow:hidden;transform-style:preserve-3d;transition:transform .45s cubic-bezier(.22,1,.36,1)}",
      ".work-card:first-child{border-top:1px solid " + rgba(v.rgb, 0.12) + "}",
      ".work-card.tilting{transition-duration:.08s}",
      ".glare{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .3s;background:radial-gradient(560px circle at var(--mx,50%) var(--my,50%)," + rgba(v.rgb, 0.14) + ",transparent 65%)}",
      ".work-card.tilting .glare{opacity:1}",
      ".work-index{font-family:var(--font-display);font-weight:600;font-size:3.4rem;color:transparent;-webkit-text-stroke:1px var(--accent-dim);line-height:1}",
      ".work-body{min-width:0}",
      ".work-kicker{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin-bottom:14px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);font-family:var(--font-body)}",
      ".work-name{font-family:var(--font-display);font-size:2rem;font-weight:600;margin:0 0 12px;line-height:1.15}",
      ".work-name a{color:var(--ink);text-decoration:none}",
      ".work-desc{color:var(--muted);font-size:15px;line-height:1.7;max-width:720px;margin:0 0 18px;font-family:var(--font-body)}",
      ".work-excerpt{border-left:2px solid var(--accent-dim);padding:4px 0 4px 18px;margin-bottom:20px;color:var(--muted);line-height:1.75;font-style:italic;font-size:15px;max-width:720px;font-family:var(--font-display)}",
      ".excerpt-label{display:block;font-family:var(--font-body);font-style:normal;font-size:10.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--faint);margin-bottom:8px}",
      ".work-foot{display:flex;align-items:center;gap:18px;flex-wrap:wrap;font-size:12.5px;color:var(--muted);font-family:var(--font-body)}",
      ".work-stats span{margin-right:14px;color:var(--faint)}",
      ".work-updated{color:var(--faint);font-size:11.5px}",
      ".lang-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}",
      ".topic-tag{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);border:1px solid var(--line);border-radius:999px;padding:4px 12px}",
      ".work-empty{color:var(--muted);font-size:15px;line-height:1.7;padding:32px 0;font-style:italic;font-family:var(--font-body)}",
      ".timeline{position:relative;padding-left:34px;max-width:780px}",
      ".timeline::before{content:\"\";position:absolute;left:8px;top:6px;bottom:6px;width:1px;background:linear-gradient(180deg,var(--accent-dim)," + rgba(v.rgb, 0.05) + ")}",
      ".t-item{position:relative;padding-bottom:30px}",
      ".t-text{font-size:14.5px;line-height:1.65;font-family:var(--font-body);margin:0;color:var(--ink)}",
      ".t-text a{color:var(--accent-2);text-decoration:none}",
      ".t-date{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);margin:5px 0 0;font-family:var(--font-body)}",
      ".timeline-empty{color:var(--muted);font-style:italic;font-size:14.5px;font-family:var(--font-body)}",
      ".lang-bar{display:flex;height:16px;border-radius:999px;overflow:hidden;background:var(--bg-2);border:1px solid var(--line);margin-bottom:26px}",
      ".lang-seg{height:100%}",
      ".lang-legend{display:flex;flex-wrap:wrap;gap:12px 30px;font-family:var(--font-body)}",
      ".lang-item{display:flex;align-items:center;font-size:13.5px;color:var(--muted)}",
      ".lang-item .pct{color:var(--faint);margin-left:8px;font-size:12px}",
      ".journey{list-style:none;margin:0;padding:0}",
      ".journey li{display:grid;grid-template-columns:90px 1fr;gap:28px;padding:30px 0;border-bottom:1px solid " + rgba(v.rgb, 0.12) + "}",
      ".journey li:first-child{border-top:1px solid " + rgba(v.rgb, 0.12) + "}",
      ".j-num{font-family:var(--font-display);font-style:italic;font-size:1.3rem;color:var(--accent)}",
      ".j-title{font-family:var(--font-display);font-size:1.6rem;font-weight:600;margin:0 0 6px}",
      ".j-detail{color:var(--muted);font-size:14px;line-height:1.65;margin:0;font-family:var(--font-body)}",
      ".j-detail a{color:var(--accent-2);text-decoration:none}",
      ".contact-sub{color:var(--muted);font-size:16px;line-height:1.7;margin:0 0 36px;max-width:560px;font-family:var(--font-body)}",
      ".contact-actions{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:26px}",
      ".btn-gold{display:inline-block;font-family:var(--font-body);font-size:15px;font-weight:500;color:#14100a;background:linear-gradient(135deg,var(--accent-2),var(--accent));border-radius:999px;padding:16px 34px;text-decoration:none;margin:0 10px 10px 0}",
      ".btn-ghost{display:inline-block;font-family:var(--font-body);font-size:13px;color:var(--ink);border:1px solid var(--line);border-radius:999px;padding:12px 24px;text-decoration:none;margin:0 10px 10px 0}",
      ".social-chips{display:flex;flex-wrap:wrap;gap:10px}",
      ".social-chip{display:inline-block;font-size:12.5px;color:var(--muted);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:9px 18px;margin:0 10px 10px 0;font-family:var(--font-body)}",
      ".pf-footer{text-align:center;padding:24px 0 64px;color:var(--faint);font-size:13px;font-family:var(--font-body)}",
      ".pf-footer strong{font-weight:500;color:var(--muted)}",
      ".footer-rule{height:1px;max-width:520px;margin:0 auto 28px;background:linear-gradient(90deg,transparent,var(--accent-dim),transparent)}",
      ".brand-mark{color:var(--accent);font-size:.8em;margin-right:6px}",
      ".reveal{opacity:1}",
      ".motion-on .reveal{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .8s cubic-bezier(.22,1,.36,1)}",
      ".motion-on .reveal.in{opacity:1;transform:translateY(0)}",
      "@media(max-width:900px){.stats{grid-template-columns:repeat(3,1fr)}.work-card{grid-template-columns:72px 1fr;gap:20px}}",
      "@media(max-width:640px){.hero{flex-direction:column;text-align:center;gap:32px}.stats{grid-template-columns:repeat(2,1fr)}.work-card{grid-template-columns:1fr;gap:12px;padding:32px 0}.work-index{font-size:2.2rem}.journey li{grid-template-columns:1fr;gap:6px}.pf{padding-top:56px}.pf section{margin-bottom:72px}}",
      "@media(prefers-reduced-motion:reduce){.motion-on .reveal{opacity:1;transform:none;transition:none}.orb{animation:none}}"
    ];

    if (cust.density === "compact") {
      R.push(".pf section{margin-bottom:52px}");
      R.push(".hero{margin-bottom:56px}");
      R.push(".work-card{padding:28px 0}");
      R.push(".stat{padding:20px 12px}");
    }

    return root + "\n" + R.join("\n");
  }

  /* self-contained motion script for the exported HTML */
  function exportMotionJS(accent) {
    return "(function(){\n'use strict';\n" +
      "var mq=window.matchMedia;\n" +
      "if(mq&&mq('(prefers-reduced-motion: reduce)').matches)return;\n" +
      "var fine=mq&&mq('(hover: hover) and (pointer: fine)').matches;\n" +
      "document.documentElement.className+=' motion-on';\n" +
      "var ACC='" + accent + "';\n" +
      "var hero=document.querySelector('.hero');\n" +
      "var rev=document.querySelectorAll('.reveal');\n" +
      "function showEl(el,i){el.style.transitionDelay=((i%4)*70)+'ms';el.classList.add('in');}\n" +
      "if('IntersectionObserver' in window){\n" +
      "var io=new IntersectionObserver(function(es){for(var k=0;k<es.length;k++){if(es[k].isIntersecting){var idx=Array.prototype.indexOf.call(rev,es[k].target);showEl(es[k].target,idx);io.unobserve(es[k].target);}}},{threshold:0.08,rootMargin:'0px 0px -6% 0px'});\n" +
      "for(var r=0;r<rev.length;r++)io.observe(rev[r]);\n" +
      "}else{for(var r2=0;r2<rev.length;r2++)showEl(rev[r2],r2);}\n" +
      "if(fine){\n" +
      "var cards=document.querySelectorAll('.work-card');\n" +
      "for(var c=0;c<cards.length;c++)(function(card){\n" +
      "var glare=card.querySelector('.glare');\n" +
      "card.addEventListener('mousemove',function(ev){var b=card.getBoundingClientRect();var px=(ev.clientX-b.left)/b.width-0.5,py=(ev.clientY-b.top)/b.height-0.5;card.classList.add('tilting');card.style.transform='perspective(1200px) rotateX('+(-py*4).toFixed(2)+'deg) rotateY('+(px*5).toFixed(2)+'deg)';if(glare){glare.style.setProperty('--mx',((px+0.5)*100).toFixed(1)+'%');glare.style.setProperty('--my',((py+0.5)*100).toFixed(1)+'%');}});\n" +
      "card.addEventListener('mouseleave',function(){card.classList.remove('tilting');card.style.transform='';});\n" +
      "})(cards[c]);\n" +
      "if(hero){var layers=hero.querySelectorAll('[data-depth]');var orbs=document.querySelector('.fx-orbs');var tx=0,ty=0,cx=0,cy=0,raf=0;\n" +
      "function tick(){cx+=(tx-cx)*0.09;cy+=(ty-cy)*0.09;for(var i=0;i<layers.length;i++){var d=parseFloat(layers[i].getAttribute('data-depth'))||10;layers[i].style.transform='translate3d('+(cx*d*1.6).toFixed(1)+'px,'+(cy*d*1.6).toFixed(1)+'px,0)';}if(orbs)orbs.style.transform='translate3d('+(cx*-22).toFixed(1)+'px,'+(cy*-16).toFixed(1)+'px,0)';if(Math.abs(tx-cx)>0.0008||Math.abs(ty-cy)>0.0008){raf=requestAnimationFrame(tick);}else{raf=0;}}\n" +
      "function kick(){if(!raf)raf=requestAnimationFrame(tick);}\n" +
      "hero.addEventListener('mousemove',function(ev){var b=hero.getBoundingClientRect();tx=(ev.clientX-b.left)/b.width-0.5;ty=(ev.clientY-b.top)/b.height-0.5;kick();});\n" +
      "hero.addEventListener('mouseleave',function(){tx=0;ty=0;kick();});}}\n" +
      "var cv=document.getElementById('pf-particles');\n" +
      "if(cv&&hero){var ctx=cv.getContext('2d');var dpr=Math.min(2,window.devicePixelRatio||1);var N=window.innerWidth<640?28:70;var W=0,H=0,run=true;\n" +
      "function size(){var b=hero.getBoundingClientRect();W=Math.max(1,b.width);H=Math.max(1,b.height);cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}\n" +
      "function mk(init){return{x:Math.random()*W,y:init?Math.random()*H:H+10,r:Math.random()*1.7+0.5,s:Math.random()*0.32+0.08,o:Math.random()*0.45+0.15,ph:Math.random()*6.283};}\n" +
      "var ps=[];size();for(var p=0;p<N;p++)ps.push(mk(true));\n" +
      "window.addEventListener('resize',size);\n" +
      "function frame(t){requestAnimationFrame(frame);if(!run||document.hidden)return;ctx.clearRect(0,0,W,H);for(var i=0;i<ps.length;i++){var pt=ps[i];pt.y-=pt.s;pt.x+=Math.sin(t/1600+pt.ph)*0.12;if(pt.y<-12){ps[i]=mk(false);continue;}var tw=pt.o*(0.6+0.4*Math.sin(t/700+pt.ph));ctx.globalAlpha=tw;ctx.fillStyle=ACC;ctx.beginPath();ctx.arc(pt.x,pt.y,pt.r,0,6.283);ctx.fill();}ctx.globalAlpha=1;}\n" +
      "requestAnimationFrame(frame);\n" +
      "document.addEventListener('visibilitychange',function(){run=!document.hidden;});\n" +
      "if('IntersectionObserver' in window){new IntersectionObserver(function(es){run=es[0].isIntersecting&&!document.hidden;}).observe(hero);}}\n" +
      "})();";
  }

  function downloadHTML() {
    var name = $("pf-name").textContent || lastUsername;
    var t = themeByKey(cust.theme);
    var withMotion = motionActive();

    var root = $("view-portfolio").cloneNode(true);
    ["toolbar", "drawer"].forEach(function (cls) {
      var el = root.querySelector("." + cls);
      if (el) el.remove();
    });
    var scrimEl = root.querySelector("#drawer-scrim");
    if (scrimEl) scrimEl.remove();
    root.querySelectorAll("[hidden]").forEach(function (el) { el.remove(); });
    root.querySelectorAll(".work-excerpt.loading").forEach(function (el) {
      el.classList.remove("loading");
      el.innerHTML = '<span style="font-style:normal">README excerpt not loaded yet.</span>';
    });
    /* reset transient motion state so the file opens clean */
    root.querySelectorAll(".in").forEach(function (el) { el.classList.remove("in"); });
    root.querySelectorAll(".reveal").forEach(function (el) { el.style.transitionDelay = ""; });
    root.querySelectorAll(".work-card").forEach(function (el) {
      el.classList.remove("tilting"); el.style.transform = "";
    });
    root.querySelectorAll(".hero [data-depth]").forEach(function (el) { el.style.transform = ""; });
    var orbsEl = root.querySelector(".fx-orbs");
    if (orbsEl) orbsEl.style.transform = "";
    root.querySelectorAll("script").forEach(function (el) { el.remove(); });

    var main = root.querySelector("main.portfolio");
    var fx = withMotion
      ? '<div class="fx-orbs" aria-hidden="true"><div class="orb orb-1"></div><div class="orb orb-2"></div><div class="orb orb-3"></div></div>\n'
      : "";
    var hero = main.querySelector("#sec-hero");
    if (withMotion && hero && !hero.querySelector("#pf-particles")) {
      hero.insertAdjacentHTML("afterbegin", '<canvas id="pf-particles" aria-hidden="true"></canvas>');
    }
    var script = withMotion ? '<script>\n' + exportMotionJS(t.accent) + "\n</script>\n" : "";

    var doc = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n" +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
      "<title>" + esc(name) + " — Portfolio</title>\n<style>\n" + exportCSS() + "\n</style>\n</head>\n<body>\n" +
      fx + '<main class="wrap pf">\n' + main.innerHTML + "\n</main>\n" + script + "</body>\n</html>";

    var blob = new Blob([doc], { type: "text/html" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = lastUsername.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-portfolio.html";
    document.body.appendChild(link);
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); link.remove(); }, 500);
  }

  /* ── events ── */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    generate(input.value);
  });

  document.querySelectorAll(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      input.value = chip.getAttribute("data-user");
      generate(input.value);
    });
  });

  $("retry-btn").addEventListener("click", function () { generate(lastUsername); });
  $("error-back-btn").addEventListener("click", function () { show("generator"); });
  $("startover-btn").addEventListener("click", function () { show("generator"); });
  $("download-btn").addEventListener("click", downloadHTML);

  $("customize-btn").addEventListener("click", openDrawer);
  $("drawer-close").addEventListener("click", closeDrawer);
  $("drawer-scrim").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawerOpen()) closeDrawer();
  });

  /* init */
  buildPanel();
  applyCustomize();
})();

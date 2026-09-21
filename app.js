/* ═══════════════ PortfolioForge — app logic ═══════════════ */
(function () {
  "use strict";

  var API = "https://api.github.com";

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

  function show(name) {
    Object.keys(views).forEach(function (k) { views[k].hidden = (k !== name); });
    window.scrollTo(0, 0);
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

  /* ── render ── */
  function renderPortfolio(data) {
    var user = data.user, repos = data.repos;

    /* hero */
    var avatar = $("pf-avatar");
    avatar.src = user.avatar_url + "&s=336";
    avatar.alt = (user.name || user.login) + "'s avatar";
    $("pf-name").textContent = user.name || user.login;
    $("pf-tagline").textContent = user.bio || "Software Developer";
    var loc = $("pf-location");
    if (user.location) { loc.textContent = user.location; loc.style.display = ""; }
    else { loc.style.display = "none"; }
    $("pf-meta-sep").style.display = user.location ? "" : "none";
    var gh = $("pf-github");
    gh.textContent = "github.com/" + user.login;
    gh.href = user.html_url;

    /* about */
    var aboutBio = $("about-bio");
    if (user.bio) { aboutBio.textContent = user.bio; }
    else { aboutBio.textContent = "This developer hasn't written a public bio yet — the work below speaks for them."; }
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
        card.className = "work-card";
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
      $("lang-section").style.display = "none";
    } else {
      $("lang-section").style.display = "";
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

    /* re-trigger reveal animations */
    views.portfolio.querySelectorAll(".reveal").forEach(function (el) {
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "";
    });

    /* lazy README excerpts after first paint */
    if (top.length) {
      setTimeout(function () { loadReadmes(top); }, 60);
    }
  }

  /* ── export standalone HTML ── */
  function exportCSS() {
    return [
      "body{background:#0b0a08;color:#ece5d8;font-family:Georgia,'Times New Roman',serif;margin:0;padding:0;-webkit-font-smoothing:antialiased}",
      ".wrap{max-width:1120px;margin:0 auto;padding:0 24px}",
      ".pf{padding:84px 24px 40px;max-width:1120px;margin:0 auto}",
      ".sec-eyebrow{font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#97907f;margin-bottom:16px;font-family:Arial,sans-serif}",
      ".sec-num{color:#c9a24b}",
      "h2.sec-title{font-size:clamp(2.2rem,5vw,3.4rem);font-weight:500;margin:0 0 26px;line-height:1.05}",
      ".hairline{height:1px;margin-bottom:44px;background:linear-gradient(90deg,rgba(201,162,75,.28),rgba(201,162,75,.06) 55%,transparent)}",
      ".section-note{font-family:Arial,sans-serif;font-size:14px;color:#5f5a4e;font-weight:300}",
      ".inline-note{font-size:13px;color:#97907f;line-height:1.7;border:1px solid rgba(201,162,75,.16);border-radius:12px;background:#12100d;padding:14px 20px;margin-bottom:28px;font-family:Arial,sans-serif}",
      ".pf section{margin-bottom:96px}",
      ".hero{display:flex;gap:48px;align-items:center;margin-bottom:96px}",
      ".avatar{width:168px;height:168px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid rgba(201,162,75,.4);padding:7px;background:#12100d}",
      "h1{font-size:clamp(3rem,8vw,5.6rem);font-weight:600;line-height:1.02;margin:0 0 18px}",
      ".pf-tagline{font-style:italic;font-size:1.5rem;color:#e8c876;line-height:1.5;max-width:640px;margin:0 0 22px}",
      ".pf-meta{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#5f5a4e;margin-bottom:30px;font-family:Arial,sans-serif}",
      ".pf-meta a{color:#c9a24b;text-decoration:none}",
      ".scroll-cue{display:none}",
      ".about-bio{font-size:17px;line-height:1.9;max-width:780px;margin:0 0 22px;font-family:Arial,sans-serif;font-weight:300}",
      ".about-meta{font-size:13px;letter-spacing:.1em;color:#97907f;margin-bottom:52px;line-height:2;font-family:Arial,sans-serif}",
      ".about-meta a{color:#c9a24b;text-decoration:none}",
      ".stats{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:rgba(201,162,75,.16);border:1px solid rgba(201,162,75,.16);border-radius:16px;overflow:hidden}",
      ".stat{background:#12100d;padding:30px 18px;text-align:center}",
      ".stat-num{display:block;font-family:Georgia,serif;font-size:2.4rem;color:#e8c876;margin-bottom:6px}",
      ".stat-label{font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:#97907f;font-family:Arial,sans-serif}",
      ".work-card{display:grid;grid-template-columns:110px 1fr;gap:32px;padding:44px 0;border-bottom:1px solid rgba(201,162,75,.12)}",
      ".work-card:first-child{border-top:1px solid rgba(201,162,75,.12)}",
      ".work-index{font-family:Georgia,serif;font-weight:600;font-size:3.4rem;color:#c9a24b;line-height:1;opacity:.55}",
      ".work-kicker{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin-bottom:14px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#5f5a4e;font-family:Arial,sans-serif}",
      ".topic-tag{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#c9a24b;border:1px solid rgba(201,162,75,.16);border-radius:999px;padding:4px 12px}",
      ".work-name{font-size:2rem;font-weight:600;margin:0 0 12px;line-height:1.15}",
      ".work-name a{color:#ece5d8;text-decoration:none}",
      ".work-desc{color:#97907f;font-size:15px;line-height:1.7;max-width:720px;margin:0 0 18px;font-family:Arial,sans-serif}",
      ".work-excerpt{border-left:2px solid rgba(201,162,75,.4);padding:4px 0 4px 18px;margin-bottom:20px;color:#97907f;line-height:1.75;font-style:italic;font-size:15px;max-width:720px}",
      ".excerpt-label{display:block;font-family:Arial,sans-serif;font-style:normal;font-size:10.5px;letter-spacing:.26em;text-transform:uppercase;color:#5f5a4e;margin-bottom:8px}",
      ".work-foot{display:flex;align-items:center;gap:18px;flex-wrap:wrap;font-size:12.5px;color:#97907f;font-family:Arial,sans-serif}",
      ".lang-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}",
      ".work-stats span{margin-right:14px;color:#5f5a4e}",
      ".work-updated{color:#5f5a4e;font-size:11.5px}",
      ".timeline{position:relative;padding-left:34px;max-width:780px}",
      ".t-item{position:relative;padding-bottom:30px}",
      ".t-text{font-size:14.5px;line-height:1.65;font-family:Arial,sans-serif;margin:0}",
      ".t-text a{color:#e8c876;text-decoration:none}",
      ".t-text em{font-style:italic}",
      ".t-date{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#5f5a4e;margin:5px 0 0;font-family:Arial,sans-serif}",
      ".lbar{display:flex;height:16px;border-radius:999px;overflow:hidden;background:#1a1712;border:1px solid rgba(201,162,75,.16);margin-bottom:26px}",
      ".lbar div{height:100%}",
      ".lang-legend{font-family:Arial,sans-serif;font-size:13.5px;color:#97907f}",
      ".lang-item{margin-right:28px;white-space:nowrap}",
      ".lang-item .pct{color:#5f5a4e;margin-left:8px;font-size:12px}",
      ".journey{list-style:none;margin:0;padding:0}",
      ".journey li{display:grid;grid-template-columns:90px 1fr;gap:28px;padding:30px 0;border-bottom:1px solid rgba(201,162,75,.12)}",
      ".journey li:first-child{border-top:1px solid rgba(201,162,75,.12)}",
      ".j-num{font-style:italic;font-size:1.3rem;color:#c9a24b}",
      ".j-title{font-size:1.6rem;font-weight:600;margin:0 0 6px}",
      ".j-detail{color:#97907f;font-size:14px;line-height:1.65;margin:0;font-family:Arial,sans-serif}",
      ".j-detail a{color:#e8c876;text-decoration:none}",
      ".contact-sub{color:#97907f;font-size:16px;line-height:1.7;margin:0 0 36px;max-width:560px;font-family:Arial,sans-serif}",
      ".contact-actions{margin-bottom:26px}",
      ".btn-gold{display:inline-block;font-family:Arial,sans-serif;font-size:15px;color:#14100a;background:#c9a24b;border-radius:999px;padding:16px 34px;text-decoration:none;margin:0 10px 10px 0}",
      ".btn-ghost{display:inline-block;font-family:Arial,sans-serif;font-size:13px;color:#ece5d8;border:1px solid rgba(201,162,75,.16);border-radius:999px;padding:12px 24px;text-decoration:none;margin:0 10px 10px 0}",
      ".social-chip{display:inline-block;font-size:12.5px;color:#97907f;text-decoration:none;border:1px solid rgba(201,162,75,.16);border-radius:999px;padding:9px 18px;margin:0 10px 10px 0;font-family:Arial,sans-serif}",
      "footer.pf-footer, .pf-footer{text-align:center;padding:24px 0 64px;color:#5f5a4e;font-size:13px;font-family:Arial,sans-serif}",
      ".footer-rule{height:1px;max-width:520px;margin:0 auto 28px;background:linear-gradient(90deg,transparent,rgba(201,162,75,.28),transparent)}",
      "@media(max-width:640px){.hero{flex-direction:column;text-align:center}.stats{grid-template-columns:repeat(2,1fr)}.work-card{grid-template-columns:1fr;gap:12px}.journey li{grid-template-columns:1fr;gap:6px}}"
    ].join("\n");
  }

  function downloadHTML() {
    var name = $("pf-name").textContent || lastUsername;
    var root = $("view-portfolio").cloneNode(true);
    var tb = root.querySelector(".toolbar");
    if (tb) tb.remove();
    root.querySelectorAll("[hidden]").forEach(function (el) { el.remove(); });
    root.querySelectorAll(".work-excerpt.loading").forEach(function (el) {
      el.classList.remove("loading");
      el.innerHTML = '<span style="font-style:normal">README excerpt not loaded yet.</span>';
    });
    root.querySelectorAll(".reveal").forEach(function (el) { el.classList.remove("reveal"); });
    root.querySelectorAll("script").forEach(function (el) { el.remove(); });

    var doc = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n" +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
      "<title>" + esc(name) + " — Portfolio</title>\n<style>\n" + exportCSS() + "\n</style>\n</head>\n<body>\n" +
      '<main class="wrap pf">\n' + root.querySelector("main.portfolio").innerHTML + "\n</main>\n</body>\n</html>";

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
})();

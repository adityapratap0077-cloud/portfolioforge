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

  function fmtDate(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
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

  function generate(username) {
    username = (username || "").trim().replace(/^@/, "");
    if (!username) { input.focus(); return; }
    lastUsername = username;
    show("loading");

    Promise.all([
      api(API + "/users/" + encodeURIComponent(username)),
      api(API + "/users/" + encodeURIComponent(username) + "/repos?per_page=100&sort=updated")
    ]).then(function (results) {
      renderPortfolio(results[0], results[1]);
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

  /* ── render ── */
  function renderPortfolio(user, repos) {
    /* hero */
    var avatar = $("pf-avatar");
    avatar.src = user.avatar_url + "&s=296";
    avatar.alt = (user.name || user.login) + "'s avatar";
    $("pf-name").textContent = user.name || user.login;
    $("pf-bio").textContent = user.bio || "GitHub developer — portfolio forged from public activity.";
    $("pf-bio").style.display = user.bio ? "" : "none";
    var loc = $("pf-location");
    if (user.location) { loc.textContent = user.location; loc.style.display = ""; }
    else { loc.style.display = "none"; }
    $("pf-meta-sep").style.display = user.location ? "" : "none";
    var gh = $("pf-github");
    gh.textContent = "github.com/" + user.login;
    gh.href = user.html_url;

    /* stats */
    var totalStars = 0, totalForks = 0;
    repos.forEach(function (r) { totalStars += r.stargazers_count || 0; totalForks += r.forks_count || 0; });
    $("st-repos").textContent = fmtNum(user.public_repos);
    $("st-followers").textContent = fmtNum(user.followers);
    $("st-stars").textContent = fmtNum(totalStars);
    $("st-forks").textContent = fmtNum(totalForks);

    /* top repos */
    var top = repos
      .filter(function (r) { return !r.fork; })
      .sort(function (a, b) { return (b.stargazers_count || 0) - (a.stargazers_count || 0); })
      .slice(0, 6);
    if (top.length === 0) {
      top = repos.slice().sort(function (a, b) {
        return (b.stargazers_count || 0) - (a.stargazers_count || 0);
      }).slice(0, 6);
    }
    var grid = $("work-grid");
    grid.innerHTML = "";
    var numerals = ["I", "II", "III", "IV", "V", "VI"];
    top.forEach(function (r, i) {
      var card = document.createElement("article");
      card.className = "repo-card";
      var lang = r.language
        ? '<span><span class="lang-dot" style="background:' + langColor(r.language) + '"></span>' + esc(r.language) + "</span>"
        : '<span style="color:var(--faint)">—</span>';
      card.innerHTML =
        '<div class="repo-top">' +
          '<h3 class="repo-name"><a href="' + esc(r.html_url) + '" target="_blank" rel="noopener">' + esc(r.name) + "</a></h3>" +
          '<span class="repo-rank">' + numerals[i] + "</span>" +
        "</div>" +
        (r.description ? '<p class="repo-desc">' + esc(r.description) + "</p>" : '<p class="repo-desc" style="color:var(--faint);font-style:italic">No description provided.</p>') +
        '<div class="repo-foot">' + lang +
          '<span class="repo-stats"><span>★ ' + fmtNum(r.stargazers_count || 0) + "</span>" +
          "<span>⑂ " + fmtNum(r.forks_count || 0) + "</span></span>" +
          '<span class="repo-updated">Updated ' + fmtDate(r.updated_at) + "</span>" +
        "</div>";
      grid.appendChild(card);
    });

    /* languages — by repository count */
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

    /* re-trigger reveal animations */
    var portfolio = views.portfolio;
    portfolio.querySelectorAll(".reveal").forEach(function (el) {
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "";
    });
  }

  /* ── export standalone HTML ── */
  function exportCSS() {
    return [
      "body{background:#0b0a08;color:#ece5d8;font-family:Georgia,'Times New Roman',serif;margin:0;padding:0;-webkit-font-smoothing:antialiased}",
      ".wrap{max-width:1120px;margin:0 auto;padding:0 24px}",
      ".pf{padding:72px 24px 40px;max-width:1120px;margin:0 auto}",
      ".hero{display:flex;gap:40px;align-items:center;margin-bottom:64px}",
      ".avatar{width:148px;height:148px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid rgba(201,162,75,.4);padding:6px;background:#12100d}",
      ".eyebrow{font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:#c9a24b;margin-bottom:18px;font-family:Arial,sans-serif}",
      "h1{font-size:clamp(2.4rem,5.5vw,4rem);font-weight:600;line-height:1.05;margin:0 0 14px}",
      ".bio{color:#97907f;font-size:16.5px;line-height:1.75;max-width:620px;margin-bottom:16px;font-family:Arial,sans-serif}",
      ".meta{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#5f5a4e;font-family:Arial,sans-serif}",
      ".meta a{color:#c9a24b;text-decoration:none}",
      ".stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(201,162,75,.16);border:1px solid rgba(201,162,75,.16);border-radius:16px;overflow:hidden;margin-bottom:80px}",
      ".stat{background:#12100d;padding:30px 24px;text-align:center}",
      ".stat b{display:block;font-size:2.4rem;color:#e8c876;margin-bottom:6px}",
      ".stat span{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#97907f;font-family:Arial,sans-serif}",
      "h2{font-size:2.2rem;font-weight:500;margin-bottom:36px}",
      ".grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:80px}",
      ".card{background:#14120e;border:1px solid rgba(201,162,75,.16);border-radius:16px;padding:28px 26px;display:flex;flex-direction:column}",
      ".card h3{font-size:1.4rem;margin:0 0 12px}.card h3 a{color:#ece5d8;text-decoration:none}",
      ".card p{color:#97907f;font-size:14px;line-height:1.65;flex:1;margin:0 0 20px;font-family:Arial,sans-serif}",
      ".foot{border-top:1px solid rgba(201,162,75,.1);padding-top:16px;font-size:12.5px;color:#97907f;font-family:Arial,sans-serif}",
      ".dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}",
      ".lbar{display:flex;height:14px;border-radius:999px;overflow:hidden;background:#1a1712;border:1px solid rgba(201,162,75,.16);margin-bottom:22px}",
      ".lbar div{height:100%}",
      ".legend{font-family:Arial,sans-serif;font-size:13px;color:#97907f}",
      ".legend span{margin-right:22px}",
      "footer{text-align:center;padding:24px 0 64px;color:#5f5a4e;font-size:13px;font-family:Arial,sans-serif}",
      "@media(max-width:640px){.hero{flex-direction:column;text-align:center}.stats{grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:1fr}}"
    ].join("\n");
  }

  function downloadHTML() {
    var name = $("pf-name").textContent || lastUsername;
    var avatar = $("pf-avatar").src;
    var bio = $("pf-bio").textContent;
    var bioHtml = $("pf-bio").style.display === "none" ? "" : '<p class="bio">' + esc(bio) + "</p>";
    var loc = $("pf-location").textContent;
    var metaHtml = (loc ? esc(loc) + " · " : "") +
      '<a href="' + esc($("pf-github").href) + '">' + esc($("pf-github").textContent) + "</a>";

    var stats = ["st-repos", "st-followers", "st-stars", "st-forks"]
      .map(function (id, i) {
        var labels = ["Public repos", "Followers", "Total stars", "Total forks"];
        return '<div class="stat"><b>' + esc($(id).textContent) + "</b><span>" + labels[i] + "</span></div>";
      }).join("");

    var cards = "";
    Array.prototype.forEach.call($("work-grid").children, function (card) {
      var a = card.querySelector(".repo-name a");
      var desc = card.querySelector(".repo-desc").textContent;
      var footBits = card.querySelectorAll(".repo-foot > span");
      var langHtml = footBits[0] ? footBits[0].innerHTML : "";
      var counts = card.querySelector(".repo-stats")
        ? card.querySelector(".repo-stats").textContent : "";
      var updated = card.querySelector(".repo-updated")
        ? card.querySelector(".repo-updated").textContent : "";
      cards += '<div class="card"><h3><a href="' + esc(a.href) + '">' + esc(a.textContent) +
        '</a></h3><p>' + esc(desc) + '</p><div class="foot">' + langHtml +
        " &nbsp;·&nbsp; " + esc(counts) + "<br>" + esc(updated) + "</div></div>";
    });

    var langSection = "";
    if ($("lang-section").style.display !== "none") {
      var segs = "", items = "";
      Array.prototype.forEach.call($("lang-bar").children, function (s) {
        segs += '<div style="flex-grow:' + s.style.flexGrow + ";background:" + s.style.background + '"></div>';
      });
      Array.prototype.forEach.call($("lang-legend").children, function (it) {
        items += "<span>" + it.innerHTML + "</span> ";
      });
      langSection = '<p class="eyebrow">Toolbox</p><h2>Languages</h2><div class="lbar">' +
        segs + '</div><div class="legend">' + items + "</div>";
    }

    var doc = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n" +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
      "<title>" + esc(name) + " — Portfolio</title>\n<style>\n" + exportCSS() + "\n</style>\n</head>\n<body>\n" +
      '<main class="pf">\n<header class="hero">\n' +
      '<img class="avatar" src="' + esc(avatar) + '" alt="' + esc(name) + '">\n<div>\n' +
      '<p class="eyebrow">Portfolio · forged from GitHub</p>\n<h1>' + esc(name) + "</h1>\n" +
      bioHtml + '<p class="meta">' + metaHtml + "</p>\n</div>\n</header>\n" +
      '<section class="stats">' + stats + "</section>\n" +
      '<p class="eyebrow">Selected Work</p><h2>Top repositories</h2>\n<div class="grid">' + cards + "</div>\n" +
      langSection + "\n" +
      "<footer><p>Forged with ◆ <strong>PortfolioForge</strong> — from public GitHub data.</p></footer>\n" +
      "</main>\n</body>\n</html>";

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

/* ═══════════════ PortfolioForge — app logic ═══════════════
   100% client-side. Themes, fonts, motion & content customization are
   applied via data-attributes on #view-portfolio and persisted to localStorage. */
(function () {
  "use strict";

  var API = "https://api.github.com";

  /* ── themes: 8 designed worlds, each one confident, each one quiet ── */
  var THEMES = [
    { key: "paper", name: "Paper", hint: "Warm editorial, quiet confidence",
      accent: "#D9480F", accent2: "#B53A10", bg: "#F6F3EC",
      vars: { bg: "#F6F3EC", bg2: "#ECE7D8", surface: "#FFFFFF", ink: "#1D1A16",
              muted: "#6E6557", faint: "#A79B84", accent: "#D9480F", accent2: "#B53A10", onAccent: "#FFF6EC",
              line: "#DCD4BE", lineSoft: "#E9E2D0", rgb: [217, 72, 15] } },
    { key: "ink", name: "Ink", hint: "Dark studio, after hours",
      accent: "#E86A1F", accent2: "#FF8A3D", bg: "#161310",
      vars: { bg: "#161310", bg2: "#1C1815", surface: "#211C17", ink: "#F0E9DB",
              muted: "#A89A83", faint: "#6E6250", accent: "#E86A1F", accent2: "#FF8A3D", onAccent: "#200E02",
              line: "#383026", lineSoft: "#2A231B", rgb: [232, 106, 31] } },
    { key: "forest", name: "Forest", hint: "Deep green, an amber voice",
      accent: "#E8A33D", accent2: "#F2C14E", bg: "#1C3327",
      vars: { bg: "#1C3327", bg2: "#162A20", surface: "#24402F", ink: "#EDE8D6",
              muted: "#A9B896", faint: "#71816A", accent: "#E8A33D", accent2: "#F2C14E", onAccent: "#241A04",
              line: "#33503D", lineSoft: "#294433", rgb: [232, 163, 61] } },
    { key: "cobalt", name: "Cobalt", hint: "Crisp, precise blue",
      accent: "#1F5FE0", accent2: "#1749B3", bg: "#F6F8FB",
      vars: { bg: "#F6F8FB", bg2: "#E9EDF3", surface: "#FFFFFF", ink: "#14171C",
              muted: "#5D6672", faint: "#9AA3AD", accent: "#1F5FE0", accent2: "#1749B3", onAccent: "#F2F6FF",
              line: "#D9DEE4", lineSoft: "#E6EAEF", rgb: [31, 95, 224] } },
    { key: "clay", name: "Clay", hint: "Warm craft, softened edges",
      accent: "#B4441F", accent2: "#933515", bg: "#F4EEE7",
      vars: { bg: "#F4EEE7", bg2: "#EAE0D0", surface: "#FDFBF7", ink: "#231A12",
              muted: "#6F5F4E", faint: "#A89478", accent: "#B4441F", accent2: "#933515", onAccent: "#FBF1E8",
              line: "#DCCDB8", lineSoft: "#E8DCC9", rgb: [180, 68, 31] } },
    { key: "slate", name: "Slate", hint: "Cool neutral, engineered",
      accent: "#0E6E8C", accent2: "#0A556D", bg: "#ECEFF1",
      vars: { bg: "#ECEFF1", bg2: "#DFE4E7", surface: "#FFFFFF", ink: "#1A2025",
              muted: "#5C686F", faint: "#939EA5", accent: "#0E6E8C", accent2: "#0A556D", onAccent: "#EFFAFF",
              line: "#C3CCD1", lineSoft: "#D2D9DD", rgb: [14, 110, 140] } },
    { key: "dusk", name: "Dusk", hint: "Night gold",
      accent: "#E8B33D", accent2: "#F2C14E", bg: "#14161B",
      vars: { bg: "#14161B", bg2: "#1A1D23", surface: "#20242C", ink: "#E9EBEF",
              muted: "#9AA1AB", faint: "#646B74", accent: "#E8B33D", accent2: "#F2C14E", onAccent: "#221A06",
              line: "#2C313A", lineSoft: "#242932", rgb: [232, 179, 61] } },
    { key: "mono", name: "Mono", hint: "Stark black and white, one red pop",
      accent: "#D92D20", accent2: "#B42318", bg: "#FAFAF8",
      vars: { bg: "#FAFAF8", bg2: "#EFEFEA", surface: "#FFFFFF", ink: "#141414",
              muted: "#5F5F5C", faint: "#A3A39E", accent: "#D92D20", accent2: "#B42318", onAccent: "#FFF3F1",
              line: "#DCDCD6", lineSoft: "#E8E8E2", rgb: [217, 45, 32] } }
  ];

  /* typography: Clash Display for headlines, Zodiak for the editorial serif,
     Archivo for body, IBM Plex Mono for data labels (all self-hosted, system fallbacks) */
  var ARCHIVO_STACK = '"Archivo",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  var CLASH_STACK = '"Clash Display","Archivo",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  var ZODIAK_STACK = '"Zodiak",Georgia,"Times New Roman",serif';
  var MONO_STACK = '"IBM Plex Mono",ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace';
  var FONTS = [
    { key: "grotesk", name: "Grotesk", hint: "Confident display voice, set in caps",
      display: CLASH_STACK, body: ARCHIVO_STACK, mono: MONO_STACK, faces: "Clash Display" },
    { key: "editorial", name: "Editorial", hint: "Literary serif voice, calm sentence case",
      display: ZODIAK_STACK, body: ARCHIVO_STACK, mono: MONO_STACK, faces: "Zodiak" },
    { key: "technical", name: "Technical", hint: "Condensed caps, precise voice",
      display: ARCHIVO_STACK, body: ARCHIVO_STACK, mono: MONO_STACK, faces: "Archivo" },
    { key: "mono", name: "Mono", hint: "Monospace voice, terminal calm",
      display: MONO_STACK, body: ARCHIVO_STACK, mono: MONO_STACK, faces: "IBM Plex Mono" }
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

  /* ── mode: "github" | "resume" ── */
  var mode = "github";

  /* per-mode section config: key → section element, nav label, toggleable? */
  var MODE_SECTIONS = {
    github: [
      { key: "work",     sec: "sec-work",     label: "Work",     toggle: false },
      { key: "activity", sec: "sec-activity", label: "Activity", toggle: true },
      { key: "stack",    sec: "sec-stack",    label: "Stack",    toggle: true },
      { key: "journey",  sec: "sec-journey",  label: "Journey",  toggle: true }
    ],
    resume: [
      { key: "projects",   sec: "sec-work",     label: "Projects",   toggle: false },
      { key: "experience", sec: "sec-activity", label: "Experience", toggle: true },
      { key: "skills",     sec: "sec-stack",    label: "Skills",     toggle: true },
      { key: "journey",    sec: "sec-journey",  label: "Journey",    toggle: true }
    ]
  };

  /* ── customize state (persisted, namespaced per mode) ── */
  var CUST_KEY = "pf-customize-v1";
  function custKey() { return CUST_KEY + ":" + mode; }
  function defaultSections() {
    var s = {}, cfg = MODE_SECTIONS[mode];
    for (var i = 0; i < cfg.length; i++) if (cfg[i].toggle) s[cfg[i].key] = true;
    return s;
  }
  function loadCust() {
    var def = defaultSections();
    var c = { theme: "paper", font: "grotesk", motion: true, density: "comfortable",
              tagline: "", bio: "", sections: def };
    try {
      var raw = localStorage.getItem(custKey());
      if (!raw && mode === "github") raw = localStorage.getItem(CUST_KEY); /* one-time migration of pre-mode settings */
      if (raw) {
        var p = JSON.parse(raw), k;
        ["theme", "font", "motion", "density", "tagline", "bio"].forEach(function (kk) {
          if (p[kk] !== undefined) c[kk] = p[kk];
        });
        for (k in def) c.sections[k] = !(p.sections && p.sections[k] === false);
      }
    } catch (e) { /* storage unavailable — use defaults */ }
    /* validate saved keys — an old/unknown theme (e.g. "drafting" or "nightshift"
       from the industrial era) must not leave data-theme unmatched, or theme
       vars go undefined and the UI goes transparent. Old keys reset to the new defaults. */
    var themeOK = THEMES.some(function (t) { return t.key === c.theme; });
    if (!themeOK) c.theme = "paper";
    var fontOK = FONTS.some(function (f) { return f.key === c.font; });
    if (!fontOK) c.font = "grotesk";
    return c;
  }
  var cust = loadCust();
  function saveCust() {
    try { localStorage.setItem(custKey(), JSON.stringify(cust)); } catch (e) { /* ignore */ }
  }

  /* ── profile photo (session memory + best-effort per-portfolio localStorage) ── */
  var customPhoto = "";
  var photoKey = "";
  var currentAvatarUrl = "";
  var currentResumeName = "";
  var downloadSlug = "";

  /* serializable source of the currently rendered portfolio (for save/share) */
  var currentSource = null;

  /* trim GitHub API payloads to the fields rendering needs — keeps saved JSON lean */
  function trimGithub(d) {
    function pickRepo(r) {
      return { id: r.id, name: r.name, full_name: r.full_name, html_url: r.html_url,
        description: r.description, language: r.language, topics: r.topics || [],
        stargazers_count: r.stargazers_count, forks_count: r.forks_count,
        updated_at: r.updated_at, created_at: r.created_at, fork: !!r.fork,
        owner: (r.owner && r.owner.login) ? { login: r.owner.login } : null };
    }
    return {
      user: d.user,
      repos: (d.repos || []).map(pickRepo),
      events: (d.events || []).slice(0, 30),
      social: d.social,
      first: d.first ? pickRepo(d.first) : null
    };
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

  /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 resume mode: sample + zero-dependency parsers \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */

  /* fictional sample resume (product designer / frontend developer) */
  var SAMPLE_RESUME = [
    "Maya Sharma",
    "Product Designer & Frontend Developer",
    "Bengaluru, India",
    "maya.sharma.design@example.com \u00b7 +91 98765 43210",
    "linkedin.com/in/mayasharma-design \u00b7 github.com/mayasharma \u00b7 mayasharma.design",
    "",
    "PROFESSIONAL SUMMARY",
    "Product designer and frontend developer with 6 years of experience turning fuzzy ideas into design systems and shipped web apps. I lead design at Lumen Labs, where I own the end-to-end product experience across web and mobile. I care about craft, motion, and interfaces that feel inevitable.",
    "",
    "EXPERIENCE",
    "Senior Product Designer, Lumen Labs",
    "Jan 2022 \u2013 Present \u00b7 Bengaluru, India",
    "\u2022 Lead designer for the analytics platform used by 40k+ teams; drove a 32% lift in weekly active usage after the 2023 redesign.",
    "\u2022 Built Aurora, the company design system: 120+ components in Figma and React with full dark-mode and motion specs.",
    "\u2022 Partner with engineering on rapid prototyping; interactive prototypes cut handoff time in half.",
    "\u2022 Mentor 3 designers; run the weekly design crit and the hiring loop.",
    "",
    "Product Designer at Brightline Studio",
    "Jun 2019 \u2013 Dec 2021 \u00b7 Remote",
    "\u2022 Designed onboarding flows for 12 client apps across fintech and health.",
    "\u2022 Created a reusable research repository; cut discovery time for new projects by 40%.",
    "\u2022 Collaborated with developers to ship pixel-faithful responsive builds.",
    "",
    "UI Developer \u2014 PixelWorks",
    "2017 \u2013 2019 \u00b7 Mumbai, India",
    "\u2022 Implemented marketing sites and dashboards in HTML, CSS and JavaScript.",
    "\u2022 Introduced a component library that unified 5 client codebases.",
    "",
    "PROJECTS",
    "Aurora Design System \u2014 a 120-component system with tokens, theming and motion guidelines, adopted by 4 product teams.",
    "Tech: Figma, React, TypeScript, Storybook",
    "\u2022 Wrote the theming engine supporting 6 brand themes from a single token file.",
    "\u2022 Published usage docs and migration guides; ran adoption workshops.",
    "Pulse \u2014 open-source portfolio analytics dashboard with realtime charts.",
    "Tech: Vue, D3.js, Node.js",
    "\u2022 1.2k GitHub stars; featured in a frontend newsletter.",
    "",
    "SKILLS",
    "Design: Figma, Sketch, Adobe XD, Prototyping, Design Systems, User Research, Wireframing",
    "Frontend: JavaScript, TypeScript, React, Vue, HTML, CSS, Tailwind CSS",
    "Tools: Git, Docker, Vercel, Notion, Jira",
    "",
    "EDUCATION",
    "B.Des, Communication Design",
    "National Institute of Design, Ahmedabad \u00b7 2013 \u2013 2017",
    "",
    "CERTIFICATIONS",
    "Google UX Design Professional Certificate (2021)",
    "AWS Certified Cloud Practitioner (2020)"
  ].join("\n");

  function slugify(s) {
    return String(s || "portfolio").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "portfolio";
  }

  /* inflate via the platform DecompressionStream: 'deflate' (zlib) or 'deflate-raw'.
     The readable side MUST be consumed concurrently with write/close — otherwise
     backpressure deadlocks close() on large streams and the promise never settles
     (UI stuck on "reading…" forever). */
  function inflateAsync(u8, format) {
    var ds = new DecompressionStream(format);
    var w = ds.writable.getWriter();
    var out = new Response(ds.readable).arrayBuffer(); /* consume first: lets close() drain */
    return w.write(u8).then(function () { return w.close(); })
      .then(function () { return out; });
  }

  function xmlUnescape(s) {
    return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  }

  /* DOCX: minimal ZIP reader \u2192 word/document.xml \u2192 w:t text runs.
     Limits: main document body only (headers/footers/textboxes ignored);
     only deflate/stored entries; password-protected files fail gracefully. */
  function parseDocxBytes(buf) {
    var dv = new DataView(buf);
    var len = dv.byteLength;
    function u32(o) { return dv.getUint32(o, true); }
    function u16(o) { return dv.getUint16(o, true); }
    var eocd = -1;
    for (var i = len - 22; i >= Math.max(0, len - 66000); i--) {
      if (u32(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("not a zip archive");
    var cdCount = u16(eocd + 10), cdOff = u32(eocd + 16);
    var docOff = -1, docSize = 0, docMethod = 0, p = cdOff;
    for (var n = 0; n < cdCount; n++) {
      if (u32(p) !== 0x02014b50) throw new Error("corrupt zip central directory");
      var method = u16(p + 10), csize = u32(p + 20);
      var fnLen = u16(p + 28), exLen = u16(p + 30), coLen = u16(p + 32);
      var lho = u32(p + 42), name = "";
      for (var c = 0; c < fnLen; c++) name += String.fromCharCode(dv.getUint8(p + 46 + c));
      if (name === "word/document.xml") { docOff = lho; docSize = csize; docMethod = method; }
      p += 46 + fnLen + exLen + coLen;
    }
    if (docOff < 0) throw new Error("no word/document.xml found");
    if (u32(docOff) !== 0x04034b50) throw new Error("corrupt zip local header");
    var dataStart = docOff + 30 + u16(docOff + 26) + u16(docOff + 28);
    var comp = new Uint8Array(buf, dataStart, docSize);
    var inflated = docMethod === 0 ? Promise.resolve(comp.slice().buffer)
      : docMethod === 8 ? inflateAsync(comp, "deflate-raw")
      : Promise.reject(new Error("unsupported zip compression method " + docMethod));
    return inflated.then(function (ab) {
      var xml = new TextDecoder("utf-8").decode(ab);
      var paras = xml.split(/<\/w:p>/), lines = [];
      for (var i = 0; i < paras.length; i++) {
        var runs = paras[i].match(/<w:t[\s>][\s\S]*?<\/w:t>/g) || [];
        lines.push(runs.map(function (r) {
          return xmlUnescape(r.replace(/^<w:t[^>]*>/, "").replace(/<\/w:t>$/, ""));
        }).join(""));
      }
      return lines.join("\n");
    });
  }

  /* WinAnsi (PDF standard Latin) \u2192 unicode, incl. 0x80\u20130x9F specials */
  var WINANSI_EXTRA = { 0x80: "\u20ac", 0x82: "\u201a", 0x83: "\u0192", 0x84: "\u201e", 0x85: "\u2026",
    0x86: "\u2020", 0x87: "\u2021", 0x88: "\u02c6", 0x89: "\u2030", 0x8A: "\u0160", 0x8B: "\u2039",
    0x8C: "\u0152", 0x8E: "\u017d", 0x91: "\u2018", 0x92: "\u2019", 0x93: "\u201c", 0x94: "\u201d",
    0x95: "\u2022", 0x96: "\u2013", 0x97: "\u2014", 0x98: "\u02dc", 0x99: "\u2122", 0x9A: "\u0161",
    0x9B: "\u203a", 0x9C: "\u0153", 0x9E: "\u017e", 0x9F: "\u0178" };
  function winAnsiChar(b) {
    if (b < 0x80 || b >= 0xA0) return String.fromCharCode(b);
    return WINANSI_EXTRA[b] || "?";
  }

  /* extract text from one decoded PDF content stream.
     Paren-aware: collects every literal (...) and hex <...> string inside
     BT...ET blocks in order — handles spaces inside parens and [...] TJ arrays. */
  function parsePdfLiteral(blk, k) {
    var bytes = [], j = k + 1, depth = 1;
    while (j < blk.length && depth > 0) {
      var c = blk[j];
      if (c === "\\" && j + 1 < blk.length) {
        var e = blk[j + 1], jj = j + 2;
        if (e === "n") bytes.push(10);
        else if (e === "r") bytes.push(13);
        else if (e === "t") bytes.push(9);
        else if (e === "b") bytes.push(8);
        else if (e === "f") bytes.push(12);
        else if (e >= "0" && e <= "7") {
          var oct = e;
          while (jj < blk.length && oct.length < 3 && blk[jj] >= "0" && blk[jj] <= "7") { oct += blk[jj]; jj++; }
          bytes.push(parseInt(oct, 8));
        } else if (e === "\n" || e === "\r") { if (e === "\r" && blk[jj] === "\n") jj++; /* line continuation */ }
        else bytes.push(e.charCodeAt(0) & 255);
        j = jj; continue;
      }
      if (c === "(") depth++;
      else if (c === ")") { depth--; if (depth === 0) { j++; break; } }
      if (depth > 0) bytes.push(c.charCodeAt(0) & 255);
      j++;
    }
    return { bytes: bytes, next: j };
  }
  function collectPdfStrings(blk, out) {
    var k = 0;
    while (k < blk.length) {
      var ch = blk[k];
      if (ch === "(") {
        var lit = parsePdfLiteral(blk, k), dec = "";
        for (var q = 0; q < lit.bytes.length; q++) dec += winAnsiChar(lit.bytes[q]);
        if (dec.trim()) out.push(dec);
        k = lit.next;
      } else if (ch === "<" && blk[k + 1] !== "<") {
        var he = blk.indexOf(">", k + 1);
        if (he < 0) break;
        var hex = blk.slice(k + 1, he).replace(/\s+/g, ""), htxt = "";
        for (var h = 0; h + 1 < hex.length; h += 2) htxt += winAnsiChar(parseInt(hex.substr(h, 2), 16));
        if (htxt.trim()) out.push(htxt);
        k = he + 1;
      } else k++;
    }
  }
  function extractPdfText(buf) {
    var s = (typeof buf === "string") ? buf : (function () {
      var raw = new Uint8Array(buf), t = "";
      for (var i = 0; i < raw.length; i++) t += String.fromCharCode(raw[i]);
      return t;
    })();
    var out = [], bi = 0, m;
    var btRe = /\bBT(?![A-Za-z])/g, etRe = /\bET(?![A-Za-z])/g;
    while (true) {
      btRe.lastIndex = bi; m = btRe.exec(s);
      if (!m) break;
      etRe.lastIndex = m.index + 2;
      var me = etRe.exec(s);
      if (!me) break;
      collectPdfStrings(s.slice(m.index + 2, me.index), out);
      bi = me.index + 2;
    }
    return out.join("\n");
  }

  /* ASCII85Decode: 'z' = four zero bytes, '~>' ends the data, whitespace ignored */
  function ascii85Decode(u8) {
    var vals = [], i, c;
    for (i = 0; i < u8.length; i++) {
      c = u8[i];
      if (c === 126) break;                  /* '~' of the '~>' end marker */
      if (c === 122) vals.push("z");         /* 'z' */
      else if (c >= 33 && c <= 117) vals.push(c - 33);  /* '!'..'u' */
    }
    var out = [];
    for (i = 0; i < vals.length;) {
      if (vals[i] === "z") { out.push(0, 0, 0, 0); i++; continue; }
      var v = 0, n = 0, k;
      while (n < 5 && i + n < vals.length && vals[i + n] !== "z") { v = v * 85 + vals[i + n]; n++; }
      for (k = n; k < 5; k++) v = v * 85 + 84;   /* pad a short final group with 'u' */
      var b = [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
      for (k = 0; k < n - 1; k++) out.push(b[k]);
      i += n;
    }
    return new Uint8Array(out);
  }

  /* ASCIIHexDecode: hex pairs, '>' ends the data, odd tail padded with 0 */
  function asciiHexDecode(u8) {
    var hex = "", i, c;
    for (i = 0; i < u8.length; i++) {
      c = u8[i];
      if (c === 62) break;                  /* '>' */
      if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102))
        hex += String.fromCharCode(c);
    }
    if (hex.length % 2) hex += "0";
    var out = [];
    for (i = 0; i < hex.length; i += 2) out.push(parseInt(hex.substr(i, 2), 16));
    return new Uint8Array(out);
  }

  /* ordered filter chain from a stream dict:
     /Filter /FlateDecode  or  /Filter [/ASCII85Decode /FlateDecode] */
  function pdfFilterNames(dict) {
    var m = dict.match(/\/Filter\s*(\[[^\]]*\]|\/[A-Za-z0-9]+)/);
    if (!m) return [];
    var names = [], mm = m[1].match(/\/([A-Za-z0-9]+)/g) || [], i;
    for (i = 0; i < mm.length; i++) names.push(mm[i].slice(1));
    return names;
  }
  var PDF_SUPPORTED_FILTERS = { FlateDecode: 1, Fl: 1, ASCII85Decode: 1, A85: 1,
                                ASCIIHexDecode: 1, AHx: 1 };

  /* run a stream's filter chain in order, left to right */
  function decodePdfStreamData(data, filters) {
    var p = Promise.resolve(data);
    filters.forEach(function (f) {
      p = p.then(function (d) {
        if (f === "FlateDecode" || f === "Fl")
          return inflateAsync(d, "deflate").then(function (ab) { return new Uint8Array(ab); });
        if (f === "ASCII85Decode" || f === "A85") return ascii85Decode(d);
        if (f === "ASCIIHexDecode" || f === "AHx") return asciiHexDecode(d);
        throw new Error("unsupported PDF filter: " + f);
      });
    });
    return p;
  }


  function parsePdfBytes(buf) {
    var bytes = new Uint8Array(buf), latin = "";
    for (var i = 0; i < bytes.length; i++) latin += String.fromCharCode(bytes[i]);
    var jobs = [], m;
    var re = /stream(\r\n|\n|\r)([\s\S]*?)\r?\n?endstream/g;
    while ((m = re.exec(latin))) {
      var dictStart = latin.lastIndexOf("<<", m.index);
      var dict = dictStart >= 0 ? latin.slice(dictStart, m.index) : "";
      var dataStart = m.index + 6 + m[1].length;
      var data = bytes.slice(dataStart, dataStart + m[2].length);
      var filters = pdfFilterNames(dict), ok = true, fi;
      for (fi = 0; fi < filters.length; fi++) {
        if (!PDF_SUPPORTED_FILTERS[filters[fi]]) { ok = false; break; }
      }
      /* supported filter chains are decoded in order; anything else
         (LZW, DCT, Crypt...) is skipped -- usually images */
      if (ok) jobs.push({ data: data, filters: filters });
    }
    if (!jobs.length) { var e0 = new Error("no readable content streams"); e0.code = "unparsable"; throw e0; }
    var ps = jobs.map(function (j) {
      var decoded = j.filters.length ? decodePdfStreamData(j.data, j.filters)
                                     : Promise.resolve(j.data);
      return decoded.then(function (u8) {
        return new TextDecoder("latin1").decode(u8);
      }).catch(function () { return ""; });
    });
    return Promise.all(ps).then(function (parts) {
      var text = parts.map(extractPdfText).join("\n")
        .split("\n").map(function (l) { return l.replace(/[ \t\xa0]+/g, " ").trim(); })
        .filter(Boolean).join("\n");
      if (text.length < 200) {
        var e = new Error("scanned or image-only PDF");
        e.code = "scanned";
        throw e;
      }
      return text;
    });
  }

  /* \u2500\u2500 heuristic resume structure parser (operates on extracted text lines) \u2500\u2500 */
  var MONTHS_RE = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?";
  var DATE_RE = new RegExp("((?:" + MONTHS_RE + "\\s+)?(?:19|20)\\d{2}\\s*(?:\u2013|\u2014|-|to)\\s*(?:" +
    MONTHS_RE + "\\s+)?(?:(?:19|20)\\d{2}|present|current|now))", "i");

  var SECTION_KEYS = {
    experience: ["experience", "work history", "employment history", "professional experience", "work experience"],
    education: ["education", "educational background", "academic background", "academic qualifications"],
    skills: ["skills", "technical skills", "core skills", "key skills", "competencies", "technical expertise", "tech stack", "technologies"],
    projects: ["projects", "selected projects", "personal projects", "key projects", "selected work", "portfolio"],
    summary: ["summary", "professional summary", "objective", "profile", "about me", "career objective"],
    certifications: ["certifications", "certification", "licenses", "courses", "training"],
    awards: ["awards", "honors", "achievements", "accomplishments"]
  };
  function sectionKeyOf(line) {
    var norm = line.toLowerCase().replace(/\(.*?\)/g, " ")
      .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    if (!norm || norm.length > 48) return null;
    for (var k in SECTION_KEYS) {
      var arr = SECTION_KEYS[k];
      for (var i = 0; i < arr.length; i++) {
        if (norm === arr[i]) return k;
      }
    }
    return null;
  }
  function isBullet(l) { return /^[\u2022\-\*\u2013\u2014\u25aa\u25e6\u2023\u00b7\x7f]\s+/.test(l) || /^\d+[.)]\s+/.test(l); }
  function stripBullet(l) { return l.replace(/^[\u2022\-\*\u2013\u2014\u25aa\u25e6\u2023\u00b7\x7f]\s+/, "").replace(/^\d+[.)]\s+/, ""); }
  function splitTitleCompany(line) {
    if (/^(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+)?\d{4}\s*[–—-]\s*/i.test(line)) return null;
    if (looksLikeLocation(line)) return null;
    var m = line.match(/^(.{2,60}?)(?:\s+at\s+|\s*@\s*|\s*\|\s*|\s*,\s*|\s*[–—]\s*)(.{2,60})$/);
    if (!m || /\.$/.test(line)) return null;
    var title = m[1].trim(), company = m[2].trim();
    if (!/^[A-Z0-9]/.test(title)) return null;
    if (!/^[A-Z0-9]/.test(company)) return null;
    return { title: title, company: company };
  }
  function looksLikeLocation(s) {
    return /^[A-Z][A-Za-z'.\-]*(?:\s+[A-Z][A-Za-z'.\-]*)?,\s*[A-Z][A-Za-z'.\-]*(?:\s+[A-Z][A-Za-z'.\-]*)?$/.test(s);
  }

  function parseResumeText(text) {
    var lines = String(text || "").split(/\r?\n/).map(function (l) { return l.trim(); });
    var r = {
      name: "", headline: "", email: "", phone: "", location: "",
      links: { linkedin: "", github: "", website: "" },
      summary: "", experience: [], education: [], projects: [],
      skills: [], certifications: [], yearsExperience: 0, careerStart: null
    };

    /* locate section headers */
    var secs = [];
    for (var i = 0; i < lines.length; i++) {
      var sk = sectionKeyOf(lines[i]);
      if (sk) secs.push({ key: sk, idx: i });
    }
    function sectionLines(key) {
      for (var x = 0; x < secs.length; x++) {
        if (secs[x].key === key) {
          var end = (x + 1 < secs.length) ? secs[x + 1].idx : lines.length;
          var out = [];
          for (var j = secs[x].idx + 1; j < end; j++) if (lines[j]) out.push(lines[j]);
          return out;
        }
      }
      return null;
    }

    /* header block = everything before the first section */
    var firstSec = secs.length ? secs[0].idx : lines.length;
    var head = [];
    for (var hh = 0; hh < firstSec; hh++) if (lines[hh]) head.push(lines[hh]);

    /* name: first substantial line (2\u20134 words, no @/urls/long digits) */
    for (var ni = 0; ni < Math.min(head.length, 6); ni++) {
      var cand = head[ni];
      var words = cand.split(/\s+/);
      if (words.length >= 2 && words.length <= 4 && cand.length < 60 &&
          /^[A-Za-z\u00c0-\u024f .'\-]+$/.test(cand) && !/@|https?:|\d{4,}/.test(cand)) {
        r.name = cand; break;
      }
    }

    /* contact */
    var headText = head.join("\n"), allText = lines.join("\n");
    var em = allText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (em) r.email = em[0];
    var ph = headText.match(/(\+?\d[\d\s().\-]{6,}\d)/);
    if (ph) r.phone = ph[1].replace(/\s+/g, " ").trim();
    var li = allText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?/i);
    if (li) r.links.linkedin = /^https?:/i.test(li[0]) ? li[0] : "https://" + li[0];
    var ghm = allText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9\-_]+/i);
    if (ghm && !/\/github\.com\/?$/i.test(ghm[0]))
      r.links.github = /^https?:/i.test(ghm[0]) ? ghm[0] : "https://" + ghm[0];
    var urls = allText.match(/https?:\/\/[^\s)]+/gi) || [];
    for (var ui = 0; ui < urls.length; ui++) {
      var url = urls[ui].replace(/[.,;]+$/, "");
      if (/linkedin\.com|github\.com/i.test(url)) continue;
      r.links.website = url; break;
    }
    if (!r.links.website) {
      var bare = headText.match(/(?:^|\s)([a-z0-9\-]+\.(?:com|dev|io|me|design|co|in|net|org))(?:\s|$)/i);
      if (bare && !/linkedin|github/i.test(bare[1])) r.links.website = "https://" + bare[1];
    }
    for (var loi = 0; loi < head.length && !r.location; loi++) {
      /* contact lines are often "City, State | email | phone" -- check each segment */
      var segs = head[loi].split(/\s*[|\u2022\u00b7]\s*/);
      for (var sgi = 0; sgi < segs.length; sgi++) {
        var seg = segs[sgi].trim();
        if (!seg || /@/.test(seg) || /^\+?[\d\s().\-]{7,}$/.test(seg)) continue;
        var lm = seg.match(/([A-Z][A-Za-z'.\-]*(?:\s+[A-Z][A-Za-z'.\-]*)?),\s*([A-Z][A-Za-z'.\-]*(?:\s+[A-Z][A-Za-z'.\-]*)?)/);
        if (lm) { r.location = lm[1] + ", " + lm[2]; break; }
      }
    }

    /* experience */
    var expLines = sectionLines("experience") || [], cur = null;
    function pushExp() { if (cur && (cur.title || cur.company)) r.experience.push(cur); cur = null; }
    expLines.forEach(function (l) {
      if (isBullet(l)) {
        if (!cur) cur = { title: "", company: "", dates: "", bullets: [] };
        if (cur.bullets.length < 6) cur.bullets.push(stripBullet(l));
        return;
      }
      var dates = "", core = l, dm = l.match(DATE_RE);
      if (dm) {
        dates = dm[1].trim();
        core = (l.slice(0, dm.index) + " " + l.slice(dm.index + dm[1].length)).trim()
          .replace(/^[|\u2022\u00b7,;\u2013\u2014\-\s]+/, "").replace(/[|\u2022\u00b7,;\u2013\u2014\-\s]+$/, "").trim();
      }
      if (cur && dates && (!core || looksLikeLocation(core) || /^(remote|hybrid|on[-\s]?site)$/i.test(core))) {
        if (!cur.dates) cur.dates = dates; /* "Jan 2022 – Present · Bengaluru" style date line */
        return;
      }
      var tc = core ? splitTitleCompany(core) : null;
      if (cur && cur.bullets.length > 0 && !tc && !dm && /^[a-z]/.test(core)) {
        cur.bullets[cur.bullets.length - 1] += " " + core;  /* wrapped bullet line */
        return;
      }
      var startNew = !!tc || !!dm || !cur || cur.bullets.length > 0 || (cur.title && cur.dates);
      if (startNew) {
        pushExp();
        cur = { title: tc ? tc.title : core, company: tc ? tc.company : "", dates: dates, bullets: [] };
      } else if (dates && !cur.dates) {
        cur.dates = dates;
      } else if (tc && !cur.company) {
        cur.company = tc.company;
        if (!cur.title) cur.title = tc.title;
      } else if (core && core.length < 160 && cur.bullets.length < 6) {
        cur.bullets.push(core); /* wrapped continuation line */
      }
    });
    pushExp();

    /* projects */
    var projLines = sectionLines("projects") || [], pc = null;
    function newProj() { return { name: "", description: "", tech: [], bullets: [] }; }
    function pushProj() { if (pc && pc.name) r.projects.push(pc); pc = null; }
    projLines.forEach(function (l) {
      var tm = l.match(/^(?:tech(?:nologies|nical)?|stack|built with)\s*[:\-\u2013\u2014]\s*(.+)$/i);
      if (tm) {
        if (!pc) pc = newProj();
        pc.tech = tm[1].split(/[,|\u2022\u00b7\/;]/).map(function (x) { return x.trim(); })
          .filter(Boolean).slice(0, 12);
        return;
      }
      if (isBullet(l)) {
        var stripped = stripBullet(l);
        var titled = /\s+[\u2013\u2014]\s+|\s*:\s*/.test(stripped);
        var pcBody = pc && (pc.description || pc.bullets.length || pc.tech.length);
        /* resume project lists are often bulleted "Name -- one-liner" lines;
           a titled line starts a new project once the current one has content */
        if (titled && (!pc || !pc.name || pcBody)) { l = stripped; }
        else {
          if (!pc) pc = newProj();
          if (pc.bullets.length < 4) pc.bullets.push(stripped);
          return;
        }
      }
      var hasBody = pc && (pc.description || pc.bullets.length || pc.tech.length);
      var dm = l.match(/\s+[\u2013\u2014]\s+|\s*:\s*/), nm = l, desc = "", extraTech = [];
      if (dm) { nm = l.slice(0, dm.index).trim(); desc = l.slice(dm.index + dm[0].length).trim(); }
      /* trailing "-- React, Tailwind, Node" is a tech list, not description */
      var tm2 = desc.match(/\s+[\u2013\u2014]\s+([^\u2013\u2014:;]+)$/);
      if (tm2 && /,/.test(tm2[1])) {
        extraTech = tm2[1].split(/[,|]/).map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 12);
        if (extraTech.length >= 2) desc = desc.slice(0, tm2.index).trim();
        else extraTech = [];
      }
      if (!pc || hasBody) {
        pushProj(); pc = newProj(); pc.name = nm; pc.description = desc;
        if (extraTech.length) pc.tech = extraTech;
      } else if (!pc.name) {
        pc.name = nm; pc.description = desc;
        if (extraTech.length) pc.tech = extraTech;
      } else {
        pc.description += (pc.description ? " " : "") + l;
      }
    });
    pushProj();
    r.projects.forEach(function (p) {
      if (p.description.length > 320) p.description = p.description.slice(0, 320).replace(/\s+\S*$/, "") + "\u2026";
    });

    /* skills */
    var skillLines = sectionLines("skills") || [], seen = {};
    skillLines.forEach(function (l) {
      var core = stripBullet(l);
      if (/^[A-Za-z &\/+]+\s*:\s*$/.test(core)) return;  /* "Category:" label, no items */
      var cm = core.match(/^[A-Za-z &\/+]+\s*:\s*(.+)$/);
      if (cm) core = cm[1];
      core.split(/[,|\u2022\u00b7\/;]/).forEach(function (x) {
        var s = x.trim()
          .replace(/^['"\u2018\u2019\u201c\u201d]+|['"\u2018\u2019\u201c\u201d]+$/g, "")
          .trim().replace(/^(and|or|with|using)\s+/i, "").replace(/[.]+$/, "");
        if (s && s.length < 42 && s.split(/\s+/).length <= 4 && !/[.!?]$/.test(s)) {
          var k = s.toLowerCase();
          if (!seen[k]) { seen[k] = true; r.skills.push(s); }
        }
      });
    });

    /* education */
    var DEG = /\b(bachelor|master|b\.?\s?sc|m\.?\s?sc|b\.?\s?tech|m\.?\s?tech|ph\.?\s?d|diploma|associate|b\.?\s?a\.?|m\.?\s?a\.?|mba|b\.?\s?e\.?)\b/i;
    var eduLines = sectionLines("education") || [], ec = null;
    function pushEdu() { if (ec && (ec.degree || ec.school)) r.education.push(ec); ec = null; }
    eduLines.forEach(function (l) {
      if (isBullet(l)) return;
      var dates = "", core = l, dm = l.match(DATE_RE);
      if (dm) {
        dates = dm[1].trim();
        core = (l.slice(0, dm.index) + " " + l.slice(dm.index + dm[1].length)).trim()
          .replace(/^[|\u2022\u00b7,;\u2013\u2014\-\s]+/, "").replace(/[|\u2022\u00b7,;\u2013\u2014\-\s]+$/, "").trim();
      }
      if (DEG.test(core)) {
        if (ec && ec.degree) pushEdu();
        if (!ec) ec = { degree: "", school: "", dates: "" };
        ec.degree = core;
        if (dates) ec.dates = dates;
      } else if (dates && ec && !ec.dates) {
        ec.dates = dates;
      } else if (ec && !ec.school && core.length < 90) {
        ec.school = core;
        if (dates) ec.dates = dates;
      } else if (core && core.length < 90) {
        if (ec && ec.degree) pushEdu();
        ec = { degree: "", school: core, dates: dates };
      }
    });
    pushEdu();

    /* certifications: plain list */
    var certLines = sectionLines("certifications") || [];
    certLines.forEach(function (l) {
      var c = stripBullet(l);
      if (c && c.length < 120) r.certifications.push(c);
    });

    /* summary */
    var sumLines = sectionLines("summary");
    if (sumLines && sumLines.length) {
      r.summary = sumLines.join(" ");
    } else {
      for (var pi = 0; pi < head.length; pi++) {
        if (head[pi] === r.name) continue;
        if (/[@]/.test(head[pi]) || /linkedin|github|https?:/i.test(head[pi])) continue;
        if (/^[\d\s()+.\-]{7,}$/.test(head[pi])) continue;
        if (looksLikeLocation(head[pi])) continue;
        if (head[pi].length > 60) { r.summary = head[pi]; break; }
      }
    }
    if (r.summary.length > 600) r.summary = r.summary.slice(0, 600).replace(/\s+\S*$/, "") + "\u2026";

    /* headline: most recent role, else first clause of summary */
    if (r.experience.length && r.experience[0].title) {
      r.headline = r.experience[0].title +
        (r.experience[0].company ? " @ " + r.experience[0].company : "");
    } else if (r.summary) {
      r.headline = r.summary.split(/[.!?\n]/)[0].slice(0, 90);
    }

    /* years of experience: earliest start \u2192 latest end / Present */
    var yrs = [];
    r.experience.forEach(function (e) {
      var mm = (e.dates || "").match(/(19|20)\d{2}/g);
      if (mm) mm.forEach(function (y) { yrs.push(parseInt(y, 10)); });
    });
    if (yrs.length) {
      var nowY = new Date().getFullYear();
      var start = Math.min.apply(null, yrs);
      var ongoing = r.experience.some(function (e) { return /present|current|now/i.test(e.dates || ""); });
      r.careerStart = start;
      r.yearsExperience = Math.max(0, (ongoing ? nowY : Math.max.apply(null, yrs)) - start);
    }

    return r;
  }

  /* group skills into editorial buckets via keyword lists */
  var SKILL_GROUPS = [
    { name: "Languages",
      keys: ["javascript", "typescript", "python", "java", "go", "rust", "c++", "c#", "ruby", "php",
             "swift", "kotlin", "dart", "scala", "haskell", "sql", "html", "css", "matlab", "bash", "r"] },
    { name: "Frameworks & Libraries",
      keys: ["react", "vue", "angular", "svelte", "next", "node", "express", "django", "flask",
             "fastapi", "spring", "rails", "laravel", "tensorflow", "pytorch", "three", "tailwind",
             "bootstrap", "redux", "graphql", "d3"] },
    { name: "Tools & Platforms",
      keys: ["git", "docker", "kubernetes", "aws", "gcp", "azure", "figma", "sketch", "linux",
             "jenkins", "terraform", "vercel", "netlify", "firebase", "postgres", "mysql",
             "mongo", "redis", "jira", "notion", "storybook"] },
    { name: "Craft",
      keys: ["prototyping", "wireframing", "research", "testing", "agile", "scrum", "ci cd",
             "tdd", "rest", "microservices", "ux", "seo"] }
  ];
  function groupSkills(skills) {
    var buckets = SKILL_GROUPS.map(function (g) { return { name: g.name, items: [] }; });
    var other = { name: "More", items: [] };
    (skills || []).forEach(function (s) {
      var nl = " " + s.toLowerCase().replace(/[^a-z0-9+#]/g, " ").replace(/\s+/g, " ").trim() + " ";
      var placed = false;
      for (var i = 0; i < SKILL_GROUPS.length && !placed; i++) {
        for (var k = 0; k < SKILL_GROUPS[i].keys.length; k++) {
          if (nl.indexOf(" " + SKILL_GROUPS[i].keys[k] + " ") >= 0) {
            buckets[i].items.push(s); placed = true; break;
          }
        }
      }
      if (!placed) other.items.push(s);
    });
    buckets.push(other);
    return buckets.filter(function (b) { return b.items.length > 0; });
  }

  /* ── dom refs ── */
  function $(id) { return document.getElementById(id); }
  var views = {
    generator: $("view-generator"),
    dashboard: $("view-dashboard"),
    loading: $("view-loading"),
    error: $("view-error"),
    portfolio: $("view-portfolio")
  };
  var form = $("gen-form"), input = $("username-input");
  var lastUsername = "";

  var REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* the portfolio theme follows the portfolio view only; everywhere else the
     product chrome rests in the default Paper theme */
  function syncBodyTheme() {
    document.body.setAttribute("data-theme", views.portfolio.hidden ? "paper" : cust.theme);
  }

  function show(name) {
    Object.keys(views).forEach(function (k) { views[k].hidden = (k !== name); });
    document.body.setAttribute("data-view", name);
    syncBodyTheme();
    window.scrollTo(0, 0);
    if (name === "portfolio") {
      initMotion();
    } else {
      clearMotion(); views.portfolio.classList.remove("motion-on");
    }
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

  function plural(n, one, many) { return n === 1 ? one : many; }

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
    mode = "github";
    cust = loadCust();
    /* custom copy belongs to the previous profile — reset it, keep theme/font/motion/density/sections */
    cust.tagline = ""; cust.bio = ""; saveCust();
    clearCustomPhoto();
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
      var d = { user: r[0], repos: r[1], events: r[2], social: r[3], first: (r[4] && r[4][0]) || null };
      currentSource = { type: "github", ref: username, data: trimGithub(d) };
      renderPortfolio(d);
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
      msg = "GitHub allows 60 unauthenticated requests per hour and the limit is hit. It resets around " + when + ". Please wait a moment and retry.";
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

  /* ── toast notifications ── */
  var toastTimer = null;
  function toast(msg) {
    var t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    void t.offsetWidth; /* restart the transition */
    t.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { t.hidden = true; }, 400);
    }, 2600);
  }

  /* ── sign-in gate for Customize / Download HTML ── */
  function backend() { return (typeof window !== "undefined") ? window.PFBackend || null : null; }
  function authGateActive() {
    var be = backend();
    return !!(be && be.authConfigured && be.authConfigured() && !be.isSignedIn());
  }
  function requireAuth(what, fn) {
    return function (ev) {
      var be = backend();
      if (be && be.authConfigured && be.authConfigured() && !be.isSignedIn()) {
        /* remember what the user was trying to do — after they sign in
           (in-page or via OAuth) we finish that action for them */
        if (be.noteGateIntent) be.noteGateIntent(what.indexOf("customize") >= 0 ? "customize" : "download");
        toast("Sign in to " + what + ". It's free");
        be.openAuth("signin");
        return;
      }
      return fn.call(this, ev);
    };
  }
  function refreshGatedButtons() {
    var locked = authGateActive();
    ["customize-btn", "download-btn"].forEach(function (id) {
      var b = $(id);
      if (!b) return;
      b.classList.toggle("locked", locked);
      b.title = locked ? "Sign in to unlock" : "";
    });
  }

  /* ── start over: back to a clean generator ── */
  function startOver() {
    currentSource = null;
    customPhoto = "";
    photoKey = "";
    currentAvatarUrl = "";
    currentResumeName = "";
    downloadSlug = "";
    lastUsername = "";
    var inp = $("username-input");
    if (inp) inp.value = "";
    var rf = $("resume-file");
    if (rf) rf.value = "";
    setPendingResume(null);
    setMode("github");
    closeDrawer();
    show("generator");
    window.scrollTo(0, 0);
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
        /* a 200 with a JSON error body means the repo has no README (some
           fixtures/proxies return the error as text rather than a 404) */
        if (/^\s*\{\s*"(message|documentation_url)"\s*:/.test(md)) {
          slot.classList.remove("loading");
          slot.innerHTML = '<span style="color:var(--faint);font-style:normal">No README in this repository.</span>';
          return;
        }
        var t = excerptFromReadme(md);
        slot.classList.remove("loading");
        slot.innerHTML = '<span class="excerpt-label">From the README</span>' +
          (t ? esc(t) : '<span style="color:var(--faint);font-style:normal">README is empty.</span>');
      }).catch(function (err) {
        slot.classList.remove("loading");
        if (err.status === 403 && !stopped) {
          stopped = true;
          note.hidden = false;
          note.textContent = "GitHub's rate limit kicked in, so some README excerpts couldn't load. Everything else is intact. Regenerate in a little while for the full picture.";
          document.querySelectorAll(".work-excerpt.loading").forEach(function (s) {
            s.classList.remove("loading");
            s.innerHTML = '<span style="color:var(--faint);font-style:normal">Excerpt unavailable (rate limit).</span>';
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
      note.textContent = "No recent public activity to show. GitHub only exposes the last few months of public events.";
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
      note.textContent = "No recent public activity to show. GitHub only exposes the last few months of public events.";
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
        detail: repoLink(first.full_name) + ", created " + esc(fmtMonthYear(first.created_at)) + ". Every journey starts with a first commit."
      });
    } else {
      items.push({ title: "First repository", detail: "No public repositories yet. The story is still being written." });
    }

    items.push({
      title: fmtNum(user.public_repos) + " " + plural(user.public_repos, "repo", "repos") + " and counting",
      detail: esc(fmtNum(user.public_repos)) + " public repositories shipped. The archive keeps growing."
    });

    if (topRepo && (topRepo.stargazers_count || 0) > 0) {
      items.push({
        title: "Top starred project",
        detail: repoLink(topRepo.full_name) + ", " + esc(fmtNum(topRepo.stargazers_count)) + " " +
          plural(topRepo.stargazers_count, "star", "stars") + " and counting."
      });
    } else {
      items.push({ title: "Top starred project", detail: "No stars yet. Every journey starts somewhere." });
    }

    items.forEach(function (it) {
      var li = document.createElement("li");
      li.innerHTML = '<div><p class="j-title">' +
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
    actions.innerHTML = '<a class="btn-primary" href="' + esc(user.html_url) + '" target="_blank" rel="noopener">View GitHub Profile <span aria-hidden="true">↗</span></a>';

    if (user.blog) {
      var blog = user.blog.trim();
      if (!/^https?:\/\//i.test(blog)) blog = "https://" + blog;
      var label = blog.replace(/^https?:\/\//i, "").replace(/\/$/, "");
      actions.innerHTML += ' <a class="btn-quiet" href="' + esc(blog) + '" target="_blank" rel="noopener">' + esc(label) + ' <span aria-hidden="true">↗</span></a>';
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

  /* ═══════════════ resume mode: labels, render, photo, tabs, file flow ═══════════════ */

  /* per-mode section titles + spec lines */
  function setSectionLabels(m) {
    var T = m === "resume" ? {
      about: "About",
      work: ["Selected Projects", "Hand-picked highlights"],
      activity: ["Experience", "Where they have worked"],
      stack: ["Skills", "The toolbox"],
      journey: ["Career Journey", null]
    } : {
      about: "About",
      work: ["Selected Work", "Top repositories, ranked by stars"],
      activity: ["Recent Activity", "Public events"],
      stack: ["Tech Stack", "Languages by repository"],
      journey: ["The Journey", null]
    };
    ["work", "activity", "stack", "journey"].forEach(function (k) {
      var tt = $("title-" + k);
      if (tt) tt.textContent = T[k][0];
      var spec = document.querySelector("#sec-" + k + " .sec-spec");
      if (spec) { spec.textContent = T[k][1] || ""; spec.style.display = T[k][1] ? "" : "none"; }
    });
    var ta = $("title-about");
    if (ta) ta.textContent = T.about;
  }

  /* render a parsed resume into the shared portfolio DOM */
  function renderResumePortfolio(r) {
    setSectionLabels("resume");
    downloadSlug = slugify((r.name || "resume").replace(/\.(pdf|docx|txt|md|markdown)$/i, ""));
    currentAvatarUrl = "";
    currentResumeName = r.name || "";

    /* hero */
    $("pf-name").textContent = r.name || "Your Name";
    var pfStatusR = $("pf-status");
    if (pfStatusR) pfStatusR.hidden = true;
    var heroTag = $("pf-tagline");
    heroTag.textContent = r.headline || "Portfolio";
    heroTag.dataset.base = heroTag.textContent;
    var metaR = $("hero-meta");
    if (metaR) {
      metaR.innerHTML = "";
      if (r.location) {
        var li = document.createElement("li");
        li.textContent = r.location;
        metaR.appendChild(li);
      }
      var primary = r.links.linkedin || r.links.github || r.links.website;
      if (primary) {
        var li2 = document.createElement("li");
        var a = document.createElement("a");
        a.href = primary; a.target = "_blank"; a.rel = "noopener";
        a.textContent = primary.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
        li2.appendChild(a);
        metaR.appendChild(li2);
      }
    }

    /* about */
    var aboutBio = $("about-bio");
    aboutBio.textContent = r.summary ||
      "No summary found in this resume. Add a professional summary section to make this space shine.";
    aboutBio.dataset.base = aboutBio.textContent;
    var metaBits = [];
    if (r.email) metaBits.push('<a href="mailto:' + esc(r.email) + '">' + esc(r.email) + "</a>");
    if (r.phone) metaBits.push(esc(r.phone));
    if (r.location) metaBits.push(esc(r.location));
    if (r.links.linkedin) metaBits.push('<a href="' + esc(r.links.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a>');
    $("about-meta").innerHTML = metaBits.join(" &nbsp;/&nbsp; ");

    /* stats */
    function setStatR(id, raw) {
      var el = $(id);
      if (!el) return;
      el.textContent = raw > 0 ? String(raw) : "0";
      if (raw > 0) el.setAttribute("data-count", String(raw));
      else el.removeAttribute("data-count");
    }
    setStatR("stat-num-repos", r.yearsExperience);
    setStatR("stat-num-followers", r.experience.length);
    setStatR("stat-num-stars", r.projects.length);
    setStatR("stat-num-forks", r.skills.length);
    $("stat-label-repos").textContent = "Years experience";
    $("stat-label-followers").textContent = "Roles";
    $("stat-label-stars").textContent = "Projects";
    $("stat-label-forks").textContent = "Skills";
    $("stat-years").hidden = true;
    $("sec-about").querySelector(".stats").style.gridTemplateColumns = "repeat(4,1fr)";
    $("sec-stack").style.display = "";

    /* projects → sec-work (fallback: experience highlights) */
    var grid = $("work-list");
    grid.innerHTML = "";
    var projs = r.projects.slice(0, 6);
    if (!projs.length && r.experience.length) {
      projs = r.experience.slice(0, 3).map(function (e) {
        return {
          name: (e.title || "Role") + (e.company ? " @ " + e.company : ""),
          description: e.bullets.slice(0, 2).join(" "),
          tech: []
        };
      });
    }
    if (!projs.length) {
      grid.innerHTML = '<p class="work-empty">No projects listed in this resume.</p>';
    } else {
      projs.forEach(function (p) {
        var card = document.createElement("article");
        card.className = "work-card reveal";
        var tech = (p.tech || []).slice(0, 6);
        card.innerHTML =
          (tech.length ? '<p class="work-kicker">' + esc(tech.join(" · ")) + "</p>" : "") +
          '<h3 class="work-name">' + esc(p.name || "Untitled") + "</h3>" +
          (p.description ? '<p class="work-desc">' + esc(p.description) + "</p>" : "");
        grid.appendChild(card);
      });
    }

    /* experience → sec-activity timeline */
    var tl = $("activity-timeline"), note = $("activity-note");
    tl.innerHTML = ""; note.hidden = true;
    if (!r.experience.length) {
      note.hidden = false;
      note.textContent = "No experience section found in this resume.";
    } else {
      r.experience.slice(0, 8).forEach(function (e) {
        var item = document.createElement("div");
        item.className = "t-item";
        var headHtml = "<strong>" + esc(e.title || "Role") + "</strong>" +
          (e.company ? ' <span class="t-co">@ ' + esc(e.company) + "</span>" : "");
        var bullets = "";
        if (e.bullets.length) {
          bullets = '<ul class="exp-bullets">' +
            e.bullets.slice(0, 6).map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") +
            "</ul>";
        }
        item.innerHTML = '<p class="t-text">' + headHtml + bullets + "</p>" +
          '<p class="t-date">' + esc(e.dates || "") + "</p>";
        tl.appendChild(item);
      });
    }

    /* skills → sec-stack grouped chips */
    $("lang-bar").hidden = true;
    $("lang-legend").hidden = true;
    var sg = $("skill-groups");
    sg.hidden = false;
    sg.innerHTML = "";
    var groups = groupSkills(r.skills);
    if (!groups.length) {
      sg.innerHTML = '<p class="work-empty">No skills section found in this resume.</p>';
    } else {
      groups.forEach(function (g) {
        var div = document.createElement("div");
        div.className = "skill-group";
        div.innerHTML = '<p class="skill-group-title">' + esc(g.name) + "</p>" +
          '<div class="skill-chips">' +
          g.items.map(function (x) { return '<span class="skill-chip">' + esc(x) + "</span>"; }).join("") +
          "</div>";
        sg.appendChild(div);
      });
    }

    /* journey → career milestones */
    var list = $("journey-list");
    list.innerHTML = "";
    var items = [];
    if (r.careerStart) {
      items.push({ title: "Career started",
        detail: "First role on record began in <em>" + r.careerStart + "</em>." });
    }
    if (r.experience.length) {
      var latest = r.experience[0];
      items.push({ title: "Most recent role",
        detail: "<em>" + esc(latest.title || "Role") + "</em>" +
          (latest.company ? " at " + esc(latest.company) : "") +
          (latest.dates ? ", " + esc(latest.dates) : "") + "." });
    }
    items.push({ title: r.yearsExperience + (r.yearsExperience === 1 ? " year" : " years") + " of experience",
      detail: "Across " + r.experience.length + " role" + (r.experience.length === 1 ? "" : "s") +
        (r.education.length ? ", educated at " + esc(r.education[0].school || r.education[0].degree) : "") + "." });
    items.push({ title: r.projects.length + (r.projects.length === 1 ? " project" : " projects"),
      detail: r.projects.length ? "Selected highlights above. The archive keeps growing."
                                : "No projects listed yet. The story is still being written." });
    items.forEach(function (it) {
      var li = document.createElement("li");
      li.innerHTML = '<div><p class="j-title">' +
        esc(it.title) + '</p><p class="j-detail">' + it.detail + "</p></div>";
      list.appendChild(li);
    });

    /* contact */
    var box = $("contact-links");
    box.innerHTML = "";
    var actions = document.createElement("div");
    actions.className = "contact-actions";
    var btns = "";
    if (r.email) btns += '<a class="btn-primary" href="mailto:' + esc(r.email) + '">Email me <span aria-hidden="true">↗</span></a>';
    if (r.phone) btns += ' <a class="btn-quiet" href="tel:' + esc(r.phone.replace(/[^+\d]/g, "")) + '">' + esc(r.phone) + "</a>";
    if (r.links.website) {
      var wlabel = r.links.website.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
      btns += ' <a class="btn-quiet" href="' + esc(r.links.website) + '" target="_blank" rel="noopener">' +
        esc(wlabel) + ' <span aria-hidden="true">↗</span></a>';
    }
    actions.innerHTML = btns ||
      '<span style="color:var(--faint);font-size:14px">No contact details found in this resume.</span>';
    box.appendChild(actions);
    var chipDefs = [];
    if (r.links.linkedin) chipDefs.push(["LinkedIn", r.links.linkedin]);
    if (r.links.github) chipDefs.push(["GitHub", r.links.github]);
    if (chipDefs.length) {
      var chips = document.createElement("div");
      chips.className = "social-chips";
      chipDefs.forEach(function (cd) {
        var a = document.createElement("a");
        a.className = "social-chip";
        a.href = cd[1]; a.target = "_blank"; a.rel = "noopener";
        a.textContent = cd[0];
        chips.appendChild(a);
      });
      box.appendChild(chips);
    }
    if (r.location) {
      var lp = document.createElement("p");
      lp.className = "contact-sub";
      lp.style.marginBottom = "0";
      lp.textContent = "Based in " + r.location + ".";
      box.appendChild(lp);
    }

    $("footer-note").innerHTML = colophonHTML("from a resume, parsed in your browser");

    applyCustomize();
  }

  /* ── profile photo ── */
  function initialsOf(name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join("") || "◆";
  }
  function applyAvatar() {
    var img = $("pf-avatar"), mono = $("pf-monogram");
    if (!img || !mono) return;
    var src = customPhoto || currentAvatarUrl;
    if (src) {
      img.onerror = function () {
        img.style.display = "none";
        mono.hidden = false;
        mono.textContent = initialsOf(currentResumeName || ($("pf-name") && $("pf-name").textContent));
      };
      img.src = src;
      img.alt = (($("pf-name") && $("pf-name").textContent) || "Profile") + " photo";
      img.style.display = "";
      mono.hidden = true;
    } else {
      img.style.display = "none";
      mono.hidden = false;
      mono.textContent = initialsOf(currentResumeName || ($("pf-name") && $("pf-name").textContent));
    }
  }
  function validatePhotoFile(f) {
    if (!f) return "No file selected.";
    var isImg = (f.type || "").indexOf("image/") === 0 ||
      /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name || "");
    if (!isImg) return "That doesn't look like an image. Please choose a JPG, PNG or WebP file.";
    if (f.size > 12 * 1024 * 1024) return "That image is over 12 MB. Please pick a smaller one.";
    return null;
  }
  function downscaleToDataURL(img, cb) {
    try {
      var w = img.naturalWidth || img.width || 1, h = img.naturalHeight || img.height || 1;
      var scale = Math.min(1, 512 / Math.max(w, h));
      var cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(w * scale));
      cv.height = Math.max(1, Math.round(h * scale));
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      cb(null, cv.toDataURL("image/jpeg", 0.85));
    } catch (e) { cb(e); }
  }
  function photoHint(msg, isErr) {
    var el = $("photo-hint");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("err", !!isErr);
  }
  function setPhotoDataURL(dataURL) {
    customPhoto = dataURL || "";
    if (photoKey) { try { localStorage.removeItem(photoKey); } catch (e) { /* ignore */ } }
    photoKey = customPhoto ? ("pf-photo-v1:" + mode + ":" + (downloadSlug || "portfolio")) : "";
    if (photoKey) {
      try { localStorage.setItem(photoKey, customPhoto); }
      catch (e) { /* quota exceeded — session memory only */ }
    }
    var prev = $("photo-preview"), rm = $("photo-remove");
    if (prev) {
      if (customPhoto) { prev.src = customPhoto; prev.hidden = false; }
      else prev.hidden = true;
    }
    if (rm) rm.hidden = !customPhoto;
    applyAvatar();
  }
  function clearCustomPhoto() {
    if (photoKey) { try { localStorage.removeItem(photoKey); } catch (e) { /* ignore */ } }
    photoKey = "";
    customPhoto = "";
    var prev = $("photo-preview"), rm = $("photo-remove");
    if (prev) prev.hidden = true;
    if (rm) rm.hidden = true;
    photoHint("", false);
  }
  function handlePhotoFile(f) {
    var err = validatePhotoFile(f);
    if (err) { photoHint(err, true); return; }
    photoHint("Processing…", false);
    var rd = new FileReader();
    rd.onload = function () {
      var img = new Image();
      img.onload = function () {
        downscaleToDataURL(img, function (e, url) {
          if (e || !url) { photoHint("Couldn't read that image. Try a different file.", true); return; }
          setPhotoDataURL(url);
          photoHint("Looking sharp. ✦", false);
        });
      };
      img.onerror = function () { photoHint("Couldn't read that image. Try a different file.", true); };
      img.src = rd.result;
    };
    rd.onerror = function () { photoHint("Couldn't read that file.", true); };
    rd.readAsDataURL(f);
  }

  /* ── generator mode tabs ── */
  function syncTabs() {
    var tg = $("tab-github"), tr = $("tab-resume");
    if (!tg || !tr) return;
    tg.classList.toggle("active", mode === "github");
    tr.classList.toggle("active", mode === "resume");
    tg.setAttribute("aria-selected", mode === "github" ? "true" : "false");
    tr.setAttribute("aria-selected", mode === "resume" ? "true" : "false");
    $("panel-github").hidden = (mode !== "github");
    $("panel-resume").hidden = (mode !== "resume");
  }
  function setMode(m) {
    if (mode === m) { syncTabs(); return; }
    mode = m;
    cust = loadCust(); /* namespaced per mode: theme/font/motion persist, copy does not leak */
    syncTabs();
  }

  /* ── resume file flow ── */
  var pendingResume = null;
  function resumeError(msg) {
    var el = $("resume-error");
    if (!msg) { el.hidden = true; el.textContent = ""; return; }
    el.hidden = false;
    el.textContent = msg;
  }
  function setPendingResume(name, text) {
    pendingResume = text ? { name: name, text: text } : null;
    $("resume-filename").textContent = name || "";
    $("resume-file-row").hidden = !text;
    $("resume-generate-btn").disabled = !text;
    resumeError(null);
  }

  /* ── contact privacy review ──
     Detected email / phone / location / profile links are never rendered,
     saved, downloaded or shared until the user explicitly opts each one in. */
  var CONTACT_FIELDS = [
    { key: "email", label: "Email", sensitive: true },
    { key: "phone", label: "Phone", sensitive: true },
    { key: "location", label: "Location", sensitive: true },
    { key: "links.linkedin", label: "LinkedIn", sensitive: false },
    { key: "links.github", label: "GitHub", sensitive: false },
    { key: "links.website", label: "Website", sensitive: false }
  ];
  function contactVal(r, key) {
    var parts = key.split("."), o = r;
    for (var i = 0; i < parts.length; i++) { o = o ? o[parts[i]] : ""; }
    return o || "";
  }
  function setContactVal(r, key, val) {
    var parts = key.split("."), o = r;
    for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = val;
  }
  function detectContactFields(r) {
    return CONTACT_FIELDS
      .map(function (f) {
        return { key: f.key, label: f.label, sensitive: f.sensitive, value: contactVal(r, f.key) };
      })
      .filter(function (f) { return !!f.value; });
  }
  /* redacted copy of the parsed resume honoring the consent map; the consent
     decision itself is serialized with the data so saves/shares stay honest */
  function applyContactConsent(r, consent) {
    var copy = JSON.parse(JSON.stringify(r));
    CONTACT_FIELDS.forEach(function (f) {
      if (consent && consent[f.key] === false) setContactVal(copy, f.key, "");
    });
    copy.contactConsent = consent || {};
    return copy;
  }
  var pendingPrivacy = null;
  function showPrivacyModal(parsed, name, fields) {
    pendingPrivacy = { parsed: parsed, name: name };
    var box = $("privacy-fields");
    box.innerHTML = "";
    fields.forEach(function (f) {
      var row = document.createElement("label");
      row.className = "privacy-row";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !f.sensitive; /* sensitive fields default to excluded */
      cb.setAttribute("data-pkey", f.key);
      var info = document.createElement("span");
      info.className = "privacy-info";
      var lab = document.createElement("span");
      lab.className = "privacy-label";
      lab.textContent = f.label;
      var val = document.createElement("span");
      val.className = "privacy-value";
      val.textContent = f.value;
      info.appendChild(lab);
      info.appendChild(val);
      row.appendChild(cb);
      row.appendChild(info);
      if (f.sensitive) {
        var tag = document.createElement("span");
        tag.className = "privacy-tag";
        tag.textContent = "Private";
        row.appendChild(tag);
      }
      box.appendChild(row);
    });
    $("privacy-modal").hidden = false;
  }
  function hidePrivacyModal() {
    $("privacy-modal").hidden = true;
    pendingPrivacy = null;
  }
  function setAllPrivacy(on) {
    var boxes = $("privacy-fields").querySelectorAll('input[type="checkbox"]');
    for (var i = 0; i < boxes.length; i++) boxes[i].checked = on;
  }
  function confirmPrivacy() {
    if (!pendingPrivacy) return;
    var consent = {};
    var boxes = $("privacy-fields").querySelectorAll('input[type="checkbox"]');
    for (var i = 0; i < boxes.length; i++) consent[boxes[i].getAttribute("data-pkey")] = boxes[i].checked;
    var redacted = applyContactConsent(pendingPrivacy.parsed, consent);
    var name = pendingPrivacy.name;
    hidePrivacyModal();
    currentSource = { type: "resume", ref: name, data: redacted };
    renderResumePortfolio(redacted);
    show("portfolio");
  }
  function readResumeFile(f) {
    var name = (f.name || "").toLowerCase();
    if (/\.(txt|md|markdown)$/.test(name) || (f.type || "").indexOf("text/") === 0) {
      return f.text();
    }
    if (/\.docx$/.test(name)) {
      return f.arrayBuffer().then(parseDocxBytes);
    }
    if (/\.pdf$/.test(name)) {
      return f.arrayBuffer().then(parsePdfBytes);
    }
    return Promise.reject(new Error("format"));
  }
  function handleResumeFile(f) {
    if (!f) return;
    resumeError(null);
    $("resume-filename").textContent = (f.name || "file") + ": reading…";
    $("resume-file-row").hidden = false;
    $("resume-generate-btn").disabled = true;
    /* safety net: never leave the UI stuck on "reading…" — if the read stalls,
       bail out with a friendly message instead of hanging forever. */
    var timedRead = Promise.race([
      readResumeFile(f),
      new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error("timeout")); }, 30000);
      })
    ]);
    timedRead.then(function (text) {
      if (!text || text.trim().length < 40) throw new Error("empty");
      setPendingResume(f.name, text);
    }).catch(function (err) {
      setPendingResume(null);
      var msg = "Couldn't read that file. ";
      if (err && err.code === "scanned") {
        msg = "This looks like a scanned/image PDF with no selectable text. Export your resume as DOCX or TXT instead and try again.";
      } else if (err && err.message === "format") {
        msg += "Please use a PDF, DOCX, TXT or Markdown file.";
      } else if (err && err.message === "empty") {
        msg += "No readable text was found, try a DOCX or TXT version.";
      } else if (err && err.message === "timeout") {
        msg = "Reading is taking too long. Your file may be very large. Try a smaller file, or a DOCX/TXT version of your resume.";
      } else {
        msg += "Try a DOCX or TXT version of your resume.";
      }
      resumeError(msg);
    });
  }
  function generateResume(name, text) {
    mode = "resume";
    cust = loadCust();
    /* one person's copy/photo never leaks into another's */
    cust.tagline = ""; cust.bio = ""; saveCust();
    clearCustomPhoto();
    downloadSlug = slugify(String(name || "resume").replace(/\.(pdf|docx|txt|md|markdown)$/i, ""));
    syncTabs();
    show("loading");
    setTimeout(function () {
      try {
        var parsed = parseResumeText(text);
        var contactFields = detectContactFields(parsed);
        if (contactFields.length) {
          /* explicit include/exclude decision before anything renders */
          showPrivacyModal(parsed, name, contactFields);
        } else {
          currentSource = { type: "resume", ref: name, data: parsed };
          renderResumePortfolio(parsed);
          show("portfolio");
        }
      } catch (err) {
        show("generator");
        resumeError("Couldn't make sense of that resume. The text may be unusually formatted. Try a cleaner DOCX or TXT version.");
      }
    }, 60);
  }

  /* ═══════════════ customize ═══════════════ */
  function applyCustomText() {
    var tagline = $("pf-tagline"), bio = $("about-bio");
    if (!tagline || !bio) return;
    tagline.textContent = cust.tagline || tagline.dataset.base || "";
    bio.textContent = cust.bio || bio.dataset.base || bio.textContent;
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
    /* mode-aware drawer copy */
    var ft2 = $("fld-tagline"), fb2 = $("fld-bio"), sh2 = $("sections-hint");
    if (ft2) ft2.placeholder = mode === "resume" ? "Leave blank to use the parsed headline" : "Leave blank to use the GitHub bio";
    if (fb2) fb2.placeholder = mode === "resume" ? "Leave blank to use the resume summary" : "Leave blank to use the GitHub bio";
    if (sh2) sh2.textContent = mode === "resume"
      ? "About, Projects and Contact are always shown."
      : "About, Selected Work and Contact are always shown.";
  }

  function applyCustomize() {
    var vp = views.portfolio;
    vp.setAttribute("data-theme", cust.theme);
    vp.setAttribute("data-font", cust.font);
    vp.setAttribute("data-density", cust.density);
    /* the theme follows the portfolio: on body it tints the drawer/modal/toast
       while the portfolio is visible, and Paper holds the product chrome */
    syncBodyTheme();
    /* sections + nav labels, per mode */
    MODE_SECTIONS[mode].forEach(function (sd) {
      var secEl = $(sd.sec);
      var showSec = sd.toggle ? !!cust.sections[sd.key] : true;
      if (secEl) secEl.hidden = !showSec;
      var a = document.querySelector('.mini-nav a[href="#' + sd.sec + '"]');
      if (a) {
        a.hidden = !showSec;
        a.textContent = sd.label;
        a.setAttribute("data-nav", sd.key);
      }
    });
    applyCustomText();
    applyAvatar();
    buildSectionToggles();
    syncPanel();
    initMotion();
    /* the colophon names the current faces + theme — keep it truthful after retunes */
    if (typeof currentSource !== "undefined" && currentSource) {
      var fnote = $("footer-note");
      if (fnote) fnote.innerHTML = colophonHTML(mode === "resume" ? "from a resume, parsed in your browser" : "from public GitHub data");
    }
  }

  /* section toggles, rebuilt per mode */
  function buildSectionToggles() {
    var st = $("section-toggles");
    st.innerHTML = "";
    var labels = mode === "resume"
      ? { experience: "Experience", skills: "Skills" }
      : { activity: "Recent Activity", stack: "Tech Stack", journey: "Journey" };
    MODE_SECTIONS[mode].forEach(function (sd) {
      if (!sd.toggle) return;
      var lab = document.createElement("label");
      lab.className = "switch";
      var inp = document.createElement("input");
      inp.type = "checkbox";
      inp.setAttribute("data-sec", sd.key);
      inp.checked = !!cust.sections[sd.key];
      var knob = document.createElement("span");
      knob.className = "knob";
      knob.setAttribute("aria-hidden", "true");
      var lbl = document.createElement("span");
      lbl.className = "switch-label";
      lbl.textContent = labels[sd.key] || sd.label;
      lab.appendChild(inp); lab.appendChild(knob); lab.appendChild(lbl);
      inp.addEventListener("change", function () {
        cust.sections[sd.key] = inp.checked; saveCust(); applyCustomize();
      });
      st.appendChild(lab);
    });
  }

  /* theme + type previews on the generator — rendered in their own tokens.
     Clicking one previews it on the specimen and saves the choice, so the
     portfolio you generate uses exactly what you previewed. */
  function previewTheme(key) {
    var t = themeByKey(key);
    if (!t) return;
    cust.theme = key; saveCust();
    var sp = document.querySelector(".hero-specimen");
    if (sp) {
      var v = t.vars;
      [["--bg", v.bg], ["--bg-2", v.bg2], ["--surface", v.surface], ["--ink", v.ink],
       ["--muted", v.muted], ["--faint", v.faint], ["--accent", v.accent],
       ["--accent-2", v.accent2], ["--on-accent", v.onAccent], ["--line", v.line],
       ["--line-soft", v.lineSoft]].forEach(function (pair) {
        sp.style.setProperty(pair[0], pair[1]);
      });
      var cap = sp.querySelector(".specimen-cap");
      if (cap) cap.innerHTML = "A live specimen of the " + esc(t.name) + " theme. Click another theme or type system to preview it here. Your choice carries into the portfolio you print.";
    }
    var cards = document.querySelectorAll(".theme-card");
    cards.forEach(function (c) {
      var on = c.getAttribute("data-theme-key") === key;
      c.classList.toggle("active", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  function previewFont(key) {
    var f = fontByKey(key);
    if (!f) return;
    cust.font = key; saveCust();
    var sp = document.querySelector(".hero-specimen");
    if (sp) sp.setAttribute("data-font", key);
    var rows = document.querySelectorAll(".type-row");
    rows.forEach(function (r) {
      var on = r.getAttribute("data-font-key") === key;
      r.classList.toggle("active", on);
      r.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  function populateThemeCards() {
    var wrap = $("theme-cards");
    if (!wrap) return;
    wrap.innerHTML = "";
    THEMES.forEach(function (t) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "theme-card";
      card.setAttribute("data-theme-key", t.key);
      card.setAttribute("aria-pressed", t.key === cust.theme ? "true" : "false");
      if (t.key === cust.theme) card.classList.add("active");
      card.style.setProperty("--card-bg", t.vars.bg);
      card.style.setProperty("--card-ink", t.vars.ink);
      card.style.setProperty("--tc-accent", t.accent);
      card.style.setProperty("--tc-on-accent", t.vars.onAccent);
      card.innerHTML =
        '<span class="tc-name">' + esc(t.name) + '</span>' +
        '<span class="tc-line">' + esc(t.hint) + '</span>' +
        '<span class="tc-cta">Preview theme</span>' +
        '<span class="tc-meta">' + esc(t.vars.bg.toUpperCase() + " / " + t.accent.toUpperCase()) + '</span>';
      card.addEventListener("click", function () { previewTheme(t.key); });
      wrap.appendChild(card);
    });
  }

  function populateTypeRows() {
    var wrap = $("type-rows");
    if (!wrap) return;
    wrap.innerHTML = "";
    FONTS.forEach(function (f) {
      var row = document.createElement("button");
      row.type = "button";
      row.className = "type-row";
      row.setAttribute("data-font-key", f.key);
      row.setAttribute("aria-pressed", f.key === cust.font ? "true" : "false");
      if (f.key === cust.font) row.classList.add("active");
      row.innerHTML =
        '<span class="aa" style="font-family:' + f.display + '">Ag</span>' +
        '<span><strong>' + esc(f.name) + '</strong><em>' + esc(f.hint) + '</em></span>';
      row.addEventListener("click", function () { previewFont(f.key); });
      wrap.appendChild(row);
    });
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
      b.innerHTML = '<span class="dots" aria-hidden="true"><i style="background:' + t.vars.bg + '"></i>' +
        '<i style="background:' + t.accent + '"></i><i style="background:' + t.accent2 + '"></i></span>' +
        "<span>" + esc(t.name) + "</span>";
      b.addEventListener("click", function () {
        cust.theme = t.key; saveCust(); applyCustomize(); previewTheme(t.key);
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
        cust.font = f.key; saveCust(); applyCustomize(); previewFont(f.key);
      });
      fo.appendChild(b);
    });

    /* section toggles are built per-mode by buildSectionToggles() (called from applyCustomize) */

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

    /* profile photo */
    $("photo-pick-btn").addEventListener("click", function () { $("photo-input").click(); });
    $("photo-input").addEventListener("change", function (ev) {
      var f = ev.target.files && ev.target.files[0];
      if (f) handlePhotoFile(f);
      ev.target.value = "";
    });
    $("photo-remove").addEventListener("click", function () {
      setPhotoDataURL("");
      photoHint("", false);
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
    if (!drawerOpen()) {
      /* already closed: don't schedule a stray hide timer that could swallow
         a drawer opened in the next few hundred milliseconds */
      d.hidden = true; s.hidden = true;
      return;
    }
    d.classList.remove("open"); s.classList.remove("open");
    setTimeout(function () { d.hidden = true; s.hidden = true; }, 400);
  }
  function drawerOpen() {
    return !$("drawer").hidden && $("drawer").classList.contains("open");
  }

  /* ═══════════════ subtle motion ═══════════════
     Scroll reveals only. No particles, no parallax, no orbs, no card tilt. */
  var motionCleanup = [];

  function clearMotion() {
    motionCleanup.forEach(function (fn) { try { fn(); } catch (e) { /* ignore */ } });
    motionCleanup = [];
  }

  /* colophon: which faces printed this portfolio, in which theme, from what source */
  function colophonHTML(sourceLabel) {
    var f = fontByKey(cust.font), t = themeByKey(cust.theme);
    var d = new Date();
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var date = d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
    var faces = f.key === "mono"
      ? "Set entirely in <strong>IBM Plex Mono</strong>"
      : "Set in <strong>" + esc(f.faces) + "</strong> and <strong>IBM Plex Mono</strong>";
    return faces + ". " + esc(t.name) + " theme. Printed " + date + " " + sourceLabel + ".";
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

  /* ── render ── */
  function renderPortfolio(data) {
    var user = data.user, repos = data.repos;

    /* resume-mode chrome reset */
    setSectionLabels("github");
    downloadSlug = slugify(user.login);
    currentAvatarUrl = user.avatar_url + "&s=336";
    currentResumeName = "";
    $("stat-label-repos").textContent = "Public repos";
    $("stat-label-followers").textContent = "Followers";
    $("stat-label-stars").textContent = "Total stars";
    $("stat-label-forks").textContent = "Total forks";
    $("stat-label-years").textContent = "Years on GitHub";
    $("stat-years").hidden = false;
    $("skill-groups").hidden = true;
    $("lang-bar").hidden = false;
    $("lang-legend").hidden = false;
    $("footer-note").innerHTML = colophonHTML("from public GitHub data");

    /* hero */
    $("pf-name").textContent = user.name || user.login;
    var pfStatus = $("pf-status");
    if (pfStatus) pfStatus.hidden = !(user.hireable === true);
    var heroTag = $("pf-tagline");
    heroTag.textContent = user.bio || "Software Developer";
    heroTag.dataset.base = heroTag.textContent;
    var meta = $("hero-meta");
    if (meta) {
      meta.innerHTML = "";
      if (user.location) {
        var mli = document.createElement("li");
        mli.textContent = user.location;
        meta.appendChild(mli);
      }
      var mli2 = document.createElement("li");
      var ma = document.createElement("a");
      ma.href = user.html_url; ma.target = "_blank"; ma.rel = "noopener";
      ma.textContent = "github.com/" + user.login;
      mli2.appendChild(ma);
      meta.appendChild(mli2);
    }

    /* about */
    var aboutBio = $("about-bio");
    if (user.bio) { aboutBio.textContent = user.bio; }
    else { aboutBio.textContent = "This developer hasn't written a public bio yet. The work below speaks for them."; }
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
    $("about-meta").innerHTML = metaBits.join(" &nbsp;/&nbsp; ");

    /* stats */
    var totalStars = 0, totalForks = 0;
    repos.forEach(function (r) { totalStars += r.stargazers_count || 0; totalForks += r.forks_count || 0; });
    /* stats: stash raw values in data-count, text set by fmtNum */
    function setStat(id, raw) {
      var el = $(id);
      if (!el) return;
      el.textContent = fmtNum(raw);
      el.setAttribute("data-count", String(raw));
    }
    setStat("stat-num-repos", user.public_repos);
    setStat("stat-num-followers", user.followers);
    setStat("stat-num-stars", totalStars);
    setStat("stat-num-forks", totalForks);
    var years = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (365.25 * 24 * 3600 * 1000));
    $("stat-num-years").textContent = years < 1 ? "<1" : String(years);
    $("stat-years").hidden = false;
    $("sec-about").querySelector(".stats").style.gridTemplateColumns = "";

    /* top repos */
    var sorted = repos.slice().sort(function (a, b) { return (b.stargazers_count || 0) - (a.stargazers_count || 0); });
    var top = repos.filter(function (r) { return !r.fork; })
      .sort(function (a, b) { return (b.stargazers_count || 0) - (a.stargazers_count || 0); })
      .slice(0, 6);
    if (top.length === 0) top = sorted.slice(0, 6);
    var topRepo = top[0] || sorted[0] || null;

    var grid = $("work-list");
    grid.innerHTML = "";
    $("work-note").hidden = true;
    if (top.length === 0) {
      grid.innerHTML = '<p class="work-empty">No public repositories yet. Check back soon.</p>';
    } else {
      top.forEach(function (r) {
        var card = document.createElement("article");
        card.className = "work-card reveal";
        var kickerBits = [];
        if (r.language) kickerBits.push(r.language);
        (r.topics || []).slice(0, 4).forEach(function (t) { kickerBits.push(t); });

        card.innerHTML =
          (kickerBits.length ? '<p class="work-kicker">' + esc(kickerBits.join(" · ")) + "</p>" : "") +
          '<h3 class="work-name"><a href="' + esc(r.html_url) + '" target="_blank" rel="noopener">' + esc(r.name) + "</a></h3>" +
          (r.description ? '<p class="work-desc">' + esc(r.description) + "</p>"
            : '<p class="work-desc work-desc-empty">No description provided.</p>') +
          '<div class="work-excerpt loading" data-repo="' + r.id + '" aria-live="polite"></div>' +
          '<p class="work-meta">' + fmtNum(r.stargazers_count || 0) + " " + plural(r.stargazers_count || 0, "star", "stars") +
          " · " + fmtNum(r.forks_count || 0) + " " + plural(r.forks_count || 0, "fork", "forks") +
          " · Updated " + esc(relTime(r.updated_at)) + "</p>";
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
        seg.title = l.name + ": " + pct + "%";
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
      "--accent:" + v.accent + ";--accent-2:" + v.accent2 + ";--on-accent:" + v.onAccent + ";" +
      "--line:" + v.line + ";--line-soft:" + v.lineSoft + ";" +
      "--font-display:" + f.display + ";--font-body:" + f.body + ";--font-mono:" + f.mono + ";--font-serif:\"Zodiak\",Georgia,\"Times New Roman\",serif}";

    var R = [
      "html{scroll-behavior:smooth}",
      "body{background:var(--bg);color:var(--ink);font-family:var(--font-body);margin:0;padding:0;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}",
      ".pf{padding:88px 28px 64px;max-width:1100px;margin:0 auto;overflow-wrap:break-word}",
      ".pf a,.pf .work-name,.pf .t-text,.pf .about-meta,.pf .j-detail,.pf .skill-chip,.pf .social-chip,.pf .work-desc,.pf .hero-meta{overflow-wrap:anywhere;word-break:break-word}",
      ".pf section{margin-bottom:112px}",
      ".hero{padding:0 0 72px}",
      ".hero-top{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:32px}",
      ".avatar-wrap{position:relative;width:112px;height:112px;flex-shrink:0}",
      ".avatar{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block}",
      ".monogram{position:absolute;inset:0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:600;font-size:2.4rem;color:var(--on-accent);background:var(--accent)}",
      ".monogram[hidden]{display:none}",
      ".availability{display:inline-flex;align-items:center;gap:9px;font-size:14px;font-weight:600;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:9px 18px;margin:0;background:var(--surface);white-space:nowrap}",
      ".availability[hidden]{display:none}",
      ".avail-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0}",
      ".pf-name{font-family:var(--font-display);font-weight:700;font-size:clamp(3rem,8vw,5.4rem);letter-spacing:-.04em;line-height:.98;margin:0 0 20px;text-wrap:balance}",
      ".pf-tagline{font-size:clamp(1.15rem,2.4vw,1.45rem);line-height:1.5;color:var(--ink);font-weight:500;max-width:32ch;margin:0 0 32px}",
      ".hero-meta{list-style:none;display:flex;flex-wrap:wrap;gap:12px 32px;margin:0;padding:0}",
      ".hero-meta li{font-size:15px;color:var(--muted);font-weight:600}",
      ".hero-meta a{color:var(--ink);text-decoration:none;border-bottom:2px solid var(--accent);font-weight:700}",
      ".sec-title{font-family:var(--font-display);font-weight:600;font-size:clamp(2rem,4.2vw,3rem);letter-spacing:-.03em;line-height:1.02;margin:0 0 16px;text-wrap:balance}",
      ".sec-lede{color:var(--muted);font-size:17px;line-height:1.7;max-width:62ch;margin:0 0 48px}",
      ".inline-note{font-size:15px;color:var(--muted);line-height:1.7;background:var(--bg-2);border:1px solid var(--line-soft);border-radius:12px;padding:18px 22px;margin:0 0 8px;max-width:68ch}",
      ".about-bio{font-size:19px;line-height:1.75;max-width:68ch;margin:0 0 24px}",
      ".about-meta{font-size:15px;color:var(--muted);line-height:1.9;max-width:68ch;margin:0 0 56px}",
      ".about-meta a{color:var(--accent);font-weight:600}",
      ".stats{display:grid;grid-template-columns:repeat(5,1fr)}",
      ".stat{padding:8px 28px 8px 0}",
      ".stat+.stat{border-left:1px solid var(--line-soft);padding-left:28px}",
      ".stat-num{display:block;font-family:var(--font-display);font-weight:600;font-size:clamp(1.8rem,3vw,2.6rem);letter-spacing:-.03em;line-height:1;margin-bottom:10px;font-variant-numeric:tabular-nums}",
      ".stat-label{font-size:12.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}",
      ".work-list{border-top:1px solid var(--line)}",
      ".work-card{padding:36px 0;border-bottom:1px solid var(--line)}",
      ".work-kicker{font-family:var(--font-mono);font-size:12.5px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin:0 0 12px}",
      ".work-name{font-family:var(--font-display);font-weight:600;font-size:clamp(1.6rem,3.2vw,2.3rem);letter-spacing:-.025em;line-height:1.05;margin:0 0 12px}",
      ".work-name a{color:var(--ink);text-decoration:none}",
      ".work-desc{color:var(--muted);font-size:16px;line-height:1.7;max-width:66ch;margin:0 0 18px}",
      ".work-desc-empty{color:var(--faint);font-style:italic}",
      ".work-excerpt{border-left:2px solid var(--accent);padding:4px 0 4px 20px;margin:0 0 20px;color:var(--muted);line-height:1.7;font-size:15px;max-width:66ch}",
      ".excerpt-label{display:block;font-family:var(--font-mono);font-size:11.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);margin-bottom:8px}",
      ".work-meta{font-family:var(--font-mono);font-size:13px;color:var(--muted);margin:0}",
      ".work-empty{color:var(--muted);font-size:16px;line-height:1.7;padding:40px 0}",
      ".timeline{max-width:780px;border-top:1px solid var(--line)}",
      ".t-item{padding:22px 0;border-bottom:1px solid var(--line);display:grid;grid-template-columns:1fr 180px;gap:24px;align-items:baseline}",
      ".t-text{font-size:16px;line-height:1.65;margin:0;color:var(--ink)}",
      ".t-text a{color:var(--accent);font-weight:600}",
      ".t-date{font-family:var(--font-mono);font-size:12.5px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin:0;text-align:right;white-space:nowrap}",
      ".lang-bar{display:flex;height:10px;border-radius:999px;overflow:hidden;margin:8px 0 28px}",
      ".lang-seg{height:100%;min-width:2px}",
      ".lang-legend{display:flex;flex-wrap:wrap;gap:12px 28px}",
      ".lang-item{display:flex;align-items:center;font-size:15px;font-weight:600;color:var(--ink)}",
      ".lang-item .pct{color:var(--faint);margin-left:8px;font-size:13px;font-family:var(--font-mono);font-weight:500}",
      ".skill-groups{display:grid;grid-template-columns:repeat(2,1fr);gap:0 48px;max-width:900px;border-top:1px solid var(--line)}",
      ".skill-group{padding:28px 0;border-bottom:1px solid var(--line)}",
      ".skill-group-title{font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin:0 0 16px}",
      ".skill-chips{display:flex;flex-wrap:wrap;gap:10px}",
      ".skill-chip{font-size:14.5px;font-weight:600;color:var(--ink);border:1px solid var(--line);border-radius:999px;padding:8px 16px;background:var(--surface)}",
      ".exp-bullets{margin:14px 0 0;padding-left:20px;color:var(--muted);font-size:15.5px;line-height:1.7;max-width:66ch}",
      ".exp-bullets li{margin-bottom:6px}",
      ".journey{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}",
      ".journey li{display:grid;grid-template-columns:1fr;gap:10px;padding:32px 0;border-bottom:1px solid var(--line)}",
      ".j-title{font-family:var(--font-display);font-weight:600;font-size:clamp(1.3rem,2.6vw,1.75rem);letter-spacing:-.02em;margin:0 0 8px}",
      ".j-detail{color:var(--muted);font-size:16px;line-height:1.7;margin:0;max-width:62ch}",
      ".j-detail a{color:var(--accent);font-weight:600}",
      ".contact-title{font-size:clamp(2.6rem,7vw,4.6rem)}",
      ".contact-sub{color:var(--muted);font-size:17px;line-height:1.7;margin:0 0 36px;max-width:44ch}",
      ".contact-actions{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px}",
      ".btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--accent);color:var(--on-accent);border:1px solid transparent;border-radius:12px;font-weight:700;font-size:17px;padding:15px 30px;text-decoration:none}",
      ".btn-quiet{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:12px;font-weight:600;font-size:15px;padding:13px 22px;text-decoration:none}",
      ".social-chips{display:flex;flex-wrap:wrap;gap:10px}",
      ".social-chip{display:inline-flex;align-items:center;font-size:14.5px;font-weight:600;color:var(--ink);text-decoration:none;border:1px solid var(--line);border-radius:999px;background:var(--surface);padding:10px 20px}",
      ".pf-footer{padding:8px 0 24px}",
      ".footer-rule{height:1px;background:var(--line);margin-bottom:28px}",
      ".colophon{font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);margin:0 0 10px}",
      ".pf-footer p:last-child{color:var(--muted);font-size:14.5px;margin:0}",
      ".pf-footer strong{color:var(--ink)}",
      ".reveal{opacity:1}",
      ".motion-on .reveal{opacity:0;transform:translateY(16px);transition:opacity .55s ease,transform .6s cubic-bezier(.22,1,.36,1)}",
      ".motion-on .reveal.in{opacity:1;transform:translateY(0)}",
      "@media(max-width:1024px){.stats{grid-template-columns:repeat(3,1fr);gap:28px 0}.stat:nth-child(4){border-left:0;padding-left:0}}",
      "@media(max-width:640px){.pf{padding:56px 20px 40px}.pf section{margin-bottom:72px}.avatar-wrap{width:88px;height:88px}.stats{grid-template-columns:repeat(2,1fr);gap:24px 0}.stat:nth-child(3){border-left:0;padding-left:0}.work-card{grid-template-columns:1fr;gap:14px;padding:32px 0}.t-item{grid-template-columns:1fr;gap:8px}.t-date{text-align:left}.skill-groups{grid-template-columns:1fr}.contact-actions .btn-primary{width:100%}}",
      "@media(prefers-reduced-motion:reduce){.motion-on .reveal{opacity:1;transform:none;transition:none}}"
    ];

    if (cust.density === "compact") {
      R.push(".pf section{margin-bottom:64px}");
      R.push(".hero{padding-bottom:40px}");
      R.push(".work-card{padding:26px 0}");
      R.push(".journey li{padding:22px 0}");
    }

    /* per-font display tweaks — mirror the live type systems */
    if (cust.font === "grotesk") {
      R.push(".pf-name,.sec-title,.work-name,.j-title{text-transform:uppercase}");
      R.push(".pf-name{font-weight:700}");
      R.push(".pf-name,.sec-title,.work-name,.j-title,.contact-title{word-spacing:.14em}");
    } else if (cust.font === "editorial") {
      R.push(".pf-name,.sec-title,.work-name,.j-title,.contact-title{font-family:var(--font-serif);font-weight:700;letter-spacing:-.01em;text-transform:none}");
      R.push(".pf-tagline{font-family:var(--font-serif);font-style:italic;font-size:21px;max-width:34ch}");
      R.push(".about-bio{font-size:20px;max-width:62ch}");
    } else if (cust.font === "technical") {
      R.push(".pf-name,.sec-title,.work-name,.j-title{font-weight:750;letter-spacing:.01em;text-transform:uppercase}");
      R.push(".pf-name,.sec-title,.work-name,.j-title{word-spacing:.14em}");
      R.push(".sec-title{font-size:clamp(1.7rem,3.4vw,2.4rem)}");
    } else if (cust.font === "mono") {
      R.push(".pf-name,.sec-title,.work-name,.j-title,.contact-title,.stat-num{font-family:var(--font-mono);font-weight:600;letter-spacing:-.02em;text-transform:none}");
      R.push(".pf-name{font-size:clamp(2.2rem,6vw,4rem)}");
    }

    /* per-theme bespoke flourishes */
    if (cust.theme === "paper") {
      R.push(".pf-name{letter-spacing:-.045em}");
      R.push(".work-name a{text-decoration:underline;text-decoration-color:var(--line);text-underline-offset:6px;text-decoration-thickness:2px}");
      R.push(".btn-primary{border-radius:999px}");
    } else if (cust.theme === "mono") {
      R.push(".pf-name,.sec-title{letter-spacing:-.02em}");
      R.push(".btn-primary,.btn-quiet{border-radius:0}");
    } else if (cust.theme === "ink") {
      R.push(".pf-name{font-size:clamp(3.4rem,9vw,6.4rem);letter-spacing:-.045em}");
    } else if (cust.theme === "forest") {
      R.push(".pf-tagline{font-family:var(--font-serif);font-style:italic;font-size:21px}");
    } else if (cust.theme === "clay") {
      R.push(".pf-tagline{font-style:italic}");
    } else if (cust.theme === "dusk") {
      R.push(".sec-title{font-weight:500}");
      R.push(".pf-name{font-weight:600}");
      R.push(".work-name a{text-decoration:underline;text-decoration-color:var(--line);text-underline-offset:6px;text-decoration-thickness:2px}");
    } else if (cust.theme === "cobalt") {
      R.push(".btn-primary{border-radius:8px}");
      R.push(".work-kicker{letter-spacing:.1em}");
    } else if (cust.theme === "slate") {
      R.push(".btn-primary{border-radius:8px}");
    }

    return root + "\n" + R.join("\n");
  }

  /* self-contained motion script for the exported HTML (restrained reveals only) */
  function exportMotionJS() {
    return "(function(){\n'use strict';\n" +
      "var mq=window.matchMedia;\n" +
      "if(mq&&mq('(prefers-reduced-motion: reduce)').matches)return;\n" +
      "document.documentElement.className+=' motion-on';\n" +
      "var rev=document.querySelectorAll('.reveal');\n" +
      "function showEl(el,i){el.style.transitionDelay=((i%4)*70)+'ms';el.classList.add('in');}\n" +
      "if('IntersectionObserver' in window){\n" +
      "var io=new IntersectionObserver(function(es){for(var k=0;k<es.length;k++){if(es[k].isIntersecting){var idx=Array.prototype.indexOf.call(rev,es[k].target);showEl(es[k].target,idx);io.unobserve(es[k].target);}}},{threshold:0.08,rootMargin:'0px 0px -6% 0px'});\n" +
      "for(var r=0;r<rev.length;r++)io.observe(rev[r]);\n" +
      "}else{for(var r2=0;r2<rev.length;r2++)showEl(rev[r2],r2);}\n" +
      "})();";
  }

  /* standalone export: embed the self-hosted woff2 files so the download has zero CDN links.
     Fetch can fail (e.g. file://) — then the file falls back to system fonts. */
  var EXPORT_FONTS = [
    ["fonts/archivo-var.woff2", "Archivo", "100 900", "normal"],
    ["fonts/archivo-var-italic.woff2", "Archivo", "100 900", "italic"],
    ["fonts/ibm-plex-mono-400.woff2", "IBM Plex Mono", "400", "normal"],
    ["fonts/ibm-plex-mono-500.woff2", "IBM Plex Mono", "500", "normal"],
    ["fonts/ibm-plex-mono-600.woff2", "IBM Plex Mono", "600", "normal"],
    ["fonts/clash-display-500.woff2", "Clash Display", "500", "normal"],
    ["fonts/clash-display-600.woff2", "Clash Display", "600", "normal"],
    ["fonts/clash-display-700.woff2", "Clash Display", "700", "normal"],
    ["fonts/zodiak-400.woff2", "Zodiak", "400", "normal"],
    ["fonts/zodiak-400-italic.woff2", "Zodiak", "400", "italic"],
    ["fonts/zodiak-700.woff2", "Zodiak", "700", "normal"]
  ];
  function bufToB64(buf) {
    var bytes = new Uint8Array(buf), s = "";
    for (var i = 0; i < bytes.length; i += 0x8000) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(s);
  }
  function exportFontCSS() {
    return Promise.all(EXPORT_FONTS.map(function (f) {
      return fetch(f[0]).then(function (res) {
        if (!res.ok) throw new Error("font " + res.status);
        return res.arrayBuffer();
      }).then(function (buf) {
        return "@font-face{font-family:'" + f[1] + "';font-style:" + f[3] + ";font-weight:" + f[2] +
          ";font-display:swap;src:url(data:font/woff2;base64," + bufToB64(buf) + ") format('woff2')}";
      }).catch(function () { return ""; });
    })).then(function (parts) { return parts.join("\n"); });
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
    /* WebGL atmosphere + FX hooks are runtime-only — keep the export static */
    root.querySelectorAll(".pf-fx").forEach(function (el) { el.remove(); });
    root.querySelectorAll("[data-intro]").forEach(function (el) { el.removeAttribute("data-intro"); });
    root.querySelectorAll("[data-magnetic]").forEach(function (el) { el.removeAttribute("data-magnetic"); });
    root.querySelectorAll("[hidden]").forEach(function (el) { el.remove(); });
    /* drop anything hidden via inline display:none (e.g. unused hero bits) */
    root.querySelectorAll("main [style]").forEach(function (el) {
      if (el.style && el.style.display === "none") el.remove();
    });
    /* avatar: custom photo → embed dataURL; monogram → keep; else GitHub avatar */
    var avImg = root.querySelector("#pf-avatar"), mono = root.querySelector("#pf-monogram");
    if (customPhoto) {
      if (avImg) { avImg.src = customPhoto; avImg.style.display = ""; }
      if (mono) mono.remove();
    } else if (mono) {
      if (avImg) avImg.remove();
    } else if (avImg) {
      if (mono) mono.remove();
      avImg.style.display = "";
    }
    root.querySelectorAll(".work-excerpt.loading").forEach(function (el) {
      el.classList.remove("loading");
      el.innerHTML = '<span style="font-style:normal">README excerpt not loaded yet.</span>';
    });
    /* reset transient motion state so the file opens clean */
    root.querySelectorAll(".in").forEach(function (el) { el.classList.remove("in"); });
    root.querySelectorAll(".reveal").forEach(function (el) { el.style.transitionDelay = ""; });
    root.querySelectorAll("script").forEach(function (el) { el.remove(); });

    var main = root.querySelector("main.portfolio");
    var script = withMotion ? '<script>\n' + exportMotionJS() + "\n</script>\n" : "";

    exportFontCSS().then(function (fontCSS) {
      var doc = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n" +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
        "<title>" + esc(name) + " · Portfolio</title>\n" +
        "<style>\n" + fontCSS + "\n" + exportCSS() + "\n</style>\n</head>\n<body>\n" +
        '<main class="pf">\n' + main.innerHTML + "\n</main>\n" + script + "</body>\n</html>";

      var blob = new Blob([doc], { type: "text/html" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = (downloadSlug || "portfolio") + "-portfolio.html";
      document.body.appendChild(link);
      link.click();
      setTimeout(function () { URL.revokeObjectURL(url); link.remove(); }, 4000);
    });
  }

  /* ── events ── */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    generate(input.value);
  });

  document.querySelectorAll(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      input.value = chip.getAttribute("data-demo") || chip.getAttribute("data-user");
      generate(input.value);
    });
  });

  $("retry-btn").addEventListener("click", function () { generate(lastUsername); });
  $("error-back-btn").addEventListener("click", function () { show("generator"); });
  $("startover-btn").addEventListener("click", startOver);
  $("download-btn").addEventListener("click", requireAuth("download the HTML", downloadHTML));

  /* mode tabs */
  $("tab-github").addEventListener("click", function () { setMode("github"); });
  $("tab-resume").addEventListener("click", function () { setMode("resume"); });

  /* resume dropzone */
  (function () {
    var dz = $("dropzone"), rfile = $("resume-file");
    if (!dz || !rfile) return;
    function pick() { rfile.click(); }
    $("resume-pick-btn").addEventListener("click", function (e) { e.stopPropagation(); pick(); });
    dz.addEventListener("click", pick);
    dz.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); }
    });
    rfile.addEventListener("change", function () {
      if (rfile.files && rfile.files[0]) handleResumeFile(rfile.files[0]);
    });
    ["dragenter", "dragover"].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("dragover"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("dragover"); });
    });
    dz.addEventListener("drop", function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleResumeFile(f);
    });
  })();
  $("resume-clear").addEventListener("click", function () {
    $("resume-file").value = "";
    setPendingResume(null);
  });
  $("resume-sample-btn").addEventListener("click", function () {
    setPendingResume("sample-resume.txt", SAMPLE_RESUME);
  });
  $("resume-generate-btn").addEventListener("click", function () {
    if (pendingResume) generateResume(pendingResume.name, pendingResume.text);
  });

  /* privacy review modal */
  $("privacy-confirm").addEventListener("click", confirmPrivacy);
  $("privacy-all").addEventListener("click", function () { setAllPrivacy(true); });
  $("privacy-none").addEventListener("click", function () { setAllPrivacy(false); });
  $("privacy-back").addEventListener("click", function () { hidePrivacyModal(); show("generator"); });

  $("customize-btn").addEventListener("click", requireAuth("customize this portfolio", openDrawer));
  $("drawer-close").addEventListener("click", closeDrawer);
  $("drawer-scrim").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawerOpen()) closeDrawer();
  });

  /* init */
  buildPanel();
  populateThemeCards();
  populateTypeRows();
  /* the specimen opens previewing the saved theme + type choices */
  previewTheme(cust.theme);
  previewFont(cust.font);
  applyCustomize();
  refreshGatedButtons();
  document.body.setAttribute("data-view", "generator");
  syncBodyTheme();
  function wireBackend() {
    var b = backend();
    if (b && b.onAuthChange) { b.onAuthChange(function () { refreshGatedButtons(); }); return true; }
    return false;
  }
  /* backend.js loads after app.js — subscribe now or when it signals readiness */
  if (!wireBackend() && typeof window !== "undefined") {
    window.addEventListener("pf:backend-ready", function h() {
      window.removeEventListener("pf:backend-ready", h);
      wireBackend();
    });
  }

  /* public API — used by backend.js for save/share/dashboard auth UI */
  if (typeof window !== "undefined") {
    window.PF = {
      /* state */
      getMode: function () { return mode; },
      getCust: function () { return cust; },
      getSource: function () {
        if (!currentSource) return null;
        return {
          type: currentSource.type,
          ref: currentSource.ref,
          title: currentSource.type === "github" ? "@" + currentSource.ref : currentSource.ref,
          data: currentSource.data,
          customization: JSON.parse(JSON.stringify(cust))
        };
      },
      setSource: function (src, customization) {
        if (!src || !src.type || !src.data) return false;
        if (customization) {
          ["theme", "font", "motion", "density", "tagline", "bio"].forEach(function (k) {
            if (customization[k] !== undefined) cust[k] = customization[k];
          });
          if (customization.sections) cust.sections = customization.sections;
          if (customization.photo) customPhoto = customization.photo;
          saveCust();
          if (customPhoto) {
            var prev = $("photo-preview");
            if (prev) { prev.src = customPhoto; prev.hidden = false; }
            var rm = $("photo-remove");
            if (rm) rm.hidden = false;
          }
        }
        currentSource = src;
        if (src.type === "github") {
          lastUsername = src.ref;
          renderPortfolio(src.data);
        } else {
          currentResumeName = src.ref;
          renderResumePortfolio(src.data);
        }
        return true;
      },
      getCustomization: function () {
        return {
          theme: cust.theme, font: cust.font, motion: cust.motion, density: cust.density,
          tagline: cust.tagline, bio: cust.bio,
          sections: JSON.parse(JSON.stringify(cust.sections)),
          photo: customPhoto
        };
      },
      hasRenderable: function () { return currentSource !== null; },
      /* UI */
      show: show, showError: showError, startOver: startOver, toast: toast,
      openDrawer: openDrawer, closeDrawer: closeDrawer,
      applyCustomize: applyCustomize, exportCSS: exportCSS, downloadHTML: downloadHTML,
      setMode: setMode,
      resumeError: resumeError, resumeClearError: function () { resumeError(null); },
      resumeFileRow: function (name) {
        var row = $("resume-file-row");
        if (row) row.hidden = false;
        var fn = $("resume-filename");
        if (fn) fn.textContent = name || "";
      },
      on: function (id, ev, fn) {
        var el = $(id);
        if (el) el.addEventListener(ev, fn);
      },
      /* parse / render primitives (used by view page) */
      parseResumeText: parseResumeText,
      renderPortfolio: renderPortfolio,
      renderResumePortfolio: renderResumePortfolio
    };
  }

  /* test hook — exposed only when explicitly enabled (never in production use) */
  if (typeof window !== "undefined" && window.__PF_TEST__ === true) {
    window.__PF_TEST__ = {
      parseDocxBytes: parseDocxBytes, parsePdfBytes: parsePdfBytes,
      extractPdfText: extractPdfText, parseResumeText: parseResumeText,
      renderPortfolio: renderPortfolio, renderResumePortfolio: renderResumePortfolio,
      applyCustomize: applyCustomize, exportCSS: exportCSS, downloadHTML: downloadHTML,
      groupSkills: groupSkills, setMode: setMode, validatePhotoFile: validatePhotoFile,
      setPhotoDataURL: setPhotoDataURL, handlePhotoFile: handlePhotoFile,
      downscaleToDataURL: downscaleToDataURL, initialsOf: initialsOf,
      setSectionLabels: setSectionLabels,
      SAMPLE_RESUME: SAMPLE_RESUME,
      getMode: function () { return mode; },
      getCust: function () { return cust; },
      getPhoto: function () { return customPhoto; }
    };
  }
})();

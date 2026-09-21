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

  /* fixed order for sequential badge renumbering of visible sections */
  var SECTION_ORDER = ["sec-about", "sec-work", "sec-activity",
                       "sec-stack", "sec-journey", "sec-contact"];

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
    var c = { theme: "gold", font: "editorial", motion: true, density: "comfortable",
              shape: "circle", tagline: "", bio: "", sections: def };
    try {
      var raw = localStorage.getItem(custKey());
      if (!raw && mode === "github") raw = localStorage.getItem(CUST_KEY); /* one-time migration of pre-mode settings */
      if (raw) {
        var p = JSON.parse(raw), k;
        ["theme", "font", "motion", "density", "shape", "tagline", "bio"].forEach(function (kk) {
          if (p[kk] !== undefined) c[kk] = p[kk];
        });
        for (k in def) c.sections[k] = !(p.sections && p.sections[k] === false);
      }
    } catch (e) { /* storage unavailable — use defaults */ }
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
      if (/FlateDecode/.test(dict)) jobs.push({ data: data, flate: true });
      else if (!/Filter/.test(dict)) jobs.push({ data: data, flate: false });
      /* other filters (LZW, DCT, \u2026) are skipped \u2014 usually images */
    }
    if (!jobs.length) { var e0 = new Error("no readable content streams"); e0.code = "unparsable"; throw e0; }
    var ps = jobs.map(function (j) {
      if (j.flate) {
        return inflateAsync(j.data, "deflate").then(function (ab) {
          return new TextDecoder("latin1").decode(ab);
        }).catch(function () { return ""; });
      }
      return Promise.resolve(new TextDecoder("latin1").decode(j.data));
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
    var norm = line.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    if (!norm || norm.length > 48) return null;
    for (var k in SECTION_KEYS) {
      var arr = SECTION_KEYS[k];
      for (var i = 0; i < arr.length; i++) {
        if (norm === arr[i]) return k;
      }
    }
    return null;
  }
  function isBullet(l) { return /^[\u2022\-\*\u2013\u2014\u25aa\u25e6\u2023\u00b7]\s+/.test(l) || /^\d+[.)]\s+/.test(l); }
  function stripBullet(l) { return l.replace(/^[\u2022\-\*\u2013\u2014\u25aa\u25e6\u2023\u00b7]\s+/, "").replace(/^\d+[.)]\s+/, ""); }
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
    for (var loi = 0; loi < head.length; loi++) {
      if (/@/.test(head[loi])) continue;
      var lm = head[loi].match(/([A-Z][A-Za-z'.\-]*(?:\s+[A-Z][A-Za-z'.\-]*)?),\s*([A-Z][A-Za-z'.\-]*(?:\s+[A-Z][A-Za-z'.\-]*)?)/);
      if (lm) { r.location = lm[1] + ", " + lm[2]; break; }
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
        if (!pc) pc = newProj();
        if (pc.bullets.length < 4) pc.bullets.push(stripBullet(l));
        return;
      }
      var hasBody = pc && (pc.description || pc.bullets.length || pc.tech.length);
      var dm = l.match(/\s+[\u2013\u2014]\s+|\s*:\s*/), nm = l, desc = "";
      if (dm) { nm = l.slice(0, dm.index).trim(); desc = l.slice(dm.index + dm[0].length).trim(); }
      if (!pc || hasBody) {
        pushProj(); pc = newProj(); pc.name = nm; pc.description = desc;
      } else if (!pc.name) {
        pc.name = nm; pc.description = desc;
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
      var cm = core.match(/^[A-Za-z &\/+]+\s*:\s*(.+)$/);
      if (cm) core = cm[1];
      core.split(/[,|\u2022\u00b7\/;]/).forEach(function (x) {
        var s = x.trim().replace(/[.]+$/, "");
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
    if (name === "generator") syncTabs();
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

  /* ═══════════════ resume mode: labels, render, photo, tabs, file flow ═══════════════ */

  /* per-mode section eyebrows + titles (badges renumbered later by renumberSections) */
  function setSectionLabels(m) {
    var L = m === "resume" ? {
      about: ["About", "About Me"],
      work: ["Selected Projects", 'Selected Projects <span class="section-note">— hand-picked highlights</span>'],
      activity: ["Experience", 'Experience <span class="section-note">— where I\'ve worked</span>'],
      stack: ["Skills", 'Skills <span class="section-note">— the toolbox</span>'],
      journey: ["Career Journey", "Career Journey"]
    } : {
      about: ["About", "The Developer"],
      work: ["Selected Work", 'Selected Work <span class="section-note">— top repositories, ranked by stars</span>'],
      activity: ["Activity", 'Recent Activity <span class="section-note">— public events</span>'],
      stack: ["Toolbox", 'Tech Stack <span class="section-note">— languages by repository</span>'],
      journey: ["Journey", "The Journey"]
    };
    ["about", "work", "activity", "stack", "journey"].forEach(function (k) {
      var eb = $("eyebrow-" + k), tt = $("title-" + k);
      if (eb) eb.innerHTML = '<span class="sec-num"></span> / ' + esc(L[k][0]);
      if (tt) tt.innerHTML = L[k][1];
    });
  }

  /* render a parsed resume into the shared portfolio DOM */
  function renderResumePortfolio(r) {
    setSectionLabels("resume");
    downloadSlug = slugify((r.name || "resume").replace(/\.(pdf|docx|txt|md|markdown)$/i, ""));
    currentAvatarUrl = "";
    currentResumeName = r.name || "";

    /* hero */
    $("pf-name").textContent = r.name || "Your Name";
    var heroTag = $("pf-tagline");
    heroTag.textContent = r.headline || "Portfolio";
    heroTag.dataset.base = heroTag.textContent;
    var loc = $("pf-location");
    if (r.location) { loc.textContent = r.location; loc.style.display = ""; }
    else loc.style.display = "none";
    var primary = r.links.linkedin || r.links.github || r.links.website;
    var pfg = $("pf-github");
    if (primary) {
      pfg.textContent = primary.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
      pfg.href = primary;
      pfg.style.display = "";
    } else {
      pfg.style.display = "none";
    }
    $("pf-meta-sep").style.display = (r.location && primary) ? "" : "none";

    /* about */
    var aboutBio = $("about-bio");
    aboutBio.classList.add("dropcap");
    aboutBio.textContent = r.summary ||
      "No summary found in this resume — add a professional summary section to make this space shine.";
    aboutBio.dataset.base = aboutBio.textContent;
    var metaBits = [];
    if (r.email) metaBits.push('<a href="mailto:' + esc(r.email) + '">' + esc(r.email) + "</a>");
    if (r.phone) metaBits.push(esc(r.phone));
    if (r.location) metaBits.push(esc(r.location));
    if (r.links.linkedin) metaBits.push('<a href="' + esc(r.links.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a>');
    $("about-meta").innerHTML = metaBits.join(" &nbsp;·&nbsp; ");

    /* stats */
    $("st-repos").textContent = r.yearsExperience > 0 ? String(r.yearsExperience) : "—";
    $("st-followers").textContent = r.experience.length ? String(r.experience.length) : "—";
    $("st-stars").textContent = r.projects.length ? String(r.projects.length) : "—";
    $("st-forks").textContent = r.skills.length ? String(r.skills.length) : "—";
    $("sl-repos").textContent = "Years experience";
    $("sl-followers").textContent = "Roles";
    $("sl-stars").textContent = "Projects";
    $("sl-forks").textContent = "Skills";
    $("st-years").parentNode.hidden = true;
    $("sec-stack").style.display = "";

    /* projects → sec-work (fallback: experience highlights) */
    var grid = $("work-grid");
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
      projs.forEach(function (p, i) {
        var card = document.createElement("article");
        card.className = "work-card reveal";
        var num = ("0" + (i + 1)).slice(-2);
        var kicker = "";
        (p.tech || []).slice(0, 6).forEach(function (t) {
          kicker += '<span class="topic-tag">' + esc(t) + "</span>";
        });
        card.innerHTML =
          '<div class="work-index">' + num + "</div>" +
          '<div class="work-body">' +
          (kicker ? '<div class="work-kicker">' + kicker + "</div>" : "") +
          '<h3 class="work-name">' + esc(p.name || "Untitled") + "</h3>" +
          (p.description ? '<p class="work-desc">' + esc(p.description) + "</p>" : "") +
          '<div class="glare" aria-hidden="true"></div>' +
          "</div>";
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
    var numerals = ["01", "02", "03", "04"];
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
          (latest.dates ? " — " + esc(latest.dates) : "") + "." });
    }
    items.push({ title: r.yearsExperience + (r.yearsExperience === 1 ? " year" : " years") + " of experience",
      detail: "Across " + r.experience.length + " role" + (r.experience.length === 1 ? "" : "s") +
        (r.education.length ? " · educated at " + esc(r.education[0].school || r.education[0].degree) : "") + "." });
    items.push({ title: r.projects.length + (r.projects.length === 1 ? " project" : " projects"),
      detail: r.projects.length ? "Selected highlights above — the archive keeps growing."
                                : "No projects listed yet — the story is still being written." });
    items.forEach(function (it, i) {
      var li = document.createElement("li");
      li.innerHTML = '<span class="j-num">' + numerals[i] + '</span><div><p class="j-title">' +
        esc(it.title) + '</p><p class="j-detail">' + it.detail + "</p></div>";
      list.appendChild(li);
    });

    /* contact */
    var box = $("contact-links");
    box.innerHTML = "";
    var actions = document.createElement("div");
    actions.className = "contact-actions";
    var btns = "";
    if (r.email) btns += '<a class="btn-gold" href="mailto:' + esc(r.email) + '">Email me <span aria-hidden="true">↗</span></a>';
    if (r.phone) btns += ' <a class="btn-ghost" href="tel:' + esc(r.phone.replace(/[^+\d]/g, "")) + '">' + esc(r.phone) + "</a>";
    if (r.links.website) {
      var wlabel = r.links.website.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
      btns += ' <a class="btn-ghost" href="' + esc(r.links.website) + '" target="_blank" rel="noopener">' +
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

    $("footer-note").innerHTML = 'Forged with <span class="brand-mark">◆</span> <strong>PortfolioForge</strong> — from a resume, parsed 100% in your browser.';

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
  function applyShape() {
    views.portfolio.setAttribute("data-shape", cust.shape === "rounded" ? "rounded" : "circle");
    var nodes = document.querySelectorAll("#shape-options button");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].classList.toggle("active", nodes[i].getAttribute("data-shape") === cust.shape);
    }
  }
  function validatePhotoFile(f) {
    if (!f) return "No file selected.";
    var isImg = (f.type || "").indexOf("image/") === 0 ||
      /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name || "");
    if (!isImg) return "That doesn't look like an image — please choose a JPG, PNG or WebP file.";
    if (f.size > 12 * 1024 * 1024) return "That image is over 12 MB — please pick a smaller one.";
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
          if (e || !url) { photoHint("Couldn't read that image — try a different file.", true); return; }
          setPhotoDataURL(url);
          photoHint("Looking sharp. ✦", false);
        });
      };
      img.onerror = function () { photoHint("Couldn't read that image — try a different file.", true); };
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
    $("resume-filename").textContent = (f.name || "file") + " — reading…";
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
        msg += "No readable text was found — try a DOCX or TXT version.";
      } else if (err && err.message === "timeout") {
        msg = "Reading is taking too long — your file may be very large. Try a smaller file, or a DOCX/TXT version of your resume.";
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
        renderResumePortfolio(parseResumeText(text));
        show("portfolio");
      } catch (err) {
        show("generator");
        resumeError("Couldn't make sense of that resume — the text may be unusually formatted. Try a cleaner DOCX or TXT version.");
      }
    }, 60);
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
    applyShape();
    buildSectionToggles();
    syncPanel();
    renumberSections();
    initMotion();
  }

  /* renumber visible section badges sequentially (01, 02, 03…) — no gaps after toggles */
  function renumberSections() {
    var n = 0;
    SECTION_ORDER.forEach(function (id) {
      var el = $(id);
      if (!el || el.hidden || el.style.display === "none") return;
      n++;
      var badge = el.querySelector(".sec-num");
      if (badge) badge.textContent = ("0" + n).slice(-2);
    });
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

    /* avatar shape */
    var shapeBtns = document.querySelectorAll("#shape-options button");
    for (var si = 0; si < shapeBtns.length; si++) {
      (function (b) {
        b.addEventListener("click", function () {
          cust.shape = b.getAttribute("data-shape");
          saveCust();
          applyCustomize();
        });
      })(shapeBtns[si]);
    }

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

    /* resume-mode chrome reset */
    setSectionLabels("github");
    downloadSlug = slugify(user.login);
    currentAvatarUrl = user.avatar_url + "&s=336";
    currentResumeName = "";
    $("sl-repos").textContent = "Public repos";
    $("sl-followers").textContent = "Followers";
    $("sl-stars").textContent = "Total stars";
    $("sl-forks").textContent = "Total forks";
    $("sl-years").textContent = "Years on GitHub";
    $("st-years").parentNode.hidden = false;
    $("skill-groups").hidden = true;
    $("lang-bar").hidden = false;
    $("lang-legend").hidden = false;
    var pfg0 = $("pf-github");
    pfg0.style.display = "";
    $("footer-note").innerHTML = 'Forged with <span class="brand-mark">◆</span> <strong>PortfolioForge</strong> — from public GitHub data.';

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

    /* resume-mode + photo additions */
    var avatarRadius = cust.shape === "rounded" ? "30px" : "50%";
    R.push(".avatar{border-radius:" + avatarRadius + "}");
    R.push(".monogram{width:168px;height:168px;border-radius:" + avatarRadius + ";display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:3.2rem;font-weight:600;color:var(--accent-2);background:var(--bg-2);border:1px solid var(--accent-dim);flex-shrink:0;box-shadow:0 0 0 1px " + rgba(v.rgb, 0.12) + ",0 18px 50px rgba(0,0,0,.5)}");
    R.push(".skill-groups{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;max-width:920px}");
    R.push(".skill-group{border:1px solid var(--line);border-radius:16px;padding:26px 28px;background:var(--surface)}");
    R.push(".skill-group-title{font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--accent);margin-bottom:18px;font-family:var(--font-body);font-weight:500}");
    R.push(".skill-chips{display:flex;flex-wrap:wrap;gap:10px}");
    R.push(".skill-chip{font-size:13px;color:var(--ink);border:1px solid var(--line);border-radius:999px;padding:8px 16px;background:var(--bg-2);font-family:var(--font-body)}");
    R.push(".exp-bullets{margin:10px 0 0;padding-left:20px;color:var(--muted);font-size:14px;line-height:1.7;max-width:720px;font-family:var(--font-body)}");
    R.push(".exp-bullets li{margin-bottom:6px}");
    R.push(".t-text strong{font-weight:500;color:var(--ink)}");
    R.push(".t-text .t-co{color:var(--accent-2)}");
    R.push("@media(max-width:640px){.skill-groups{grid-template-columns:1fr}}");

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
    link.download = (downloadSlug || "portfolio") + "-portfolio.html";
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

  $("customize-btn").addEventListener("click", openDrawer);
  $("drawer-close").addEventListener("click", closeDrawer);
  $("drawer-scrim").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawerOpen()) closeDrawer();
  });

  /* init */
  buildPanel();
  applyCustomize();

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
      renumberSections: renumberSections, setSectionLabels: setSectionLabels,
      SAMPLE_RESUME: SAMPLE_RESUME,
      getMode: function () { return mode; },
      getCust: function () { return cust; },
      getPhoto: function () { return customPhoto; }
    };
  }
})();

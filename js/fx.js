/* ═══════════════════════════════════════════════════════════════
   PortfolioForge FX layer — GSAP choreography + Lenis smooth scroll +
   Vanta WebGL atmosphere.
   Every feature is optional: each no-ops when its library failed to load,
   when the user disabled motion, or under prefers-reduced-motion.
   Loaded AFTER the vendor libs, BEFORE app.js.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var FINE = !!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  var SMALL = !!(window.matchMedia && window.matchMedia("(max-width: 640px)").matches);
  var motionAllowed = true; /* app.js mirrors cust.motion via syncMotion() */

  function motionOK() { return motionAllowed && !REDUCED; }

  /* ── per-theme WebGL atmosphere ──
     Dark themes get a living netfield / wavefield in the theme's accent.
     Light themes stay clean paper — restraint over decoration. */
  var FX = {
    blueprint:  { fx: "NET",   color: 0xFFC53D, bg: 0x123A68 },
    nightshift: { fx: "NET",   color: 0xE86A1F, bg: 0x171512 },
    signal:     { fx: "WAVES", color: 0x2A1106, bg: 0xC2430F },
    brass:      { fx: "NET",   color: 0xD9A62E, bg: 0x191206 },
    carbon:     { fx: "NET",   color: 0xA8D61C, bg: 0x101113 }
  };
  var current = null;

  function destroyAtmosphere() {
    if (current) {
      try { current.inst.destroy(); } catch (e) { /* already gone */ }
      if (current.el && current.el.parentNode) current.el.parentNode.removeChild(current.el);
      current = null;
    }
  }

  function atmosphere(viewEl, themeKey) {
    destroyAtmosphere();
    if (!viewEl || !motionOK()) return;
    var cfg = FX[themeKey];
    if (!cfg || !window.VANTA || !window.VANTA[cfg.fx] || !window.THREE) return;
    var cv = document.createElement("div");
    cv.className = "pf-fx";
    cv.setAttribute("aria-hidden", "true");
    viewEl.insertBefore(cv, viewEl.firstChild);
    var opts = {
      el: cv,
      mouseControls: FINE, touchControls: false, gyroControls: false,
      color: cfg.color, backgroundColor: cfg.bg,
      minHeight: 200, minWidth: 200, scale: 1.0, scaleMobile: 1.0
    };
    if (cfg.fx === "NET") {
      opts.points = SMALL ? 6 : 11;
      opts.maxDistance = 24;
      opts.spacing = 20;
      opts.showDots = true;
    } else {
      opts.waveHeight = 10;
      opts.waveSpeed = 0.5;
      opts.zoom = 1.05;
      opts.shininess = 28;
    }
    try {
      current = { el: cv, inst: window.VANTA[cfg.fx](opts) };
    } catch (e) { destroyAtmosphere(); }
  }

  /* ── Lenis buttery scroll ── */
  var lenis = null;
  function initLenis() {
    if (lenis || !window.Lenis || !motionOK()) return;
    try {
      lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    } catch (e) { lenis = null; }
  }
  function killLenis() {
    if (lenis) { try { lenis.destroy(); } catch (e) {} lenis = null; }
  }

  function scrollToEl(t) {
    if (!t) return;
    if (lenis) { try { lenis.scrollTo(t, { offset: -84, duration: 1.2 }); return; } catch (e) {} }
    if (t.scrollIntoView) t.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
  }

  /* smooth in-page anchors (mini-nav section links, footer links) */
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    if (!id) return;
    var t = document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    scrollToEl(t);
  });

  /* ── GSAP: hero entrance choreography ── */
  function heroIntro(scope) {
    if (!window.gsap || !motionOK() || !scope) return;
    var items = scope.querySelectorAll("[data-intro]");
    if (!items.length) return;
    window.gsap.set(items, { y: 28, opacity: 0 });
    window.gsap.to(items, {
      y: 0, opacity: 1, duration: 0.9, stagger: 0.09,
      ease: "power3.out", overwrite: true, clearProps: "transform"
    });
  }

  /* ── GSAP: magnetic pull on primary CTAs (fine pointers only) ── */
  function magnetic(scope) {
    if (!window.gsap || !motionOK() || !FINE || !scope) return;
    var els = scope.querySelectorAll("[data-magnetic]");
    for (var i = 0; i < els.length; i++) (function (el) {
      if (el._pfMag) return; el._pfMag = true;
      var xTo = window.gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
      var yTo = window.gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.16);
        yTo((e.clientY - r.top - r.height / 2) * 0.26);
      });
      el.addEventListener("mouseleave", function () { xTo(0); yTo(0); });
    })(els[i]);
  }

  /* ── GSAP: stat count-up ──
     app.js stamps raw values into .stat-num[data-count]; we tween 0→n
     and re-apply the same compact formatting (fmtNum clone). */
  function fmtCompact(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  }
  function countUp(scope) {
    if (!window.gsap || !motionOK() || !scope) return;
    var nums = scope.querySelectorAll(".stat-num[data-count]");
    for (var i = 0; i < nums.length; i++) (function (el) {
      var raw = parseFloat(el.getAttribute("data-count"));
      if (isNaN(raw) || raw <= 0) return;
      var o = { v: 0 };
      window.gsap.to(o, {
        v: raw, duration: 1.4, ease: "power2.out", delay: 0.25 + (i % 5) * 0.08,
        onUpdate: function () { el.textContent = fmtCompact(Math.round(o.v)); },
        onComplete: function () { el.textContent = fmtCompact(raw); }
      });
    })(nums[i]);
  }

  /* ── public API for app.js / view.js ── */
  window.PFFX = {
    /* mirror of the motion toggle; (re)builds scroll + atmosphere */
    syncMotion: function (on) {
      motionAllowed = !!on;
      if (motionOK()) { initLenis(); }
      else { killLenis(); destroyAtmosphere(); }
    },
    atmosphere: atmosphere,
    destroyAtmosphere: destroyAtmosphere,
    heroIntro: heroIntro,
    magnetic: magnetic,
    countUp: countUp,
    scrollToEl: scrollToEl,
    scrollTop: function () {
      if (lenis) { try { lenis.scrollTo(0, { immediate: true }); return; } catch (e) {} }
      window.scrollTo(0, 0);
    },
    get reduced() { return REDUCED; }
  };

  /* boot: smooth scroll unless the OS asked for reduced motion */
  if (!REDUCED) initLenis();
})();

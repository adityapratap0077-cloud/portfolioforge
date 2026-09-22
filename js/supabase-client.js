/* PortfolioForge — optional Supabase backend.
 * Loads the Supabase JS client from CDN only when configured, so the
 * generator works fully offline / without any backend set up.
 * Exposes window.PFSB = { configured(), ensure() -> Promise<client|null> }.
 */
(function () {
  "use strict";

  var CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  var client = null;
  var loadPromise = null;

  function configured() {
    var url = window.PF_SUPABASE_URL || "";
    var key = window.PF_SUPABASE_ANON_KEY || "";
    return url.indexOf("https://") === 0 && key.length > 20;
  }

  function loadLib() {
    if (loadPromise) return loadPromise;
    loadPromise = new Promise(function (resolve, reject) {
      if (window.supabase && typeof window.supabase.createClient === "function") {
        resolve();
        return;
      }
      var s = document.createElement("script");
      s.src = CDN;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("Could not load the Supabase library (check your connection).")); };
      document.head.appendChild(s);
    });
    return loadPromise;
  }

  /* Resolves to a Supabase client, or null when the backend isn't configured. */
  function ensure() {
    if (client) return Promise.resolve(client);
    if (!configured()) return Promise.resolve(null);
    return loadLib().then(function () {
      client = window.supabase.createClient(window.PF_SUPABASE_URL, window.PF_SUPABASE_ANON_KEY);
      return client;
    });
  }

  window.PFSB = { configured: configured, ensure: ensure };
})();

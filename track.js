// Shared event tracking for Umami. Loaded on every public page, right after
// the Umami script itself.
//
// Pageviews are recorded by Umami automatically. This file adds the custom
// events that Umami cannot infer on its own:
//
//   disconnect-cta-click   any click on a link to /find-your-disconnect
//   fit-cta-click          any click on a link to /fit-assessment
//
// The two quiz pages fire their own step events (disconnect-q1 ... and
// fit-q1 ...) through window.scholaTrack, which is defined here.
//
// Safe by design: if the Umami script is blocked (ad blocker, offline, slow
// load), track() does nothing and never throws, so no page behaviour depends
// on tracking working.
(function () {
  "use strict";

  function track(name, data) {
    try {
      if (window.umami && typeof window.umami.track === "function") {
        window.umami.track(name, data || {});
      }
    } catch (err) {
      /* tracking must never break the page */
    }
  }
  window.scholaTrack = track;

  // Where on the page the clicked link sits, as a short label.
  function whereIs(a) {
    if (a.classList.contains("masthead__cta")) return "nav";
    if (a.closest("#menu")) return "mobile-menu";
    if (a.classList.contains("hero__cta") || a.classList.contains("hero__secondary-link")) return "hero";
    if (a.closest(".reality__cta")) return "reality-section";
    if (a.id) return a.id; // e.g. t2Cta, t3Cta on the quiz results
    if (a.closest("footer")) return "footer";
    return "page-body";
  }

  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;

    var href = a.getAttribute("href") || "";
    var path = href.split("#")[0].split("?")[0];
    var name = null;
    if (path === "/find-your-disconnect") name = "disconnect-cta-click";
    else if (path === "/fit-assessment") name = "fit-cta-click";
    if (!name) return;

    var data = { location: whereIs(a), page: window.location.pathname };

    // The quiz result buttons carry the verdict tier in their URL.
    var q = href.indexOf("?");
    if (q !== -1) {
      var tier = new URLSearchParams(href.slice(q + 1)).get("tier");
      if (tier) data.tier = tier;
    }
    track(name, data);
  });
})();

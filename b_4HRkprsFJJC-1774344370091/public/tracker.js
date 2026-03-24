/**
 * Drop-off IQ — Client-side Tracking SDK
 * Embeddable via: <script src="/tracker.js" data-api-key="YOUR_KEY"></script>
 * Or via: import { tracker } from '/tracker.js'
 */
(function (window) {
  "use strict";

  // ── Config ──────────────────────────────────────────────────────────────────
  const script = document.currentScript;
  const API_KEY = (script && script.getAttribute("data-api-key")) || "";
  const ENDPOINT =
    (script && script.getAttribute("data-endpoint")) || "/api/track";

  // ── Session / User identity ─────────────────────────────────────────────────
  function getOrCreate(key, factory) {
    try {
      let val = localStorage.getItem(key);
      if (!val) {
        val = factory();
        localStorage.setItem(key, val);
      }
      return val;
    } catch (_) {
      return factory();
    }
  }

  function uid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  const sessionId = getOrCreate("_diq_session", uid);
  const userId = getOrCreate("_diq_user", uid);

  // ── Core send ───────────────────────────────────────────────────────────────
  function send(eventName, properties) {
    const payload = {
      event: eventName,
      session_id: sessionId,
      user_id: userId,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      properties: Object.assign(
        {
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          screen: window.screen.width + "x" + window.screen.height,
        },
        properties || {}
      ),
    };

    // Use sendBeacon when available (non-blocking, survives page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      navigator.sendBeacon(ENDPOINT, blob);
    } else {
      fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () {
        // Silently fail — tracking must never break the host app
      });
    }
  }

  // ── Auto page-view tracking ─────────────────────────────────────────────────
  function trackPageView() {
    send("page_view", {
      title: document.title,
      path: window.location.pathname,
    });
  }

  // Track initial load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", trackPageView);
  } else {
    trackPageView();
  }

  // Track SPA navigation (history API)
  (function () {
    const _pushState = history.pushState;
    const _replaceState = history.replaceState;

    history.pushState = function () {
      _pushState.apply(history, arguments);
      trackPageView();
    };
    history.replaceState = function () {
      _replaceState.apply(history, arguments);
      trackPageView();
    };
    window.addEventListener("popstate", trackPageView);
  })();

  // ── Public API ──────────────────────────────────────────────────────────────
  var tracker = {
    /**
     * Track a custom event.
     * @param {string} eventName  e.g. "signup_click", "form_submit"
     * @param {object} [props]    Optional key-value metadata
     */
    track: function (eventName, props) {
      send(eventName, props);
    },

    /**
     * Identify the current user.
     * Persists userId to localStorage and attaches it to future events.
     * @param {string} id
     */
    identify: function (id) {
      try {
        localStorage.setItem("_diq_user", id);
      } catch (_) {}
    },

    /**
     * Reset session and user identity (e.g. on logout).
     */
    reset: function () {
      try {
        localStorage.removeItem("_diq_session");
        localStorage.removeItem("_diq_user");
      } catch (_) {}
    },

    /** Current session ID */
    sessionId: sessionId,
    /** Current user ID */
    userId: userId,
  };

  // Expose globally
  window.DropOffIQ = tracker;

  // CommonJS / ESM compat
  if (typeof module !== "undefined" && module.exports) {
    module.exports = tracker;
  }
})(window);

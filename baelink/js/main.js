/* BaeLink — interactions
   scroll reveals · draggable screenshot rail · download micro-interaction */
(function () {
  "use strict";

  var docEl = document.documentElement;

  /* Preview/capture mode: ?noanim reveals everything immediately */
  if (window.location.search.indexOf("noanim") !== -1) {
    window.addEventListener("DOMContentLoaded", function () {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealed = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window) {
    docEl.classList.remove("js-off");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    docEl.classList.add("no-observer");
  }

  /* ---------- Screenshot rail: drag-to-scroll + progress ---------- */
  var rail = document.getElementById("screens-rail");
  var bar = document.getElementById("screens-bar");
  if (rail) {
    var isDown = false, startX = 0, startScroll = 0, moved = 0;

    function syncProgress() {
      if (!bar) return;
      var max = rail.scrollWidth - rail.clientWidth;
      var frac = max > 0 ? rail.scrollLeft / max : 0;
      var visible = rail.clientWidth / rail.scrollWidth;
      bar.style.width = (visible * 100).toFixed(2) + "%";
      bar.style.transform = "translateX(" + (frac * (100 / visible - 100)).toFixed(2) + "%)";
    }

    rail.addEventListener("scroll", syncProgress, { passive: true });
    window.addEventListener("resize", syncProgress);
    syncProgress();

    // Pointer drag (mouse); touch uses native scrolling
    rail.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      isDown = true;
      moved = 0;
      startX = e.clientX;
      startScroll = rail.scrollLeft;
      rail.setPointerCapture(e.pointerId);
    });
    rail.addEventListener("pointermove", function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 6) rail.classList.add("is-dragging");
      rail.scrollLeft = startScroll - dx;
    });
    ["pointerup", "pointercancel"].forEach(function (type) {
      rail.addEventListener(type, function () {
        isDown = false;
        // let click-suppression linger a tick so links don't fire after a drag
        setTimeout(function () { rail.classList.remove("is-dragging"); }, 60);
      });
    });

    // Keyboard support when the rail is focused
    rail.addEventListener("keydown", function (e) {
      var step = rail.clientWidth * 0.6;
      if (e.key === "ArrowRight") { rail.scrollBy({ left: step, behavior: "smooth" }); e.preventDefault(); }
      if (e.key === "ArrowLeft") { rail.scrollBy({ left: -step, behavior: "smooth" }); e.preventDefault(); }
    });
  }

  /* ---------- Download pill micro-interaction ---------- */
  var btn = document.getElementById("download-btn");
  var toast = document.getElementById("toast");
  var toastTimer = null;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }

  if (btn) {
    btn.addEventListener("click", function () {
      if (btn.classList.contains("is-loading") || btn.classList.contains("is-done")) return;
      btn.classList.add("is-loading");
      btn.setAttribute("aria-label", "Downloading BaeLink");
      setTimeout(function () {
        btn.classList.remove("is-loading");
        btn.classList.add("is-done");
        btn.setAttribute("aria-label", "BaeLink installed");
        showToast("✓ BaeLink installed — it starts with a swipe!");
        setTimeout(function () {
          btn.classList.remove("is-done");
          btn.removeAttribute("aria-label");
        }, 3200);
      }, 1400);
    });
  }
})();

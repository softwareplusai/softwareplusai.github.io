(function () {
  var root = document.documentElement;
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var layers = Array.prototype.slice.call(document.querySelectorAll("[data-depth]"));
  var header = document.querySelector(".site-header");
  var video = document.querySelector(".hero-video");

  root.classList.add("enhance");

  function reduced() {
    return motion.matches;
  }

  function measure() {
    layers.forEach(function (el) {
      el.style.transform = "none";
    });
    layers.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      el._top = rect.top + window.scrollY;
      el._h = el.offsetHeight;
    });
  }

  function render() {
    if (reduced()) {
      layers.forEach(function (el) {
        el.style.transform = "none";
      });
      return;
    }
    var mobile = window.innerWidth < 760;
    var gain = mobile ? 0.62 : 1;
    var viewMid = window.scrollY + window.innerHeight * 0.5;
    layers.forEach(function (el) {
      var depth = Number(el.dataset.depth) * gain;
      var cap = Number(el.dataset.cap || 64) * (mobile ? 0.55 : 1);
      var center = el._top + el._h / 2;
      var y = (viewMid - center) * depth;
      if (y > cap) y = cap;
      if (y < -cap) y = -cap;
      el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
    });
  }

  var ticking = false;
  function requestRender() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      render();
    });
  }

  function markToday() {
    try {
      var label = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Muscat",
        weekday: "short"
      }).format(new Date());
      var index = { Sun: "0", Mon: "1", Tue: "2", Wed: "3", Thu: "4", Fri: "5", Sat: "6" }[label];
      if (!index) return;
      document.querySelectorAll('[data-day="' + index + '"]').forEach(function (row) {
        row.classList.add("is-today");
      });
    } catch (err) {
      /* timezone data missing: leave the tables unmarked */
    }
  }

  function onHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  if (video) {
    video.addEventListener("playing", function () {
      video.classList.add("is-ready");
    });
  }

  measure();
  render();
  markToday();
  onHeader();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      measure();
      render();
    });
  }

  window.addEventListener("scroll", function () {
    onHeader();
    requestRender();
  }, { passive: true });

  window.addEventListener("resize", function () {
    measure();
    requestRender();
  });

  if (motion.addEventListener) {
    motion.addEventListener("change", function () {
      measure();
      render();
    });
  }
})();

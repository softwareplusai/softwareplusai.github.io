(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const header = document.querySelector("[data-header]");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 4, 3) * 80}ms`;
      io.observe(el);
    });
  } else {
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-in"));
  }

  initHeroCanvas(reduceMotion);
  initContactForm();
  initNav();
  initPreviews(reduceMotion);
  initPortfolioFrames();
})();

function initNav() {
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  if (!header || !nav || !toggle) return;

  const label = toggle.querySelector(".visually-hidden");
  const narrow = window.matchMedia("(max-width: 900px)");

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    header.classList.toggle("is-open", open);
    if (label) label.textContent = open ? "Close menu" : "Menu";
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!open);
    if (!open) {
      const first = nav.querySelector("a");
      if (first) first.focus();
    }
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  const barCta = header.querySelector(".nav-cta-bar");
  if (barCta) barCta.addEventListener("click", () => setOpen(false));

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true") return;
    setOpen(false);
    toggle.focus();
  });

  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });

  narrow.addEventListener("change", () => {
    if (!narrow.matches) setOpen(false);
  });
}

// Static site: the form hands the inquiry to the visitor's email or WhatsApp client.
function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const error = form.querySelector("[data-form-error]");
  const status = form.querySelector("[data-form-status]");
  const field = (name) => form.elements.namedItem(name);
  const required = ["name", "email", "message"].map(field);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  document.querySelectorAll("[data-package]").forEach((link) => {
    link.addEventListener("click", () => {
      const message = field("message");
      if (message && !message.value.trim()) {
        message.value = `I'm interested in the ${link.dataset.package} package.\n\n`;
      }
    });
  });

  const isValid = (input) => {
    const value = input.value.trim();
    return input.name === "email" ? emailPattern.test(value) : value.length > 0;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const invalid = required.filter((input) => !isValid(input));
    required.forEach((input) => input.setAttribute("aria-invalid", String(invalid.includes(input))));
    if (error) error.hidden = invalid.length === 0;
    if (status) status.hidden = true;
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    const value = (name) => field(name).value.trim();
    const subject = `New project: ${value("need")} — ${value("name")}`;
    const body = [
      `Name: ${value("name")}`,
      `Email: ${value("email")}`,
      `Company: ${value("company") || "—"}`,
      `Need: ${value("need")}`,
      `Budget: ${value("budget")}`,
      "",
      value("message"),
    ].join("\n");

    const viaWhatsApp = event.submitter && event.submitter.value === "whatsapp";
    if (status) {
      status.textContent = viaWhatsApp
        ? "WhatsApp is open. Send the message to reach us."
        : "The draft is open. Send it to reach us.";
      status.hidden = false;
    }

    if (viaWhatsApp) {
      // wa.me resets the connection on some networks. api.whatsapp.com is the
      // same click-to-chat page and stays reachable. A scripted new tab is
      // dropped on phones, so those navigate here and the page opens the app.
      const url = new URL("https://api.whatsapp.com/send");
      url.searchParams.set("phone", form.dataset.whatsapp);
      url.searchParams.set("text", `${subject}\n\n${body}`);
      if (prefersInstalledApp()) {
        window.location.href = url.toString();
        return;
      }
      openInNewTab(url.toString());
      return;
    }

    const mailto = new URL(`mailto:${form.dataset.email}`);
    mailto.searchParams.set("subject", subject);
    mailto.searchParams.set("body", body);

    // Phones have a mail app, and mailto opens it with this draft. A desktop
    // browser with no mail app ignores the same link, so those open Gmail.
    if (prefersInstalledApp()) {
      window.location.href = mailto.toString();
      return;
    }

    const gmail = new URL("https://mail.google.com/mail/");
    gmail.searchParams.set("view", "cm");
    gmail.searchParams.set("fs", "1");
    gmail.searchParams.set("to", form.dataset.email);
    gmail.searchParams.set("su", subject);
    gmail.searchParams.set("body", body);
    openInNewTab(gmail.toString());
  });
}

// iPadOS uses a desktop Mac user agent and only reveals itself through touch.
function prefersInstalledApp() {
  const ua = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return true;
  return navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua);
}

// A real link click opens a tab. window.open with a features string is a popup
// and browsers often block it, so the button appears to do nothing.
function openInNewTab(url) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function initHeroCanvas(reduceMotion) {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  // Opaque buffer — a transparent canvas shows the page behind it when the
  // browser restores the hero after it has been off-screen. desynchronized
  // is left off: that hint presents the bitmap out of step with scrolling,
  // so the hero graphic stays blank while scrolling up.
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const HERO_BG = "#f4f7fa";

  const state = {
    w: 0,
    h: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    mouse: { x: 0.62, y: 0.38, tx: 0.62, ty: 0.38 },
    t: 0,
    nodes: [],
    raf: 0,
    running: false,
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    state.w = Math.max(1, rect.width);
    state.h = Math.max(1, rect.height);
    canvas.width = Math.floor(state.w * state.dpr);
    canvas.height = Math.floor(state.h * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    seedNodes();
    // Setting canvas.width clears the bitmap — paint immediately.
    drawFrame(state.t);
  }

  function seedNodes() {
    const count = Math.round(Math.min(72, Math.max(36, (state.w * state.h) / 22000)));
    state.nodes = Array.from({ length: count }, (_, i) => {
      const ring = 0.18 + (i % 5) * 0.1;
      const angle = (i / count) * Math.PI * 2;
      return {
        a: angle,
        r: ring,
        speed: 0.08 + (i % 7) * 0.02,
        size: 1.2 + (i % 4) * 0.55,
        phase: Math.random() * Math.PI * 2,
      };
    });
  }

  function focalPoint() {
    // On a phone the wordmark stacks and the tagline runs under the desktop
    // focal point. Keep the ornament in the right-hand margin.
    if (state.w < 720) return { x: state.w * 0.9, y: state.h * 0.36 };
    return { x: state.w * 0.62, y: state.h * 0.4 };
  }

  function project(node, t) {
    const focal = focalPoint();
    const cx = focal.x + (state.mouse.x - 0.5) * 40;
    const cy = focal.y + (state.mouse.y - 0.5) * 30;
    const radius = Math.min(state.w, state.h) * node.r;
    const a = node.a + t * node.speed * 0.15;
    const wobble = Math.sin(t * 0.4 + node.phase) * 10;
    const x = cx + Math.cos(a) * (radius + wobble);
    const y = cy + Math.sin(a) * (radius * 0.62 + wobble * 0.4);
    return { x, y };
  }

  function drawFrame(t) {
    state.t = t;
    state.mouse.x += (state.mouse.tx - state.mouse.x) * 0.06;
    state.mouse.y += (state.mouse.ty - state.mouse.y) * 0.06;

    ctx.fillStyle = HERO_BG;
    ctx.fillRect(0, 0, state.w, state.h);

    const focal = focalPoint();
    const g = ctx.createRadialGradient(
      state.w * state.mouse.x,
      state.h * state.mouse.y,
      0,
      focal.x,
      focal.y,
      Math.max(state.w, state.h) * 0.7
    );
    g.addColorStop(0, "rgba(27, 163, 200, 0.2)");
    g.addColorStop(0.42, "rgba(18, 63, 106, 0.05)");
    g.addColorStop(1, HERO_BG);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.w, state.h);

    const cx = focal.x;
    const cy = focal.y;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const r = Math.min(state.w, state.h) * (0.18 + i * 0.1);
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.62, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(18, 63, 106, ${0.045 + i * 0.012})`;
      ctx.stroke();
    }

    if (state.w >= 720) {
      const span = Math.min(state.w, state.h);
      ctx.beginPath();
      ctx.moveTo(cx - span * 0.55, cy);
      ctx.lineTo(cx + span * 0.55, cy);
      ctx.moveTo(cx, cy - span * 0.38);
      ctx.lineTo(cx, cy + span * 0.38);
      ctx.strokeStyle = "rgba(27, 163, 200, 0.28)";
      ctx.stroke();
    }

    const pts = state.nodes.map((n) => project(n, t));

    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist > 130) continue;
        const alpha = (1 - dist / 130) * 0.22;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = `rgba(18, 63, 106, ${alpha})`;
        ctx.stroke();
      }
    }

    for (let i = 0; i < pts.length; i++) {
      const n = state.nodes[i];
      const p = pts[i];
      const pulse = 0.55 + Math.sin(t * 1.2 + n.phase) * 0.45;
      ctx.beginPath();
      ctx.arc(p.x, p.y, n.size * pulse, 0, Math.PI * 2);
      ctx.fillStyle = i % 5 === 0 ? "rgba(27, 163, 200, 0.95)" : "rgba(18, 63, 106, 0.55)";
      ctx.fill();
    }

    const plus = 18 + Math.sin(t * 0.8) * 2;
    ctx.strokeStyle = "rgba(27, 163, 200, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - plus, cy);
    ctx.lineTo(cx + plus, cy);
    ctx.moveTo(cx, cy - plus);
    ctx.lineTo(cx, cy + plus);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 28 + Math.sin(t * 0.9) * 3, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(27, 163, 200, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function loop(now) {
    if (!state.running) return;
    drawFrame(now * 0.001);
    state.raf = requestAnimationFrame(loop);
  }

  function start() {
    if (state.running || reduceMotion) return;
    state.running = true;
    state.raf = requestAnimationFrame(loop);
  }

  function stop() {
    state.running = false;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    drawFrame(state.t);
  }

  resize();
  let resizeRaf = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(resize);
  });

  const hero = canvas.parentElement;
  if (hero) {
    hero.addEventListener(
      "pointermove",
      (e) => {
        const rect = canvas.getBoundingClientRect();
        state.mouse.tx = (e.clientX - rect.left) / rect.width;
        state.mouse.ty = (e.clientY - rect.top) / rect.height;
      },
      { passive: true }
    );

    const heroIo = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible) {
          drawFrame(state.t);
          start();
        } else {
          stop();
        }
      },
      { rootMargin: "20% 0px", threshold: 0 }
    );
    heroIo.observe(hero);

    // rAF is deferred during a scroll, so a discarded canvas stays blank
    // until the gesture ends. Paint on the scroll event itself.
    let scrollPaint = false;
    window.addEventListener(
      "scroll",
      () => {
        if (scrollPaint || reduceMotion) return;
        const rect = hero.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
        scrollPaint = true;
        drawFrame(state.t);
        requestAnimationFrame(() => {
          scrollPaint = false;
        });
      },
      { passive: true }
    );
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else {
      drawFrame(state.t);
      start();
    }
  });

  if (reduceMotion) {
    drawFrame(0);
    return;
  }

  start();
}

function initPortfolioFrames() {
  const screens = [...document.querySelectorAll(".portfolio .screen")];
  const copies = [...document.querySelectorAll(".portfolio .piece-copy")];
  if (screens.length < 2) return;

  let frame = 0;

  // Each sample mock has a different intrinsic height. Measure the tallest
  // picture and text block, then give every sample that same frame.
  const equalize = () => {
    screens.forEach((screen) => {
      screen.style.minHeight = "0px";
    });
    copies.forEach((copy) => {
      copy.style.minHeight = "0px";
    });

    const screenHeight = Math.ceil(
      Math.max(...screens.map((screen) => screen.getBoundingClientRect().height))
    );
    const copyHeight = Math.ceil(
      Math.max(...copies.map((copy) => copy.getBoundingClientRect().height))
    );

    screens.forEach((screen) => {
      screen.style.minHeight = `${screenHeight}px`;
    });
    copies.forEach((copy) => {
      copy.style.minHeight = `${copyHeight}px`;
    });
  };

  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(equalize);
  };

  equalize();
  window.addEventListener("resize", schedule);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(schedule);
  }
}

function initPreviews(reduceMotion) {
  if (reduceMotion) return;

  document.querySelectorAll("[data-preview]").forEach((root) => {
    const beats = [...root.querySelectorAll("[data-beat]")];
    if (!beats.length) return;

    root.classList.add("is-playing");
    const cycle = beats.length + 3;
    let step = 0;
    let timer = 0;
    let onScreen = true;

    const render = () => {
      const blank = step === cycle - 1;
      const visibleUntil = blank ? -1 : Math.min(step, beats.length - 1);
      root.dataset.step = String(Math.max(visibleUntil, 0));
      root.classList.toggle("is-blank", blank);
      beats.forEach((beat, index) => {
        beat.classList.toggle("is-on", !blank && index <= visibleUntil);
      });
      step = (step + 1) % cycle;
    };

    const start = () => {
      if (timer) return;
      timer = window.setInterval(render, 1200);
    };

    const stop = () => {
      if (!timer) return;
      window.clearInterval(timer);
      timer = 0;
    };

    render();
    start();

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          onScreen = entry.isIntersecting;
          if (onScreen && !document.hidden) start();
          else stop();
        });
      });
      io.observe(root);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden || !onScreen) stop();
      else start();
    });
  });
}

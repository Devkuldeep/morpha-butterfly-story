/* MORPHA — GSAP scroll story: one AI video (chrysalis → emergence → flight → orchid) scrubbed hero → footer */
gsap.registerPlugin(ScrollTrigger);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const W = () => window.innerWidth;
const H = () => window.innerHeight;
const isMobile = () => window.matchMedia("(max-width: 960px)").matches;

/* ------------------------------------------------------------------ */
/* 1. Smooth scroll (Lenis) wired into ScrollTrigger                   */
/* ------------------------------------------------------------------ */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (window.Lenis && !reduceMotion) {
  const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length > 1 && $(id)) { e.preventDefault(); lenis.scrollTo($(id)); }
    })
  );
}

/* helpers ----------------------------------------------------------- */
function splitChars(el) {
  el.innerHTML = el.innerHTML
    .split(/(<br\s*\/?>)/)
    .map((part) => (part.startsWith("<br") ? part : [...part].map((c) => (c === " " ? " " : `<span class="ch">${c}</span>`)).join("")))
    .join("");
  return $$(".ch", el);
}

/* ------------------------------------------------------------------ */
/* 2. Scenes                                                           */
/* ------------------------------------------------------------------ */
const s1 = $(".s-hero"), s2 = $(".s-wing"), s3 = $(".s-wonder"), s4 = $(".s-garden");

/* ------------------------------------------------------------------ */
/* ONE story video for the whole page. Each section's (pinned) scroll  */
/* plays its own scene; the scroll between two sections plays the      */
/* transition the video already contains (green ↔ cream light shifts). */
/* Scene windows come from tools/build-story-video.sh.                 */
/* ------------------------------------------------------------------ */
const storyVideo = $(".story-video video");
//              hero        wing        wonder        garden
const STORY = [[0, 2.8], [4.8, 9.6], [11.4, 13.6], [14.4, 14.88]];
const FOCUS_X = [78, 72, 45, 28];   // phone: where each scene's subject sits (object-position %)

// Load the whole clip into memory first: a blob URL is seekable to any frame on any
// server (plain static servers without HTTP range support otherwise freeze on frame 1).
(async () => {
  const url = storyVideo.dataset.src;
  try {
    const blob = await (await fetch(url)).blob();
    storyVideo.src = URL.createObjectURL(blob);
  } catch {
    storyVideo.src = url;   // e.g. opened from file:// — fall back to streaming
  }
  storyVideo.pause();
})();
let knots = [];

function buildKnots() {
  knots = [$(".s-hero"), $(".s-wing"), $(".s-wonder"), $(".s-garden")].map((sec, i) => {
    const box = sec.parentElement.classList.contains("pin-spacer") ? sec.parentElement : sec;
    const start = box.getBoundingClientRect().top + window.scrollY;
    const end = Math.max(start, start + box.offsetHeight - window.innerHeight);
    return { start, end, t0: STORY[i][0], t1: STORY[i][1], x: FOCUS_X[i] };
  });
}
function storyAt(y) {
  const lerp = (a, b, p) => a + (b - a) * Math.min(1, Math.max(0, p));
  const k = knots;
  if (y <= k[0].start) return { t: k[0].t0, x: k[0].x };
  for (let i = 0; i < k.length; i++) {
    if (y <= k[i].end) return { t: lerp(k[i].t0, k[i].t1, (y - k[i].start) / (k[i].end - k[i].start || 1)), x: k[i].x };
    const n = k[i + 1];
    if (n && y < n.start) {                       // between sections → transition
      const p = (y - k[i].end) / (n.start - k[i].end);
      return { t: lerp(k[i].t1, n.t0, p), x: lerp(k[i].x, n.x, p) };
    }
  }
  return { t: k[k.length - 1].t1, x: k[k.length - 1].x };
}
let lastT = -1;
gsap.ticker.add(() => {
  if (!knots.length || !storyVideo.duration) return;
  const { t, x } = storyAt(window.scrollY);
  storyVideo.style.objectPosition = isMobile() ? `${x}% 50%` : "50% 50%";
  if (storyVideo.seeking || Math.abs(t - lastT) < 0.008) return;   // all-keyframe encode → cheap, smooth seeks
  storyVideo.currentTime = Math.min(storyVideo.duration - 0.04, t);
  lastT = t;
});

// calendars
(() => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let selected = null;
  const note = $(".booking-note");
  $$(".cal").forEach((cal) => {
    const d0 = new Date(today.getFullYear(), today.getMonth() + +cal.dataset.offset, 1);
    const name = d0.toLocaleString("en", { month: "long" });
    const days = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate();
    let html = `<h4>${+cal.dataset.offset === 0 ? "Open today" : name}</h4><div class="grid">`;
    html += ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => `<span class="dow">${d}</span>`).join("");
    html += "<span></span>".repeat(d0.getDay());
    for (let d = 1; d <= days; d++) {
      const date = new Date(d0.getFullYear(), d0.getMonth(), d);
      const past = date < today;
      const isToday = +date === +today;
      html += `<button ${past ? "disabled" : ""} class="${isToday ? "today sel" : ""}" data-date="${date.toDateString()}">${d}</button>`;
    }
    cal.innerHTML = html + "</div>";
  });
  selected = today.toDateString();
  $(".cal-wrap").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-date]");
    if (!b || b.disabled) return;
    $$(".cal button.sel").forEach((x) => x.classList.remove("sel"));
    b.classList.add("sel");
    selected = b.dataset.date;
    gsap.fromTo(b, { scale: 0.7 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
  });
  $(".btn-book").addEventListener("click", () => {
    const slot = $(".booking select");
    note.textContent = slot.selectedIndex === 0
      ? "Pick a time slot to continue."
      : `Booked · ${selected} · ${slot.value.split(" —")[0]}. See you among the wings.`;
    gsap.fromTo(note, { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 });
  });
})();

/* intro (on load) ---------------------------------------------------- */
const intro = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.4 } });
intro
  .from(".site-header > *", { y: -30, opacity: 0, stagger: 0.08, duration: 1 })
  .from(".story-video", { opacity: 0, scale: 1.06, duration: 2.2, ease: "power2.out" }, 0)
  .from(".s-hero .eyebrow", { y: 20, opacity: 0 }, 0.5)
  .from(".s-hero .line > span", { yPercent: 110, stagger: 0.12 }, 0.55)
  .from(".s-hero .reveal-up, .s-hero .dashes", { y: 24, opacity: 0, stagger: 0.1 }, 0.9)
  .from(".chat", { scale: 0, ease: "back.out(2)", duration: 0.8 }, 1.1);

/* scroll scenes ------------------------------------------------------ */
const mm = gsap.matchMedia();

mm.add({ motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
  const { reduce } = ctx.conditions;

  if (reduce) {
    // no pins; the story video still follows the reader's own scrolling
    return;
  }

  /* ---------- 01 · The art of becoming (pinned while the reveal scene plays) ---------- */
  gsap.timeline({ scrollTrigger: { trigger: s1, start: "top top", end: "+=130%", pin: true, scrub: true } })
    .to(".s-hero .hero-copy", { yPercent: -12, opacity: 0.65, duration: 1.4 }, 0);

  /* ---------- 02 · A world in every wing (pinned through emergence + take-off) ---------- */
  gsap.set(".s-wing .ghost .line > span", { yPercent: 110 });
  gsap.timeline({ scrollTrigger: { trigger: s2, start: "top top", end: "+=260%", pin: true, scrub: true } })
    // title echo rises as the wings spread open (≈ 7 s in the video, ~45 % through this scene)
    .to(".s-wing .ghost .line > span", { yPercent: 0, stagger: 0.15, duration: 0.9, ease: "power3.out" }, 3.3)
    .to(".s-wing .wing-copy", { yPercent: -6, duration: 7, ease: "none" }, 0);

  /* ---------- 03 · Follow the wonder: heading + gold lines over the orchid/water scene ---------- */
  const chars = splitChars($(".wonder-copy .display"));
  const drawPaths = $$(".gold-lines .draw");
  drawPaths.forEach((p) => { const L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }); });

  gsap.timeline({ scrollTrigger: { trigger: s3, start: "top top", end: "+=160%", pin: true, scrub: 1.1 } })
    .from(chars, { yPercent: 120, opacity: 0, rotate: 6, stagger: 0.04, duration: 0.6, ease: "power3.out" }, 0)
    .from(".s-wonder .eyebrow", { opacity: 0, y: 14, duration: 0.4 }, 0)
    .to(drawPaths, { strokeDashoffset: 0, duration: 2.2, stagger: 0.4, ease: "none" }, 0.3);

  /* ---------- 04 · Enter the garden (the card with the resting butterfly is in the story video) ---------- */
  const pin4 = !isMobile();
  const tl4 = gsap.timeline({
    scrollTrigger: pin4
      ? { trigger: s4, start: "top top", end: "+=130%", pin: true, scrub: 1.1 }
      : { trigger: s4, start: "top 75%", end: "center center", scrub: 1 },
  });
  const arc = $(".garden-arc .draw");
  const aL = arc.getTotalLength();
  gsap.set(arc, { strokeDasharray: aL, strokeDashoffset: aL });

  tl4
    .from(".g-title .line > span", { yPercent: 110, stagger: 0.12, duration: 0.8, ease: "power3.out" }, 0.2)
    .from(".booking", { y: 60, opacity: 0, duration: 0.8, ease: "power3.out" }, 0.4)
    .from(".cal button", { opacity: 0, scale: 0.5, stagger: { each: 0.006, from: "random" }, duration: 0.3 }, 0.6)
    .from(".watch, .vdots, .sparkle", { opacity: 0, y: 20, stagger: 0.08, duration: 0.5 }, 0.9)
    .to(arc, { strokeDashoffset: 0, duration: 1.6, ease: "none" }, 0.2);

  // sparkles twinkle
  gsap.to(".sparkle", { scale: 0.6, opacity: 0.35, rotate: 45, duration: 1.4, stagger: 0.5, yoyo: true, repeat: -1, ease: "sine.inOut" });

});

/* story-video scroll map: rebuilt whenever ScrollTrigger re-measures (pins, resize) */
ScrollTrigger.addEventListener("refresh", buildKnots);
buildKnots();

/* header colour follows the section under it (pin-spacer covers the pinned duration) */
$$("[data-theme].sec").forEach((sec) =>
  ScrollTrigger.create({
    trigger: sec.parentElement.classList.contains("pin-spacer") ? sec.parentElement : sec,
    start: "top 42px", end: "bottom 42px",
    onToggle: (self) => self.isActive && ($(".site-header").dataset.theme = sec.dataset.theme),
  })
);

window.addEventListener("load", () => ScrollTrigger.refresh());

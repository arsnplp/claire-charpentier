/* =========================================================
   Claire Charpentier · animations
   GSAP 3.13 + ScrollTrigger + SplitText + Lenis (fichiers locaux)
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const NS = "http://www.w3.org/2000/svg";
  let closeMenuIfOpen = () => {};

  $$(".year").forEach((el) => (el.textContent = new Date().getFullYear()));

  if (!window.gsap) { document.body.classList.remove("is-loading"); $(".loader")?.remove(); return; }
  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* ---------- Soleils art déco (rayons générés) ---------- */
  function buildRays(svg) {
    const n = parseInt(svg.dataset.rays || "31", 10);
    const cx = 200, cy = 210;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (i / (n - 1));
      const long = i % 2 === 0;
      const r1 = long ? 46 : 70;
      const r2 = long ? 200 : 168;
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", (cx - Math.cos(a) * r1).toFixed(2));
      l.setAttribute("y1", (cy - Math.sin(a) * r1).toFixed(2));
      l.setAttribute("x2", (cx - Math.cos(a) * r2).toFixed(2));
      l.setAttribute("y2", (cy - Math.sin(a) * r2).toFixed(2));
      l.setAttribute("pathLength", "1");
      svg.appendChild(l);
    }
    [30, 38].forEach((r) => {
      const arc = document.createElementNS(NS, "path");
      arc.setAttribute("d", `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`);
      arc.setAttribute("fill", "none");
      arc.setAttribute("pathLength", "1");
      arc.classList.add("ray-arc");
      svg.appendChild(arc);
    });
    // les arcs reprennent la couleur des rayons
    requestAnimationFrame(() => {
      const first = svg.querySelector("line");
      if (!first) return;
      const cs = getComputedStyle(first);
      svg.querySelectorAll(".ray-arc").forEach((a) => {
        a.setAttribute("stroke", cs.stroke);
        a.setAttribute("stroke-width", cs.strokeWidth);
        a.setAttribute("opacity", cs.opacity);
      });
    });
  }
  $$("svg[data-rays]").forEach(buildRays);

  // Tracés "dessinables"
  function prepDraw(els) {
    els.forEach((el) => {
      el.setAttribute("pathLength", "1");
      el.style.strokeDasharray = "1";
      el.style.strokeDashoffset = "1";
    });
    return els;
  }

  /* ---------- Mouvement réduit : version statique ---------- */
  if (reduce) {
    document.body.classList.remove("is-loading");
    $(".loader")?.remove();
    setupTabs(false);
    setupMenu(null);
    return;
  }

  /* ---------- Lenis (scroll fluide) ---------- */
  const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  window.__lenis = lenis;

  // Ancres
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      closeMenuIfOpen();
      lenis.start();
      lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    });
  });

  /* ---------- Curseur ---------- */
  const cursor = $(".cursor");
  const dot = $(".cursor-dot");
  if (finePointer && cursor) {
    const cx = gsap.quickTo(cursor, "x", { duration: 0.5, ease: "power3" });
    const cy = gsap.quickTo(cursor, "y", { duration: 0.5, ease: "power3" });
    const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
    gsap.set([cursor, dot], { x: innerWidth / 2, y: innerHeight / 2 });
    window.addEventListener("mousemove", (e) => { cx(e.clientX); cy(e.clientY); dx(e.clientX); dy(e.clientY); });
    document.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));
    document.addEventListener("mouseenter", () => cursor.classList.remove("is-hidden"));
    document.addEventListener("mouseover", (e) => {
      const view = e.target.closest("[data-cursor='view']");
      const link = e.target.closest("a, button, .tip, .soin");
      cursor.classList.toggle("is-view", !!view && !link?.matches("a, button"));
      cursor.classList.toggle("is-link", !view && !!link);
    });
  }

  /* ---------- Boutons magnétiques ---------- */
  if (finePointer) {
    $$(".magnetic, .magnetic-soft").forEach((el) => {
      const k = el.classList.contains("magnetic-soft") ? 0.12 : 0.35;
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * k);
        yTo((e.clientY - (r.top + r.height / 2)) * k);
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.35)" });
      });
    });
  }

  /* ---------- Header ---------- */
  const header = $(".header");
  const darkFlags = new Set();
  const setDark = (key, on) => { on ? darkFlags.add(key) : darkFlags.delete(key); header.classList.toggle("is-dark", darkFlags.size > 0); };
  let lastY = 0;
  lenis.on("scroll", ({ scroll }) => {
    header.classList.toggle("is-scrolled", scroll > 40);
    if (!document.body.classList.contains("menu-open")) {
      header.classList.toggle("is-hidden", scroll > lastY && scroll > 400);
    }
    lastY = scroll;
  });

  // Barre de progression
  gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  /* ---------- Menu ---------- */
  setupMenu(lenis);

  /* ---------- Préparation du hero (avant le loader) ---------- */
  const heroSplits = $$(".split-hero").map((el) => new SplitText(el, { type: "words,chars", charsClass: "char" }));
  const heroChars = heroSplits.flatMap((s) => s.chars);
  gsap.set(heroChars, { yPercent: 120, rotate: 6 });
  gsap.set(".hero__eyebrow, .hero__sub, .hero__ctas", { opacity: 0, y: 30 });
  gsap.set(".hero__eyebrow .eyebrow__line", { scaleX: 0 });
  gsap.set(".hero__arch", { clipPath: "inset(100% 0% 0% 0%)" });
  gsap.set(".hero__arch img", { scale: 1.4 });
  gsap.set(".hero__round, .badge", { scale: 0 });
  const heroRays = $$(".hero__sun line, .hero__sun path");
  gsap.set(heroRays, { strokeDasharray: 1, strokeDashoffset: 1 });
  const heroFrame = prepDraw($$(".hero__frame path"));
  gsap.set(".scroll-hint", { opacity: 0 });

  function heroIntro() {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(heroChars, { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.028 }, 0)
      .to(".hero__eyebrow", { opacity: 1, y: 0, duration: 1 }, 0.2)
      .to(".hero__eyebrow .eyebrow__line", { scaleX: 1, duration: 1.2 }, 0.3)
      .to(".hero__arch", { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut" }, 0)
      .to(".hero__arch img", { scale: 1, duration: 2.2 }, 0.2)
      .to(heroRays, { strokeDashoffset: 0, duration: 1.6, stagger: { each: 0.018, from: "center" }, ease: "power3.out" }, 0.4)
      .to(heroFrame, { strokeDashoffset: 0, duration: 2, ease: "power2.inOut" }, 0.5)
      .to(".hero__round", { scale: 1, duration: 1.2, stagger: 0.15, ease: "back.out(1.6)" }, 0.9)
      .to(".badge", { scale: 1, duration: 1.2, ease: "back.out(1.4)" }, 1.1)
      .to(".hero__sub, .hero__ctas", { opacity: 1, y: 0, duration: 1.1, stagger: 0.12 }, 0.8)
      .to(".scroll-hint", { opacity: 1, duration: 1 }, 1.4);
    return tl;
  }

  /* ---------- Loader ---------- */
  function runLoader() {
    return new Promise((resolve) => {
      const loader = $(".loader");
      if (!loader) return resolve();
      const rays = $$(".loader__sun line, .loader__sun path");
      gsap.set(rays, { strokeDasharray: 1, strokeDashoffset: 1 });
      const dia = prepDraw($$(".loader__diamond path"));
      const nameSplit = new SplitText(".loader__name", { type: "chars" });
      gsap.set(nameSplit.chars, { opacity: 0, y: 14 });
      gsap.set(".loader__mono span", { opacity: 0, scale: 0.8 });
      const counter = $(".loader__count span");
      const obj = { v: 0 };
      const ready = Promise.race([
        Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", r, { once: true })))]),
        new Promise((r) => setTimeout(r, 3500)),
      ]);
      const tl = gsap.timeline();
      tl.to(rays, { strokeDashoffset: 0, duration: 1.3, stagger: { each: 0.02, from: "center" }, ease: "power3.out" }, 0)
        .to(dia, { strokeDashoffset: 0, duration: 1.2, stagger: 0.15, ease: "power2.inOut" }, 0.1)
        .to(".loader__mono span", { opacity: 1, scale: 1, duration: 0.9, ease: "expo.out" }, 0.6)
        .to(nameSplit.chars, { opacity: 1, y: 0, duration: 0.8, stagger: 0.03, ease: "expo.out" }, 0.5)
        .to(obj, { v: 100, duration: 1.8, ease: "power2.inOut", onUpdate: () => (counter.textContent = String(Math.round(obj.v)).padStart(2, "0")) }, 0);
      Promise.all([tl, ready]).then(() => {
        const out = gsap.timeline({ onComplete: () => { loader.remove(); resolve(); } });
        out.to(".loader__inner", { y: -60, opacity: 0, duration: 0.7, ease: "power3.in" })
          .fromTo(loader, { clipPath: "ellipse(150% 100% at 50% 0%)" }, { clipPath: "ellipse(150% 0% at 50% 0%)", duration: 1.2, ease: "expo.inOut" }, 0.35)
          .add(() => { document.body.classList.remove("is-loading"); heroIntro(); }, 0.75);
      });
    });
  }

  /* ---------- Rotation de mots ---------- */
  (function rotator() {
    const wrap = $(".rotator");
    if (!wrap) return;
    const words = $$(".rotator__word", wrap);
    let i = 0;
    gsap.set(words, { yPercent: 110 });
    gsap.set(words[0], { yPercent: 0 });
    setInterval(() => {
      const cur = words[i];
      i = (i + 1) % words.length;
      const next = words[i];
      gsap.to(cur, { yPercent: -110, duration: 0.8, ease: "expo.inOut" });
      gsap.fromTo(next, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: "expo.inOut" });
    }, 2400);
  })();

  /* ---------- Parallaxe ---------- */
  $$("[data-speed]").forEach((el) => {
    const s = parseFloat(el.dataset.speed);
    gsap.to(el, { yPercent: s * 100, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
  });
  gsap.to(".hero__sun", { rotate: 8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- Titres : lignes masquées ---------- */
  $$(".reveal-words").forEach((el) => {
    SplitText.create(el, {
      type: "lines", mask: "lines", linesClass: "rline", autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 110, duration: 1.3, stagger: 0.12, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      }),
    });
  });
  $$(".eyebrow").forEach((el) => {
    if (el.closest(".hero, .expand, .univers")) return;
    const line = $(".eyebrow__line", el);
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 90%", once: true } });
    tl.from(el, { opacity: 0, y: 16, duration: 0.9, ease: "expo.out" });
    if (line) tl.from(line, { scaleX: 0, duration: 1.1, ease: "expo.out" }, 0.1);
  });
  $$(".lead").forEach((el) => {
    gsap.from(el, { opacity: 0, y: 40, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  const mm = gsap.matchMedia();

  /* ---------- EXPAND : l'image prend toute la place ---------- */
  (function expand() {
    const sec = $(".expand");
    if (!sec) return;
    const media = $(".expand__media", sec);
    const img = $("img", media);
    const shade = document.createElement("span");
    shade.className = "shade";
    media.appendChild(shade);
    const caption = $$(".expand__caption > *", sec);

    mm.add({ desk: "(min-width: 901px)", mob: "(max-width: 900px)" }, (ctx) => {
      const start = ctx.conditions.desk
        ? "inset(17% 35% 13% 35% round 400px 400px 0px 0px)"
        : "inset(22% 18% 18% 18% round 400px 400px 0px 0px)";
      gsap.set(caption, { opacity: 0, yPercent: 60 });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sec, start: "top top", end: "+=180%", scrub: 1, pin: true, anticipatePin: 1,
          onUpdate: (s) => setDark("expand", s.progress > 0.55 && s.isActive),
          onLeave: () => setDark("expand", false), onLeaveBack: () => setDark("expand", false),
        },
      });
      tl.fromTo(media, { clipPath: start, filter: "grayscale(1)" }, { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", filter: "grayscale(0)", duration: 1 }, 0)
        .fromTo(img || {}, { scale: 1.35 }, { scale: 1, duration: 1 }, 0)
        .to(".expand__word--l", { xPercent: -130, opacity: 0, duration: 0.7 }, 0)
        .to(".expand__word--r", { xPercent: 130, opacity: 0, duration: 0.7 }, 0)
        .to(shade, { opacity: 1, duration: 0.3 }, 0.65)
        .to(caption, { opacity: 1, yPercent: 0, stagger: 0.08, duration: 0.35, ease: "power2.out" }, 0.75)
        .to({}, { duration: 0.35 });
      return () => gsap.set(caption, { clearProps: "all" });
    });
  })();

  /* ---------- MANIFESTE : texte révélé mot à mot, scroll en pause ---------- */
  (function manifesto() {
    const p = $(".manifesto__text");
    if (!p) return;
    // découpage maison en mots (conserve les pastilles image)
    const frag = document.createDocumentFragment();
    Array.from(p.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(" "));
          else { const s = document.createElement("span"); s.className = "word"; s.textContent = part; frag.appendChild(s); }
        });
      } else frag.appendChild(n);
    });
    p.innerHTML = "";
    p.appendChild(frag);
    const items = Array.from(p.children);
    const fan = prepDraw($$(".manifesto__fan path"));

    mm.add({ desk: "(min-width: 901px)", mob: "(max-width: 900px)" }, (ctx) => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: ctx.conditions.desk
          ? { trigger: ".manifesto__pin", start: "top top", end: "+=140%", scrub: 0.8, pin: true }
          : { trigger: p, start: "top 80%", end: "bottom 45%", scrub: 0.8 },
      });
      tl.to(fan, { strokeDashoffset: 0, duration: 2, stagger: 0.3 }, 0);
      items.forEach((it, i) => {
        if (it.classList.contains("pill")) {
          tl.fromTo(it, { scale: 0, rotate: -25, width: 0 }, { scale: 1, rotate: 0, width: it.classList.contains("pill--deco") ? "1em" : "2.1em", duration: 1.2, ease: "back.out(2)" }, i * 0.18);
        } else {
          tl.fromTo(it, { opacity: 0.1 }, { opacity: 1, duration: 0.6 }, i * 0.18);
        }
      });
      tl.to({}, { duration: 1.5 });
    });
  })();

  /* ---------- PARCOURS : défilement horizontal ---------- */
  (function parcours() {
    const sec = $(".parcours");
    const track = $(".parcours__track");
    if (!sec || !track) return;
    const cards = $$(".pcard", track);

    mm.add("(min-width: 901px)", () => {
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const move = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: sec, start: "top top", end: () => "+=" + dist(), scrub: 1, pin: true, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (s) => gsap.set(".parcours__bar span", { scaleX: s.progress }),
        },
      });
      cards.forEach((card) => {
        const img = $(".ph > img, .ph", card);
        const media = $(".pcard__media", card);
        gsap.fromTo(media, { scale: 0.75, opacity: 0.2 }, {
          scale: media.classList.contains("pcard__media--diamond") ? 0.78 : 1, opacity: 1, ease: "power2.out",
          scrollTrigger: { trigger: card, containerAnimation: move, start: "left 100%", end: "left 55%", scrub: true },
        });
        gsap.from($(".pcard__year", card), {
          yPercent: 60, opacity: 0, ease: "power2.out",
          scrollTrigger: { trigger: card, containerAnimation: move, start: "left 90%", end: "left 50%", scrub: true },
        });
        if (img && img.tagName === "IMG") {
          gsap.fromTo(img, { xPercent: -8, scale: 1.2 }, { xPercent: 8, scale: 1.2, ease: "none", scrollTrigger: { trigger: card, containerAnimation: move, start: "left right", end: "right left", scrub: true } });
        }
      });
      gsap.from(".parcours__end svg", { rotate: -180, scale: 0, ease: "back.out(1.5)", scrollTrigger: { trigger: ".parcours__end", containerAnimation: move, start: "left 95%", end: "left 60%", scrub: true } });
    });

    mm.add("(max-width: 900px)", () => {
      cards.forEach((card) => {
        gsap.from(card, { y: 80, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: card, start: "top 88%", once: true } });
      });
    });
  })();

  /* ---------- UNIVERS : arrêt automatique du scroll pour l'animation ---------- */
  (function univers() {
    const sec = $(".univers");
    if (!sec) return;
    const rays = $$(".deco__sun line, .deco__sun path");
    gsap.set(rays, { strokeDasharray: 1, strokeDashoffset: 1 });
    const lines = prepDraw($$(".deco__lines path"));
    const frame = prepDraw($$(".deco__arch-frame path"));
    const titleSplit = new SplitText(".univers__title", { type: "lines,words", mask: "lines" });

    const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
    tl.from(titleSplit.words, { yPercent: 110, duration: 1.1, stagger: 0.04 }, 0)
      .to(rays, { strokeDashoffset: 0, duration: 1.6, stagger: { each: 0.015, from: "center" }, ease: "power3.out" }, 0.1)
      .to(lines, { strokeDashoffset: 0, duration: 1.4, stagger: 0.1, ease: "power2.inOut" }, 0.2)
      .from(".deco__arch", { clipPath: "inset(100% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" }, 0.2)
      .from(".deco__arch img", { scale: 1.4, duration: 2 }, 0.3)
      .to(frame, { strokeDashoffset: 0, duration: 1.6, stagger: 0.12, ease: "power2.inOut" }, 0.5)
      .from(".deco__steps span", { scaleX: 0, duration: 0.9, stagger: 0.1 }, 0.6)
      .from(".deco__quarter--l", { clipPath: "circle(0% at 100% 100%)", duration: 1.3, ease: "expo.inOut" }, 0.5)
      .from(".deco__quarter--r", { clipPath: "circle(0% at 0% 100%)", duration: 1.3, ease: "expo.inOut" }, 0.5)
      .from(".deco__fan", { scale: 0, rotate: -120, transformOrigin: "50% 100%", duration: 1.2, stagger: 0.1, ease: "back.out(1.6)" }, 0.9)
      .from(".deco__circle", { scale: 0, rotate: 90, duration: 1.2, stagger: 0.1, ease: "back.out(1.4)" }, 1.0)
      .from(".deco__diamond", { scale: 0, rotate: 180, duration: 1.2, ease: "back.out(2)" }, 1.2)
      .from(".univers__note", { opacity: 0, y: 20, duration: 0.8 }, 1.6);

    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      const top = sec.getBoundingClientRect().top;
      if (top < -window.innerHeight * 0.4) { tl.progress(1); return; }
      lenis.scrollTo(sec, {
        duration: 1.1, lock: true, force: true, easing: (t) => 1 - Math.pow(1 - t, 3),
        onComplete: () => {
          lenis.stop();
          sec.classList.add("is-playing");
          tl.play().then(() => { sec.classList.remove("is-playing"); lenis.start(); });
          // sécurité : on ne bloque jamais plus de 3,2 s
          setTimeout(() => lenis.start(), 3200);
        },
      });
    };
    ScrollTrigger.create({
      trigger: sec, start: "top 45%", once: true,
      onEnter: () => {
        play();
        // filet de sécurité : si le scroll automatique est interrompu, l'animation part quand même
        setTimeout(() => { if (tl.progress() === 0 && !tl.isActive()) { tl.play(); lenis.start(); } }, 1500);
      },
    });

    // les rayons tournent doucement ensuite
    gsap.to(".deco__sun", { rotate: 6, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: true } });
  })();

  /* ---------- CABINET : bento ---------- */
  (function bento() {
    const tiles = $$(".tile");
    gsap.set(tiles, { y: 90, opacity: 0, scale: 0.94 });
    ScrollTrigger.batch(tiles, {
      start: "top 90%", once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, scale: 1, duration: 1.3, stagger: 0.09, ease: "expo.out" }),
    });
    $$(".tile--img > img, .tile__circle > img").forEach((img) => {
      gsap.fromTo(img, { yPercent: -6, scale: 1.15 }, { yPercent: 6, scale: 1.15, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
  })();

  // Compteurs
  $$("[data-count]").forEach((el) => {
    const to = parseFloat(el.dataset.count);
    const from = parseFloat(el.dataset.from || "0");
    const o = { v: from };
    el.textContent = from;
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => gsap.to(o, { v: to, duration: 2.2, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(o.v)) }),
    });
  });

  /* ---------- SOINS : liste + image qui suit la souris ---------- */
  (function soins() {
    const rows = $$(".soin");
    gsap.from(rows, { x: -60, opacity: 0, duration: 1.2, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: ".soins__list", start: "top 85%", once: true } });
    if (!finePointer) return;
    const list = $(".soins__list");
    const prev = $(".preview");
    const inner = $(".preview__inner");
    const imgs = $$(".preview__img");
    const xTo = gsap.quickTo(prev, "x", { duration: 0.7, ease: "power3" });
    const yTo = gsap.quickTo(prev, "y", { duration: 0.7, ease: "power3" });
    const rTo = gsap.quickTo(inner, "rotation", { duration: 0.9, ease: "power3" });
    let lastX = 0;
    list.addEventListener("mousemove", (e) => {
      xTo(e.clientX); yTo(e.clientY);
      rTo(gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.8));
      lastX = e.clientX;
    });
    list.addEventListener("mouseenter", (e) => {
      gsap.set(prev, { x: e.clientX, y: e.clientY });
      gsap.to(inner, { scale: 1, duration: 0.7, ease: "expo.out" });
    });
    list.addEventListener("mouseleave", () => gsap.to(inner, { scale: 0, rotation: 0, duration: 0.6, ease: "expo.out" }));
    rows.forEach((row) => {
      row.addEventListener("mouseenter", () => {
        const i = parseInt(row.dataset.index, 10);
        imgs.forEach((im, k) => {
          if (k === i) { im.classList.add("is-active"); gsap.fromTo(im, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "expo.out" }); }
          else im.classList.remove("is-active");
        });
      });
    });
  })();

  /* ---------- SÉANCE : cartes empilées ---------- */
  (function stack() {
    const cards = $$(".scard");
    cards.forEach((card, i) => {
      gsap.from($$(".scard__text > *", card), { y: 50, opacity: 0, duration: 1.1, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: card, start: "top 75%", once: true } });
      const next = cards[i + 1];
      if (!next) return;
      gsap.fromTo(card, { scale: 1, filter: "brightness(1)" }, {
        scale: 0.9 + i * 0.015, filter: "brightness(0.82)", ease: "none",
        scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: true },
      });
    });
  })();

  /* ---------- CONSEILS ---------- */
  (function conseils() {
    const titleParts = $$(".conseils__title .split-chars").map((el) => new SplitText(el, { type: "words,chars", charsClass: "char" }));
    const chars = titleParts.flatMap((s) => s.chars);
    gsap.from(chars, {
      yPercent: 100, rotateX: -90, opacity: 0, transformOrigin: "50% 100%", duration: 1.2, stagger: 0.035, ease: "expo.out",
      scrollTrigger: { trigger: ".conseils__title", start: "top 85%", once: true },
    });
    gsap.from(".tabs", { y: 40, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".tabs", start: "top 90%", once: true } });
    gsap.from(".panel.is-active .tip", { y: 80, opacity: 0, duration: 1.2, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ".panels", start: "top 88%", once: true } });
    gsap.to(".conseils__sun", { rotate: 172, ease: "none", scrollTrigger: { trigger: ".conseils", start: "top bottom", end: "bottom top", scrub: true } });
    const sun = $$(".conseils__sun line, .conseils__sun path");
    gsap.fromTo(sun, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2, stagger: { each: 0.02, from: "center" }, ease: "power3.out", scrollTrigger: { trigger: ".conseils", start: "top 70%", once: true } });
    setupTabs(true);
  })();

  /* ---------- FORMATIONS : bandeaux qui suivent le scroll ---------- */
  (function marquee() {
    const rows = $$(".marquee__row");
    let visible = false;
    ScrollTrigger.create({ trigger: ".marquee", start: "top bottom", end: "bottom top", onToggle: (s) => (visible = s.isActive) });
    const state = rows.map((row, i) => ({ row, dir: i % 2 ? 1 : -1, x: i % 2 ? -row.children[0].offsetWidth : 0, w: row.children[0].offsetWidth }));
    window.addEventListener("resize", () => state.forEach((s) => (s.w = s.row.children[0].offsetWidth)));
    gsap.ticker.add(() => {
      if (!visible) return;
      const v = lenis.velocity || 0;
      const sign = lenis.direction === -1 ? -1 : 1;
      state.forEach((s) => {
        s.x += s.dir * sign * (0.7 + Math.min(Math.abs(v) * 0.35, 18));
        s.x = gsap.utils.wrap(-s.w, 0, s.x);
        s.row.style.transform = `translate3d(${s.x}px,0,0)`;
      });
    });
    gsap.from(".course", { y: 80, opacity: 0, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: ".course", start: "top 88%", once: true } });
    gsap.from(".facts li", { y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ".facts", start: "top 92%", once: true } });
    gsap.from(".formations__arch", { clipPath: "inset(100% 0% 0% 0% round 999px 999px 30px 30px)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: ".formations__media", start: "top 80%", once: true } });
    gsap.from(".formations__circle", { scale: 0, rotate: -90, duration: 1.3, ease: "back.out(1.5)", scrollTrigger: { trigger: ".formations__media", start: "top 60%", once: true } });
  })();

  /* ---------- CONTACT ---------- */
  (function contact() {
    const parts = $$(".contact__title .split-chars").map((el) => new SplitText(el, { type: "words,chars", charsClass: "char" }));
    const chars = parts.flatMap((s) => s.chars);
    gsap.from(chars, { yPercent: 115, duration: 1.4, stagger: 0.03, ease: "expo.out", scrollTrigger: { trigger: ".contact__title", start: "top 85%", once: true } });
    if (finePointer) {
      chars.forEach((c) => {
        c.addEventListener("mouseenter", () => gsap.to(c, { yPercent: -14, color: "#d4b27a", fontStyle: "italic", duration: 0.35, ease: "power3.out" }));
        c.addEventListener("mouseleave", () => gsap.to(c, { yPercent: 0, color: "", duration: 0.8, ease: "elastic.out(1, 0.4)", onComplete: () => gsap.set(c, { clearProps: "color,fontStyle" }) }));
      });
    }
    gsap.from(".contact__lead", { y: 30, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".contact__lead", start: "top 90%", once: true } });
    gsap.from(".ccard", { y: 70, opacity: 0, duration: 1.2, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ".contact__grid", start: "top 90%", once: true } });
    gsap.from(".big-cta", { scale: 0, rotate: -120, duration: 1.4, ease: "back.out(1.4)", scrollTrigger: { trigger: ".contact", start: "top 60%", once: true } });
    const sun = $$(".contact__sun line, .contact__sun path");
    gsap.fromTo(sun, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, stagger: { each: 0.02, from: "center" }, ease: "power3.out", scrollTrigger: { trigger: ".contact", start: "top 60%", once: true } });
  })();

  /* ---------- Démarrage ---------- */
  // header clair sur les sections sombres (créé après les pins pour des positions justes)
  $$("[data-theme='dark']").forEach((sec, i) => {
    ScrollTrigger.create({ trigger: sec, start: "top 44px", end: "bottom 44px", onToggle: (s) => setDark("s" + i, s.isActive) });
  });
  runLoader().then(() => {
    lenis.start();
    ScrollTrigger.refresh();
  });
  // recalcul quand les vraies images arrivent
  $$(".ph img").forEach((img) => img.addEventListener("load", () => ScrollTrigger.refresh(), { once: true }));

  /* =========================================================
     Fonctions partagées
     ========================================================= */
  function setupTabs(animated) {
    const tabs = $$(".tab");
    const ink = $(".tabs__ink");
    const moveInk = (t) => { if (ink) { ink.style.width = t.offsetWidth + "px"; ink.style.transform = `translate(${t.offsetLeft - 8}px, ${t.offsetTop - 8}px)`; } };
    const active = () => tabs.find((t) => t.classList.contains("is-active"));
    requestAnimationFrame(() => moveInk(active()));
    window.addEventListener("resize", () => moveInk(active()));
    const select = (tab) => {
      const cur = active();
      if (cur === tab) return;
      const curPanel = document.getElementById(cur.getAttribute("aria-controls"));
      const nextPanel = document.getElementById(tab.getAttribute("aria-controls"));
      tabs.forEach((t) => { const on = t === tab; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; });
      moveInk(tab);
      const show = () => {
        curPanel.hidden = true; curPanel.classList.remove("is-active");
        nextPanel.hidden = false; nextPanel.classList.add("is-active");
        if (animated) gsap.fromTo($$(".tip", nextPanel), { y: 70, opacity: 0, rotate: 2 }, { y: 0, opacity: 1, rotate: 0, duration: 0.9, stagger: 0.08, ease: "expo.out" });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      };
      if (animated) gsap.to($$(".tip", curPanel), { y: -30, opacity: 0, duration: 0.3, stagger: 0.04, ease: "power2.in", onComplete: show });
      else show();
    };
    tabs.forEach((t, i) => {
      t.tabIndex = t.classList.contains("is-active") ? 0 : -1;
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        n.focus(); select(n);
      });
    });
  }

  function setupMenu(lenisRef) {
    const burger = $(".burger");
    const menu = $(".menu");
    if (!burger || !menu) return;
    const links = $$(".menu__nav a span, .menu__nav a i");
    const foot = $(".menu__foot");
    let open = false;
    const origin = () => {
      const r = burger.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      return { x, y, R };
    };
    const toggle = (state) => {
      open = state;
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", open);
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      menu.setAttribute("aria-hidden", !open);
      const { x, y, R } = origin();
      if (!window.gsap || reduce) { menu.style.visibility = open ? "visible" : "hidden"; menu.style.clipPath = open ? "none" : ""; return; }
      if (open) {
        lenisRef && lenisRef.stop();
        gsap.set(menu, { visibility: "visible" });
        gsap.fromTo(menu, { clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${R}px at ${x}px ${y}px)`, duration: 1, ease: "expo.inOut" });
        gsap.fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.05, ease: "expo.out", delay: 0.35 });
        gsap.fromTo(foot, { opacity: 0, y: 20 }, { opacity: 0.8, y: 0, duration: 0.8, delay: 0.7 });
        gsap.fromTo(".menu__sun", { rotate: -30, opacity: 0 }, { rotate: 0, opacity: 0.25, duration: 1.6, ease: "expo.out", delay: 0.2 });
      } else {
        gsap.to(menu, { clipPath: `circle(0px at ${x}px ${y}px)`, duration: 0.8, ease: "expo.inOut", onComplete: () => gsap.set(menu, { visibility: "hidden" }) });
        lenisRef && lenisRef.start();
      }
    };
    burger.addEventListener("click", () => toggle(!open));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) toggle(false); });
    closeMenuIfOpen = () => { if (open) toggle(false); };
    if (!lenisRef) $$(".menu__nav a").forEach((a) => a.addEventListener("click", () => toggle(false)));
  }
})();
